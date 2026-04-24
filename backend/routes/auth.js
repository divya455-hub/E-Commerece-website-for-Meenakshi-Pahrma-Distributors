const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

// @route   POST /api/auth/register
router.post(
    '/register',
    [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('phone').notEmpty().withMessage('Phone number is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { firstName, lastName, email, password, phone, dateOfBirth, gender } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Create user
            const user = await User.create({
                firstName,
                lastName,
                email,
                passwordHash,
                phone,
                role: 'customer',
                dateOfBirth,
                gender,
            });

            // Generate tokens
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id, user.role);

            // Store refresh token
            user.refreshToken = refreshToken;
            user.refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();

            // Create notification
            await Notification.create({
                title: 'New Customer Registered',
                message: `New customer registered: ${firstName} ${lastName}`,
                type: 'info',
                recipient: null,
                actionUrl: `/admin/users/${user._id}`,
            });

            res.status(201).json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'bearer',
                user_id: user._id,
                role: user.role,
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   POST /api/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Incorrect email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect email or password' });
            }

            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id, user.role);

            // Update refresh token
            user.refreshToken = refreshToken;
            user.refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'bearer',
                user_id: user._id,
                role: user.role,
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        // Find user with matching refresh token
        const user = await User.findOne({
            _id: decoded.userId,
            refreshToken: refresh_token,
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id, user.role);

        user.refreshToken = newRefreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            access_token: accessToken,
            refresh_token: newRefreshToken,
            token_type: 'bearer',
            user_id: user._id,
            role: user.role,
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
