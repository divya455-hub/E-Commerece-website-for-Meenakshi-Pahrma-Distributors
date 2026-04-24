const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Prescription = require('../models/Prescription');

// Configure multer for prescription uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'prescriptions'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `prescription-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only images (jpg, png) and PDFs are allowed'));
        }
    },
});

// @route   POST /api/prescriptions/upload
router.post('/upload', auth, upload.single('prescription'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Prescription file is required' });
        }

        const { productIds, quantities } = req.body;

        let items = [];
        if (productIds) {
            const ids = Array.isArray(productIds) ? productIds : [productIds];
            const qtys = quantities
                ? Array.isArray(quantities)
                    ? quantities
                    : [quantities]
                : ids.map(() => 1);

            items = ids.map((id, idx) => ({
                product: id,
                quantity: parseInt(qtys[idx]) || 1,
            }));
        }

        const prescription = await Prescription.create({
            customer: req.user._id,
            imageUrl: `/uploads/prescriptions/${req.file.filename}`,
            status: 'pending',
            items,
        });

        res.status(201).json(prescription);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/prescriptions
router.get('/', auth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { customer: req.user._id };
        if (status) filter.status = status;

        const prescriptions = await Prescription.find(filter)
            .populate('items.product', 'name price imageUrl')
            .sort({ uploadedAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/prescriptions/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const prescription = await Prescription.findOne({
            _id: req.params.id,
            customer: req.user._id,
        }).populate('items.product', 'name price imageUrl');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/prescriptions/:id/items
router.put('/:id/items', auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            customer: req.user._id,
            status: 'pending',
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found or already reviewed' });
        }

        const existingItem = prescription.items.find(
            (item) => item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity = quantity;
        } else {
            prescription.items.push({ product: productId, quantity });
        }

        await prescription.save();
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
