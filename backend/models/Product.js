const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String },
        sku: { type: String, unique: true, sparse: true },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        manufacturer: { type: String, required: true },
        requiresPrescription: { type: Boolean, default: false },
        hsnCode: { type: Number },
        gstRate: { type: Number, default: 12 },
        price: { type: Number, required: true },
        costPrice: { type: Number, required: true },
        imageUrl: { type: String },
        stock: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
