const mongoose = require('mongoose');

const orderItemBatchSchema = new mongoose.Schema({
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true },
    batchNumber: { type: String },
    expiryDate: { type: Date },
});

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    requiresPrescription: { type: Boolean, default: false },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
    prescriptionVerified: { type: Boolean, default: false },
    batches: [orderItemBatchSchema],
});

const taxDetailSchema = new mongoose.Schema({
    hsnCode: { type: Number },
    taxableAmount: { type: Number },
    gstRate: { type: Number },
    gstAmount: { type: Number },
});

const shippingAddressSchema = new mongoose.Schema({
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
});

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, unique: true, required: true },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [orderItemSchema],
        totalAmount: { type: Number, required: true },
        shippingCharges: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, required: true },
        taxDetails: [taxDetailSchema],
        orderType: {
            type: String,
            enum: ['delivery', 'pickup'],
            default: 'delivery',
        },
        shippingAddress: shippingAddressSchema,
        paymentMethod: { type: String, required: true },
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
            ],
            default: 'pending',
        },
        cancellationFeePercentage: { type: Number, default: 10 },
        cancelledAt: { type: Date },
        cancellationReason: { type: String },
        tracking: [
            {
                event: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                note: { type: String },
            },
        ],
    },
    { timestamps: true }
);

orderSchema.index({ customer: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
