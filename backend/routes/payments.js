const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @route   GET /api/payments/order/:orderId
router.get('/order/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            customer: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const payments = await Payment.find({ order: order._id });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/payments/process (dummy payment)
router.post('/process', auth, async (req, res) => {
    try {
        const { orderId, method } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            customer: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if payment already exists
        const existing = await Payment.findOne({ order: orderId, status: 'completed' });
        if (existing) {
            return res.status(400).json({ message: 'Payment already completed' });
        }

        // Simulate dummy payment processing
        const payment = await Payment.findOneAndUpdate(
            { order: orderId },
            {
                status: 'completed',
                method: method || order.paymentMethod,
                gatewayTransactionId: `TXN-DUMMY-${Date.now()}`,
                paidAt: new Date(),
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Update order status
        order.status = 'confirmed';
        await order.save();

        res.json({ message: 'Payment processed successfully', payment });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
