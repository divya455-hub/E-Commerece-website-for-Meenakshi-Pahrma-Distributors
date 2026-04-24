const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// @route   GET /api/inventory/:productId
router.get('/:productId', async (req, res) => {
    try {
        const batches = await Inventory.find({
            product: req.params.productId,
            isAvailable: true,
        })
            .sort({ expiryDate: 1 })
            .populate('product', 'name');

        const totalStock = batches.reduce((sum, b) => sum + b.quantityInStock, 0);

        res.json({
            productId: req.params.productId,
            totalStock,
            batches,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
