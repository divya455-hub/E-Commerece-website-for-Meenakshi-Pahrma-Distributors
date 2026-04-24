const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @route   GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash -refreshToken -refreshTokenExpiry');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, dateOfBirth, gender } = req.body;
        const user = await User.findById(req.user._id);

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;

        await user.save();
        const updated = await User.findById(user._id).select('-passwordHash -refreshToken -refreshTokenExpiry');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/addresses
router.post(
    '/addresses',
    auth,
    [
        body('addressLine1').notEmpty().withMessage('Address line 1 is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('state').notEmpty().withMessage('State is required'),
        body('zipCode').notEmpty().withMessage('Zip code is required'),
        body('country').notEmpty().withMessage('Country is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await User.findById(req.user._id);
            const { type, addressLine1, addressLine2, city, state, zipCode, country, isDefault } = req.body;

            // If this is set as default, unset others
            if (isDefault) {
                user.addresses.forEach((addr) => {
                    addr.isDefault = false;
                });
            }

            // If it's the first address, make it default
            const makeDefault = user.addresses.length === 0 ? true : isDefault || false;

            user.addresses.push({
                type: type || 'home',
                addressLine1,
                addressLine2,
                city,
                state,
                zipCode,
                country,
                isDefault: makeDefault,
            });

            await user.save();
            res.status(201).json(user.addresses[user.addresses.length - 1]);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   PUT /api/users/addresses/:addressId
router.put('/addresses/:addressId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const { type, addressLine1, addressLine2, city, state, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            user.addresses.forEach((addr) => {
                addr.isDefault = false;
            });
        }

        if (type) address.type = type;
        if (addressLine1) address.addressLine1 = addressLine1;
        if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
        if (city) address.city = city;
        if (state) address.state = state;
        if (zipCode) address.zipCode = zipCode;
        if (country) address.country = country;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await user.save();
        res.json(address);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/addresses/:addressId
router.delete('/addresses/:addressId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        address.deleteOne();
        await user.save();
        res.json({ message: 'Address removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/addresses
router.get('/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
