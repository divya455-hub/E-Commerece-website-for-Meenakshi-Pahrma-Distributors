const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        paymentGateway: { type: String, default: 'dummy' },
        amount: { type: Number, required: true },
        method: {
            type: String,
            enum: ['card', 'upi', 'cod', 'net_banking'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        gatewayTransactionId: { type: String },
        paidAt: { type: Date },
    },
    { timestamps: true }
);

paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
