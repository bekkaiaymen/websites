/**
 * Create Test Users
 * Run this script to create admin and merchant accounts for testing
 * 
 * Usage:
 * node create-test-users.js
 * 
 * After running, use these credentials to login:
 * Admin: admin@test.com / password123
 * Merchant: merchant@test.com / password123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Import models
const Admin = require('./models/Admin');
const Merchant = require('./models/Merchant');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

async function createTestUsers() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing test users
    await Admin.deleteMany({ email: 'admin@test.com' });
    await Merchant.deleteMany({ email: 'merchant@test.com' });
    console.log('🗑️  Cleared existing test users');

    // Hash password
    const password = await bcryptjs.hash('password123', 10);

    // Create Admin User
    const admin = new Admin({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: password,
      role: 'admin',
      isActive: true
    });
    await admin.save();
    console.log('✅ Admin created:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Login URL: https://erp.example.com/admin/login');

    // Create Merchant User
    const merchant = new Merchant({
      name: 'Test Merchant',
      email: 'merchant@test.com',
      password: password,
      phone: '+213 555-1234',
      location: 'Test City',
      businessType: 'Retail',
      isActive: true,
      isVerified: true
    });
    await merchant.save();
    console.log('\n✅ Merchant created:');
    console.log('   Email: merchant@test.com');
    console.log('   Password: password123');
    console.log('   Login URL: https://erp.example.com/merchant/login');

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📝 Test Credential Summary:');
    console.log('');
    console.log('Admin Account:');
    console.log('  Email: admin@test.com');
    console.log('  Password: password123');
    console.log('  Path: /admin/login');
    console.log('');
    console.log('Merchant Account:');
    console.log('  Email: merchant@test.com');
    console.log('  Password: password123');
    console.log('  Path: /merchant/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  }
}

createTestUsers();
