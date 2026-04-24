const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Inventory = require('../../models/Inventory');
const Product = require('../../models/Product');
const { body, validationResult } = require('express-validator');

// @route   GET /api/admin/inventory
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { productId, lowStock, expiring } = req.query;
        const filter = {};

        if (productId) filter.product = productId;

        let query = Inventory.find(filter)
            .populate('product', 'name sku category price')
            .sort({ expiryDate: 1 });

        let inventoryItems = await query;

        // Filter low stock
        if (lowStock === 'true') {
            inventoryItems = inventoryItems.filter(
                (item) => item.quantityInStock <= item.lowStockThreshold
            );
        }

        // Filter expiring within 30 days
        if (expiring === 'true') {
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            inventoryItems = inventoryItems.filter(
                (item) => item.expiryDate <= thirtyDays && item.quantityInStock > 0
            );
        }

        res.json(inventoryItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/inventory/summary
router.get('/summary', auth, roleCheck('admin'), async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).select('name sku category stock');

        const summary = await Promise.all(
            products.map(async (product) => {
                const batches = await Inventory.find({ product: product._id });
                const totalStock = product.stock || 0;
                const threshold = batches.length > 0 ? batches[0].lowStockThreshold : 5;

                const nearestExpiry = batches
                    .filter((b) => b.quantityInStock > 0)
                    .sort((a, b) => a.expiryDate - b.expiryDate)[0];

                let status = 'normal';
                if (totalStock === 0) status = 'out_of_stock';
                else if (totalStock <= threshold) status = 'low';

                const now = new Date();
                if (nearestExpiry && nearestExpiry.expiryDate <= now) status = 'expired';
                else if (
                    nearestExpiry &&
                    nearestExpiry.expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                ) {
                    if (status === 'normal') status = 'expiring_soon';
                }

                return {
                    product: product,
                    productName: product.name,
                    totalStock,
                    nearestExpiry: nearestExpiry ? nearestExpiry.expiryDate : null,
                    status,
                    batchCount: batches.length,
                };
            })
        );

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/inventory
router.post(
    '/',
    auth,
    roleCheck('admin'),
    [
        body('product').notEmpty().withMessage('Product ID is required'),
        body('batchNumber').notEmpty().withMessage('Batch number is required'),
        body('quantityInStock').isNumeric().withMessage('Quantity must be a number'),
        body('expiryDate').notEmpty().withMessage('Expiry date is required'),
        body('costPrice').isNumeric().withMessage('Cost price must be a number'),
        body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const inventory = await Inventory.create({
                ...req.body,
                lastRestockedDate: new Date(),
            });

            res.status(201).json(inventory);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   PUT /api/admin/inventory/:id
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastRestockedDate: new Date() },
            { new: true }
        );

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory batch not found' });
        }

        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/inventory/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndDelete(req.params.id);
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory batch not found' });
        }
        res.json({ message: 'Inventory batch deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
