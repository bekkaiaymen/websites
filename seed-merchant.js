/**
 * Seed Test Merchant for Merchant Portal
 * 
 * This script creates a test merchant account that can be used to test the Merchant Portal
 * Usage: node seed-merchant.js
 */

const mongoose = require('mongoose');
const Merchant = require('./server/models/Merchant');

require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

async function seedMerchant() {
  try {
    console.log('🌱 Seeding test merchant...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Delete existing test merchant
    await Merchant.deleteOne({ email: 'merchant@example.com' });
    console.log('🗑️  Cleared existing test merchant');

    // Create new test merchant
    const testMerchant = new Merchant({
      name: 'متجر التجربة',
      email: 'merchant@example.com',
      password: 'testPassword123',
      financialSettings: {
        adSaleCostDzd: 330,
        followUpFeeSuccessSpfy: 180,
        followUpFeeSuccessPage: 200,
        followUpFeeReturn: 100,
        defaultReturnDeliveryFee: 200
      },
      status: 'active'
    });

    await testMerchant.save();
    console.log('✅ Test merchant created successfully\n');

    // Display credentials
    console.log('🔐 Merchant Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    merchant@example.com');
    console.log('Password: testPassword123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📍 Access merchant portal:');
    console.log('   http://localhost:5173/merchant/login\n');

    console.log('Or test via API:');
    console.log('   node test-merchant-portal.js\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error seeding merchant:', error);
    process.exit(1);
  }
}

seedMerchant();
