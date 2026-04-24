const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        const {
            category,
            search,
            featured,
            requiresPrescription,
            minPrice,
            maxPrice,
            skip = 0,
            limit = 100,
        } = req.query;

        const filter = { isActive: true };

        if (category) filter.category = category;
        if (featured === 'true') filter.isFeatured = true;
        if (requiresPrescription !== undefined) {
            filter.requiresPrescription = requiresPrescription === 'true';
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
            ];
        }

        const products = await Product.find(filter)
            .populate('category', 'name')
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // Attach stock info from product.stock field
        const productsWithStock = products.map((product) => {
            const productObj = product.toObject();
            const stockQuantity = productObj.stock || 0;
            return {
                ...productObj,
                stockQuantity,
                inStock: stockQuantity > 0,
            };
        });

        const total = await Product.countDocuments(filter);

        res.json({
            products: productsWithStock,
            total,
            skip: parseInt(skip),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get inventory batches for expiry info
        const inventoryBatches = await Inventory.find({
            product: product._id,
            isAvailable: true,
            quantityInStock: { $gt: 0 },
        }).sort({ expiryDate: 1 });

        const productObj = product.toObject();
        const stockQuantity = productObj.stock || 0;

        // Get nearest expiry
        const nearestExpiry = inventoryBatches.length > 0 ? inventoryBatches[0].expiryDate : null;

        res.json({
            ...productObj,
            stockQuantity,
            inStock: stockQuantity > 0,
            nearestExpiry,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
