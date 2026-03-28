const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 }, // سعر الشراء للحساب الأرباح
  description: { type: String },
  descriptionAr: { type: String },
  image: { type: String },
  stock: { type: Number, default: 100 },
  local: { type: Boolean, default: false },
  national: { type: Boolean, default: true },
  premium: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
