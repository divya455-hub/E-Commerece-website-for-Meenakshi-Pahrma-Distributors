const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        invoiceNumber: { type: String, unique: true, required: true },
        invoiceDate: { type: Date, required: true },
        filePath: { type: String },
    },
    { timestamps: true }
);

invoiceSchema.index({ order: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
