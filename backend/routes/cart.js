const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @route   GET /api/cart
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ customer: req.user._id }).populate({
            path: 'items.product',
            select: 'name price imageUrl requiresPrescription isActive stock',
        });

        if (!cart) {
            return res.json({ items: [], totalItems: 0, totalPrice: 0 });
        }

        // Attach stock info to each item
        const itemsWithStock = cart.items.map((item) => {
            return {
                _id: item._id,
                product: item.product,
                quantity: item.quantity,
                addedAt: item.addedAt,
                stockQuantity: item.product.stock || 0,
            };
        });

        const totalItems = itemsWithStock.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = itemsWithStock.reduce(
            (sum, i) => sum + (i.product.price || 0) * i.quantity,
            0
        );

        res.json({
            _id: cart._id,
            items: itemsWithStock,
            totalItems,
            totalPrice: Math.round(totalPrice * 100) / 100,
        });
    } catch (error) {
        console.error('Cart get error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/cart/summary
router.get('/summary', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer: req.user._id }).populate({
            path: 'items.product',
            select: 'price',
        });

        if (!cart || cart.items.length === 0) {
            return res.json({ totalItems: 0, totalPrice: 0, itemCount: 0 });
        }

        let totalItems = 0;
        let totalPrice = 0;

        cart.items.forEach((item) => {
            totalItems += item.quantity;
            totalPrice += (item.product.price || 0) * item.quantity;
        });

        res.json({
            totalItems,
            totalPrice: Math.round(totalPrice * 100) / 100,
            itemCount: cart.items.length,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/cart
router.post('/', auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Check product exists and is active
        const product = await Product.findOne({ _id: productId, isActive: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check total available stock from product.stock
        const totalStock = product.stock || 0;

        if (totalStock < quantity) {
            return res.status(400).json({
                message: `Not enough stock. Available: ${totalStock}, Requested: ${quantity}`,
            });
        }

        let cart = await Cart.findOne({ customer: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                customer: req.user._id,
                items: [{ product: productId, quantity }],
            });
        } else {
            const existingItem = cart.items.find(
                (item) => item.product.toString() === productId
            );

            if (existingItem) {
                const newQty = existingItem.quantity + quantity;
                if (newQty > totalStock) {
                    return res.status(400).json({
                        message: `Only ${totalStock} items available in stock`,
                    });
                }
                existingItem.quantity = newQty;
            } else {
                cart.items.push({ product: productId, quantity });
            }

            await cart.save();
        }

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price imageUrl requiresPrescription stock',
        });

        res.status(201).json(updatedCart);
    } catch (error) {
        console.error('Cart add error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/cart/:itemId
router.put('/:itemId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;

        const cart = await Cart.findOne({ customer: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Check stock from product model
        const product = await Product.findById(item.product);
        const totalStock = product ? (product.stock || 0) : 0;

        if (totalStock < quantity) {
            return res.status(400).json({
                message: `Not enough stock. Available: ${totalStock}, Requested: ${quantity}`,
            });
        }

        item.quantity = quantity;
        await cart.save();

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/cart/:itemId
router.delete('/:itemId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        item.deleteOne();
        await cart.save();

        res.json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/cart
router.delete('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ customer: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
