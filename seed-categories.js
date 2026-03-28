// This script adds sample categories to your MongoDB database
// Run with: node seed-categories.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba-gifts';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  icon: String,
  image: String,
  color: { type: String, default: '#D4AF37' },
  description: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', CategorySchema);

const sampleCategories = [
  {
    name: 'Chocolate',
    nameAr: 'الشوكولاتة',
    icon: '🍫',
    color: '#8B4513',
    description: 'Delicious chocolate products'
  },
  {
    name: 'Gifts',
    nameAr: 'الهدايا',
    icon: '🎁',
    color: '#D4AF37',
    description: 'Special gift collections'
  },
  {
    name: 'Premium Box',
    nameAr: 'صندوق فاخر',
    icon: '✨',
    color: '#FFD700',
    description: 'Premium luxury gift boxes'
  },
  {
    name: 'Sweet Treats',
    nameAr: 'الحلويات',
    icon: '🍬',
    color: '#FF69B4',
    description: 'Sweet treats and candies'
  },
  {
    name: 'Special Occasions',
    nameAr: 'المناسبات الخاصة',
    icon: '🎉',
    color: '#FF1493',
    description: 'Perfect for special moments'
  }
];

const seedCategories = async () => {
  try {
    await connectDB();

    // Check existing categories
    const existingCount = await Category.countDocuments();
    console.log(`📊 Existing categories: ${existingCount}`);

    // Add categories if none exist
    if (existingCount === 0) {
      const result = await Category.insertMany(sampleCategories);
      console.log(`✅ Added ${result.length} sample categories`);
      result.forEach(cat => {
        console.log(`   - ${cat.nameAr} (${cat.icon})`);
      });
    } else {
      console.log('ℹ️  Categories already exist. Skipping seed.');
    }

    await mongoose.connection.close();
    console.log('✅ Seed completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedCategories();
