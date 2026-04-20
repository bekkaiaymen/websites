const mongoose = require('mongoose');

const ErpNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error', 'order_created'], default: 'info' },
  audience: { type: String, enum: ['admin', 'merchant', 'both'], default: 'both' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }, // If audience is merchant
  readBy: [{ type: mongoose.Schema.Types.ObjectId }], // array of user/admin IDs who read it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ErpNotification || mongoose.model('ErpNotification', ErpNotificationSchema);
