const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const Prescription = require('../../models/Prescription');
const Notification = require('../../models/Notification');

// @route   GET /api/admin/prescriptions
router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { status, skip = 0, limit = 100 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const prescriptions = await Prescription.find(filter)
            .populate('customer', 'firstName lastName email')
            .populate('items.product', 'name price imageUrl')
            .sort({ uploadedAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Prescription.countDocuments(filter);
        res.json({ prescriptions, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/prescriptions/:id
router.get('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('customer', 'firstName lastName email phone')
            .populate('items.product', 'name price imageUrl requiresPrescription')
            .populate('verifiedBy', 'firstName lastName');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/prescriptions/:id/verify
router.put('/:id/verify', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { status, verificationNotes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.status !== 'pending') {
            return res.status(400).json({ message: 'Prescription already reviewed' });
        }

        prescription.status = status;
        prescription.verifiedBy = req.user._id;
        prescription.verificationNotes = verificationNotes || '';
        prescription.verifiedAt = new Date();

        await prescription.save();

        // Notify customer
        await Notification.create({
            title: `Prescription ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message:
                status === 'approved'
                    ? 'Your prescription has been approved. You can now proceed to checkout.'
                    : `Your prescription has been rejected. ${verificationNotes || 'Please re-upload.'}`,
            type: status === 'approved' ? 'success' : 'warning',
            recipient: prescription.customer,
        });

        res.json(prescription);
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
