const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home',
    },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true },
        phone: { type: String, required: true },
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer',
        },
        dateOfBirth: { type: Date },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
        addresses: [addressSchema],
        refreshToken: { type: String },
        refreshTokenExpiry: { type: Date },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
