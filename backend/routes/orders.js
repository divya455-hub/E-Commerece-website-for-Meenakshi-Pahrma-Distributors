const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Prescription = require('../models/Prescription');
const Refund = require('../models/Refund');
const generateOrderNumber = require('../utils/generateOrderNumber');

// @route   POST /api/orders
router.post('/', auth, async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod, orderType = 'delivery' } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ customer: req.user._id }).populate({
            path: 'items.product',
            select: 'name price requiresPrescription hsnCode gstRate category',
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Get shipping address
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        let shippingAddress = null;

        if (orderType === 'delivery') {
            if (shippingAddressId) {
                shippingAddress = user.addresses.id(shippingAddressId);
            } else {
                shippingAddress = user.addresses.find((a) => a.isDefault);
            }

            if (!shippingAddress) {
                return res.status(400).json({ message: 'Shipping address is required for delivery orders' });
            }
        }

        // Validate stock and build order items
        const orderItems = [];
        let totalAmount = 0;
        let taxAmount = 0;
        const taxDetails = {};

        for (const cartItem of cart.items) {
            const product = cartItem.product;

            // Check prescription requirement
            if (product.requiresPrescription) {
                const prescription = await Prescription.findOne({
                    customer: req.user._id,
                    status: 'approved',
                    isUsed: false,
                    'items.product': product._id,
                });

                if (!prescription) {
                    return res.status(400).json({
                        message: `Approved prescription required for ${product.name}`,
                    });
                }
            }

            // Get available inventory batches (FIFO by expiry)
            const batches = await Inventory.find({
                product: product._id,
                isAvailable: true,
                quantityInStock: { $gt: 0 },
                expiryDate: { $gt: new Date() },
            }).sort({ expiryDate: 1 });

            let remainingQty = cartItem.quantity;
            const totalAvailable = batches.reduce((sum, b) => sum + b.quantityInStock, 0);

            if (totalAvailable < cartItem.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${product.name}. Available: ${totalAvailable}`,
                });
            }

            const itemBatches = [];

            for (const batch of batches) {
                if (remainingQty <= 0) break;

                const deductQty = Math.min(batch.quantityInStock, remainingQty);
                batch.quantityInStock -= deductQty;

                if (batch.quantityInStock === 0) {
                    batch.isAvailable = false;
                }

                await batch.save();

                itemBatches.push({
                    inventory: batch._id,
                    quantity: deductQty,
                    batchNumber: batch.batchNumber,
                    expiryDate: batch.expiryDate,
                });

                remainingQty -= deductQty;
            }

            // Update Product.stock to reflect the deduction
            await Product.findByIdAndUpdate(product._id, {
                $inc: { stock: -cartItem.quantity },
            });

            const subtotal = product.price * cartItem.quantity;
            totalAmount += subtotal;

            // Accumulate tax by HSN code
            const hsnKey = product.hsnCode || 0;
            const gstRate = product.gstRate || 12;
            const gstAmount = (subtotal * gstRate) / 100;

            if (!taxDetails[hsnKey]) {
                taxDetails[hsnKey] = { hsnCode: hsnKey, taxableAmount: 0, gstRate, gstAmount: 0 };
            }
            taxDetails[hsnKey].taxableAmount += subtotal;
            taxDetails[hsnKey].gstAmount += gstAmount;
            taxAmount += gstAmount;

            // Find and mark prescription as used
            let prescriptionId = null;
            if (product.requiresPrescription) {
                const prescription = await Prescription.findOne({
                    customer: req.user._id,
                    status: 'approved',
                    isUsed: false,
                    'items.product': product._id,
                });
                if (prescription) {
                    prescriptionId = prescription._id;
                }
            }

            orderItems.push({
                product: product._id,
                productName: product.name,
                quantity: cartItem.quantity,
                unitPrice: product.price,
                subtotal,
                requiresPrescription: product.requiresPrescription,
                prescription: prescriptionId,
                prescriptionVerified: product.requiresPrescription ? true : false,
                batches: itemBatches,
            });
        }

        const shippingCharges = totalAmount >= 500 ? 0 : 40;
        const finalAmount = totalAmount + taxAmount + shippingCharges;

        // Create order
        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            customer: req.user._id,
            items: orderItems,
            totalAmount: Math.round(totalAmount * 100) / 100,
            shippingCharges,
            taxAmount: Math.round(taxAmount * 100) / 100,
            discountAmount: 0,
            finalAmount: Math.round(finalAmount * 100) / 100,
            taxDetails: Object.values(taxDetails),
            orderType,
            shippingAddress: shippingAddress
                ? {
                    addressLine1: shippingAddress.addressLine1,
                    addressLine2: shippingAddress.addressLine2,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                    country: shippingAddress.country,
                }
                : null,
            paymentMethod: paymentMethod || 'cod',
            status: 'pending',
            tracking: [
                { event: 'Order Placed', timestamp: new Date(), note: 'Your order has been placed successfully' },
            ],
        });

        // Mark prescriptions as used
        for (const item of orderItems) {
            if (item.prescription) {
                await Prescription.findByIdAndUpdate(item.prescription, {
                    isUsed: true,
                    usedInOrder: order._id,
                });
            }
        }

        // Create dummy payment
        await Payment.create({
            order: order._id,
            paymentGateway: 'dummy',
            amount: order.finalAmount,
            method: paymentMethod || 'cod',
            status: paymentMethod === 'cod' ? 'pending' : 'completed',
            gatewayTransactionId: `TXN-${Date.now()}`,
            paidAt: paymentMethod === 'cod' ? null : new Date(),
        });

        // Clear cart
        cart.items = [];
        await cart.save();

        // Send notification
        await Notification.create({
            title: 'New Order Placed',
            message: `Order ${order.orderNumber} placed by ${user.firstName} ${user.lastName}`,
            type: 'info',
            recipient: null,
            order: order._id,
            actionUrl: `/admin/orders/${order._id}`,
        });

        await Notification.create({
            title: 'Order Confirmed',
            message: `Your order ${order.orderNumber} has been placed successfully`,
            type: 'success',
            recipient: req.user._id,
            order: order._id,
            actionUrl: `/orders/${order._id}`,
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Order create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders
router.get('/', auth, async (req, res) => {
    try {
        const { status, skip = 0, limit = 100 } = req.query;

        const filter = { customer: req.user._id };
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.json({ orders, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.user._id,
        }).populate('items.product', 'name imageUrl');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get payments
        const payments = await Payment.find({ order: order._id });

        res.json({ ...order.toObject(), payments });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/orders/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const { reason } = req.body || {};

        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                message: `Cannot cancel order with status: ${order.status}`,
            });
        }

        // Restore inventory
        for (const item of order.items) {
            let restoredQty = 0;
            for (const batch of item.batches) {
                await Inventory.findByIdAndUpdate(batch.inventory, {
                    $inc: { quantityInStock: batch.quantity },
                    isAvailable: true,
                });
                restoredQty += batch.quantity;
            }

            // Restore Product.stock
            if (restoredQty > 0) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: restoredQty },
                });
            }

            // Release prescription
            if (item.prescription) {
                await Prescription.findByIdAndUpdate(item.prescription, {
                    isUsed: false,
                    usedInOrder: null,
                });
            }
        }

        // Calculate cancellation fee
        const cancellationFee =
            (order.finalAmount * (order.cancellationFeePercentage || 10)) / 100;
        const refundAmount = order.finalAmount - cancellationFee;

        // Create refund
        await Refund.create({
            order: order._id,
            amount: refundAmount,
            cancellationFee,
            refundPolicy: 'partial',
            reason: reason || 'Customer requested cancellation',
            status: 'completed',
            refundMethod: order.paymentMethod,
            processedAt: new Date(),
        });

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason || 'Customer requested cancellation';
        await order.save();

        // Notification
        await Notification.create({
            title: 'Order Cancelled',
            message: `Order ${order.orderNumber} has been cancelled`,
            type: 'warning',
            recipient: req.user._id,
            order: order._id,
        });

        res.json({ message: 'Order cancelled successfully', refundAmount, cancellationFee });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders/stats/me
router.get('/stats/me', auth, async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $match: { customer: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$finalAmount' },
                },
            },
        ]);

        const totalOrders = await Order.countDocuments({ customer: req.user._id });
        const totalSpent = await Order.aggregate([
            { $match: { customer: req.user._id, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } },
        ]);

        res.json({
            totalOrders,
            totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
            byStatus: stats,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
