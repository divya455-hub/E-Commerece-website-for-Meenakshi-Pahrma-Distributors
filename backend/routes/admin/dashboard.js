const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Inventory = require('../../models/Inventory');
const Notification = require('../../models/Notification');

// @route   GET /api/admin/dashboard
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        // Total orders
        const totalOrders = await Order.countDocuments();
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // Total sales
        const salesResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } },
        ]);
        const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

        // Total customers
        const totalCustomers = await User.countDocuments({ role: 'customer' });

        // Total products
        const totalProducts = await Product.countDocuments({ isActive: true });

        // Low stock alerts
        const lowStockItems = await Inventory.aggregate([
            { $match: { isAvailable: true } },
            {
                $group: {
                    _id: '$product',
                    totalStock: { $sum: '$quantityInStock' },
                    threshold: { $min: '$lowStockThreshold' },
                },
            },
            {
                $match: {
                    $expr: { $lte: ['$totalStock', '$threshold'] },
                },
            },
        ]);

        const lowStockProducts = await Product.find({
            _id: { $in: lowStockItems.map((i) => i._id) },
        }).select('name sku');

        // Expiry alerts (products expiring within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringBatches = await Inventory.find({
            isAvailable: true,
            quantityInStock: { $gt: 0 },
            expiryDate: { $lte: thirtyDaysFromNow },
        })
            .populate('product', 'name sku')
            .sort({ expiryDate: 1 })
            .limit(20);

        // Daily sales for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailySales = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$finalAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Top 5 products by revenue
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productName',
                    revenue: { $sum: '$items.subtotal' },
                    unitsSold: { $sum: '$items.quantity' },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
        ]);

        // Payment method distribution
        const paymentMethods = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$finalAmount' } } },
        ]);

        // Recent orders
        const recentOrders = await Order.find()
            .populate('customer', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(10);

        // Unread notifications
        const unreadNotifications = await Notification.countDocuments({
            recipient: null,
            isRead: false,
        });

        res.json({
            totalOrders,
            totalSales: Math.round(totalSales * 100) / 100,
            totalCustomers,
            totalProducts,
            ordersByStatus,
            lowStockAlerts: lowStockProducts,
            expiryAlerts: expiringBatches,
            recentOrders,
            unreadNotifications,
            dailySales,
            topProducts,
            paymentMethods,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
