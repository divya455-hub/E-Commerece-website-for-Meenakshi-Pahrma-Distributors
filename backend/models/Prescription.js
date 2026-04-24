const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: { type: Number, required: true },
});

const prescriptionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        imageUrl: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        verificationNotes: { type: String },
        items: [prescriptionItemSchema],
        isUsed: { type: Boolean, default: false },
        usedInOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
    },
    { timestamps: true }
);

prescriptionSchema.index({ customer: 1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
