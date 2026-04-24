const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['info', 'warning', 'alert', 'success'],
            default: 'info',
        },
        isRead: { type: Boolean, default: false },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        actionUrl: { type: String },
        readAt: { type: Date },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
