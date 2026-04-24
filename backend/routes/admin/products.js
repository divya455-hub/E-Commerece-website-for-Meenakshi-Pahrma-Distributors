const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Inventory = require('../../models/Inventory');
const { body, validationResult } = require('express-validator');

// Configure multer for product image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'products');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext || mime) cb(null, true);
        else cb(new Error('Only images (jpg, png, webp) are allowed'));
    },
});

// ==================== CATEGORIES ====================

// @route   POST /api/admin/products/categories
router.post(
    '/categories',
    auth,
    roleCheck('admin'),
    [body('name').notEmpty().withMessage('Category name is required')],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, description, imageUrl } = req.body;
            const category = await Category.create({ name, description, imageUrl });
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   PUT /api/admin/products/categories/:id
router.put('/categories/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { name, description, imageUrl, isActive } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, imageUrl, isActive },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/products/categories/:id
router.delete('/categories/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        // Check if category has products
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete category. ${productsCount} products are using it.`,
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== PRODUCTS ====================

// @route   POST /api/admin/products
router.post(
    '/',
    auth,
    roleCheck('admin'),
    upload.single('productImage'),
    async (req, res) => {
        try {
            const { name, category, manufacturer, price, costPrice } = req.body;
            if (!name || !category || !manufacturer || price == null || costPrice == null) {
                return res.status(400).json({ message: 'Name, category, manufacturer, price and cost price are required' });
            }

            const productData = {
                ...req.body,
                price: Number(req.body.price),
                costPrice: Number(req.body.costPrice),
                gstRate: Number(req.body.gstRate || 12),
                hsnCode: req.body.hsnCode ? Number(req.body.hsnCode) : undefined,
                stock: req.body.stock != null ? Number(req.body.stock) : 0,
                requiresPrescription: req.body.requiresPrescription === 'true' || req.body.requiresPrescription === true,
                isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
                isActive: req.body.isActive === undefined ? true : (req.body.isActive === 'true' || req.body.isActive === true),
            };

            if (req.file) {
                productData.imageUrl = `/uploads/products/${req.file.filename}`;
            }

            const product = await Product.create(productData);
            res.status(201).json(product);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: 'SKU already exists' });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   PUT /api/admin/products/:id
router.put('/:id', auth, roleCheck('admin'), upload.single('productImage'), async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            price: Number(req.body.price),
            costPrice: Number(req.body.costPrice),
            gstRate: Number(req.body.gstRate || 12),
            hsnCode: req.body.hsnCode ? Number(req.body.hsnCode) : undefined,
            stock: req.body.stock != null ? Number(req.body.stock) : undefined,
            requiresPrescription: req.body.requiresPrescription === 'true' || req.body.requiresPrescription === true,
            isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
            isActive: req.body.isActive === undefined ? true : (req.body.isActive === 'true' || req.body.isActive === true),
        };

        if (req.file) {
            // Delete old image if it exists
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct?.imageUrl) {
                const oldPath = path.join(__dirname, '..', '..', oldProduct.imageUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.imageUrl = `/uploads/products/${req.file.filename}`;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/products/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/products (all products including inactive)
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { search, category, skip = 0, limit = 100 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) filter.category = category;

        const products = await Product.find(filter)
            .populate('category', 'name')
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(filter);
        res.json({ products, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
