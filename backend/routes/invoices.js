const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const generateInvoice = require('../utils/invoiceGenerator');
const path = require('path');

// @route   POST /api/invoices/generate/:orderId
router.post('/generate/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            customer: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if invoice already exists
        const existing = await Invoice.findOne({ order: order._id });
        if (existing) {
            return res.json(existing);
        }

        const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
        const filePath = await generateInvoice(order, invoiceNumber);

        const invoice = await Invoice.create({
            order: order._id,
            invoiceNumber,
            invoiceDate: new Date(),
            filePath,
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Invoice error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/invoices/:orderId
router.get('/:orderId', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ order: req.params.orderId });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/invoices/:orderId/download
router.get('/:orderId/download', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ order: req.params.orderId });

        if (!invoice || !invoice.filePath) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.download(invoice.filePath, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
