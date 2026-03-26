import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  description: { type: String },
  descriptionAr: { type: String },
  image: { type: String },
  stock: { type: Number, default: 100 },
  isLocal: { type: Boolean, default: false }, // Ghardaia only
  isNational: { type: Boolean, default: true }, // Available nationwide
  premium: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
