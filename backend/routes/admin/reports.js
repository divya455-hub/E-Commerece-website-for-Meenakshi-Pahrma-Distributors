const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Order = require('../../models/Order');
const Product = require('../../models/Product');

// @route   GET /api/admin/reports
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const filter = {};

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }

        const orders = await Order.find(filter)
            .populate('customer', 'firstName lastName email phone')
            .sort({ createdAt: -1 });

        // Summary stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
        const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Status breakdown
        const byStatus = {};
        orders.forEach(o => {
            byStatus[o.status] = (byStatus[o.status] || 0) + 1;
        });

        // Payment method breakdown
        const byPayment = {};
        orders.forEach(o => {
            const method = o.paymentMethod || 'unknown';
            byPayment[method] = (byPayment[method] || 0) + 1;
        });

        // Top products
        const productCounts = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const name = item.productName || 'Unknown';
                if (!productCounts[name]) productCounts[name] = { name, quantity: 0, revenue: 0 };
                productCounts[name].quantity += item.quantity;
                productCounts[name].revenue += item.subtotal || (item.unitPrice || 0) * item.quantity;
            });
        });
        const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

        // Top bought products (by quantity)
        const topBoughtProducts = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

        // Top customers (by total spent)
        const customerCounts = {};
        orders.forEach(o => {
            if (!o.customer) return;
            const custId = o.customer._id?.toString() || 'unknown';
            const custName = o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'N/A';
            const custEmail = o.customer?.email || '';
            const custPhone = o.customer?.phone || '';
            if (!customerCounts[custId]) {
                customerCounts[custId] = { name: custName, email: custEmail, phone: custPhone, totalOrders: 0, totalSpent: 0 };
            }
            customerCounts[custId].totalOrders += 1;
            customerCounts[custId].totalSpent += o.finalAmount || o.totalAmount || 0;
        });
        const topCustomers = Object.values(customerCounts).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

        // Daily revenue for charting
        const dailyRevenue = {};
        orders.forEach(o => {
            const day = new Date(o.createdAt).toISOString().split('T')[0];
            if (!dailyRevenue[day]) dailyRevenue[day] = { date: day, orders: 0, revenue: 0 };
            dailyRevenue[day].orders += 1;
            dailyRevenue[day].revenue += o.finalAmount || o.totalAmount || 0;
        });

        res.json({
            summary: {
                totalOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalItems,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                byStatus,
                byPayment,
            },
            topProducts,
            topBoughtProducts,
            topCustomers,
            dailyRevenue: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
            orders: orders.map(o => ({
                orderNumber: o.orderNumber,
                customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'N/A',
                date: o.createdAt,
                items: o.items?.length || 0,
                total: o.finalAmount || o.totalAmount || 0,
                status: o.status,
                paymentMethod: o.paymentMethod,
            })),
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
