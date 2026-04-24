const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        amount: { type: Number, required: true },
        cancellationFee: { type: Number, default: 0 },
        refundPolicy: {
            type: String,
            enum: ['full', 'partial', 'no_refund'],
            required: true,
        },
        reason: { type: String },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        refundMethod: { type: String },
        processedAt: { type: Date },
    },
    { timestamps: true }
);

refundSchema.index({ order: 1 });

module.exports = mongoose.model('Refund', refundSchema);
