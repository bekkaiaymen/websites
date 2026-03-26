import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  icon: { type: String }, // URL to icon
  color: { type: String, default: '#bf953f' },
  description: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
