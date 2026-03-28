const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  icon: { type: String },
  image: { type: String },
  color: { type: String, default: '#bf953f' },
  description: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
