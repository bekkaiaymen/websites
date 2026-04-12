const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

// Merchant schema  
const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  financialSettings: {
    adSaleCostDzd: {
      type: Number,
      default: 330
    },
    followUpFeeSuccessSpfy: {
      type: Number,
      default: 180
    },
    followUpFeeSuccessPage: {
      type: Number,
      default: 200
    },
    followUpFeeReturn: {
      type: Number,
      default: 100
    },
    defaultReturnDeliveryFee: {
      type: Number,
      default: 200
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);

async function createTestMerchant() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://delirery_db_user:qmlJU6BpxHDpxLtt@cluster0.furvxar.mongodb.net/ghardaia_delivery?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Hash password with bcrypt
    const passwordHash = await bcryptjs.hash('merchant123', 10);

    // Create test merchant
    const merchant = new Merchant({
      name: 'Test Merchant',
      email: 'merchant@test.com',
      password: passwordHash,
      status: 'active'
    });

    await merchant.save();
    
    console.log('✅ Test merchant created successfully!');
    console.log('📧 Email: merchant@test.com');
    console.log('🔑 Password: merchant123');
    console.log('---');
    console.log('Use these credentials to test the merchant login endpoint');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestMerchant();
