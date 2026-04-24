const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Order = require('../../models/Order');
const Payment = require('../../models/Payment');
const Notification = require('../../models/Notification');
const Inventory = require('../../models/Inventory');
const Refund = require('../../models/Refund');
const Invoice = require('../../models/Invoice');
const generateInvoice = require('../../utils/invoiceGenerator');

// @route   GET /api/admin/orders
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { status, skip = 0, limit = 100 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate('customer', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);
        res.json({ orders, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/orders/:id
router.get('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'firstName lastName email phone')
            .populate('items.product', 'name imageUrl sku');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const payments = await Payment.find({ order: order._id });
        const refunds = await Refund.find({ order: order._id });
        const invoices = await Invoice.find({ order: order._id });

        res.json({ ...order.toObject(), payments, refunds, invoices });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/orders/:id/status
router.put('/:id/status', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const previousStatus = order.status;
        order.status = status;

        if (status === 'cancelled' && previousStatus !== 'cancelled') {
            order.cancelledAt = new Date();

            // Restore inventory
            for (const item of order.items) {
                for (const batch of item.batches) {
                    await Inventory.findByIdAndUpdate(batch.inventory, {
                        $inc: { quantityInStock: batch.quantity },
                        isAvailable: true,
                    });
                }
            }
        }

        // Add tracking event
        const eventLabels = {
            confirmed: 'Order Confirmed',
            processing: 'Order Being Processed',
            shipped: 'Order Shipped',
            delivered: 'Order Delivered',
            cancelled: 'Order Cancelled',
        };
        order.tracking.push({
            event: eventLabels[status] || `Status changed to ${status}`,
            timestamp: new Date(),
            note: `Order status updated from ${previousStatus} to ${status}`,
        });

        await order.save();

        // Generate invoice on delivery
        if (status === 'delivered') {
            const existingInvoice = await Invoice.findOne({ order: order._id });
            if (!existingInvoice) {
                const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
                const filePath = await generateInvoice(order, invoiceNumber);
                await Invoice.create({
                    order: order._id,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    filePath,
                });
            }
        }

        // Notify customer
        await Notification.create({
            title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your order ${order.orderNumber} status has been updated to ${status}`,
            type: status === 'delivered' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
            recipient: order.customer,
            order: order._id,
        });

        res.json(order);
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
