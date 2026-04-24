const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        batchNumber: { type: String, required: true },
        quantityInStock: { type: Number, default: 0 },
        lowStockThreshold: { type: Number, default: 10 },
        expiryDate: { type: Date, required: true },
        costPrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        isAvailable: { type: Boolean, default: true },
        lastRestockedDate: { type: Date },
    },
    { timestamps: true }
);

inventorySchema.index({ product: 1 });
inventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
