const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

// Merchant schema  
const merchantSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  financialSettings: Object
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);

async function createMerchantForAymen() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://delirery_db_user:qmlJU6BpxHDpxLpt@cluster0.furvxar.mongodb.net/ghardaia_delivery?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Check if merchant already exists
    const existing = await Merchant.findOne({ email: 'aymenbekkai17@gmail.com' });
    if (existing) {
      console.log('⚠️  Merchant already exists with this email');
      console.log(`   ID: ${existing._id}`);
      console.log(`   Status: ${existing.status}`);
      process.exit(0);
    }

    // Hash password with bcrypt
    const passwordHash = await bcryptjs.hash('aymenbekkai17@', 10);

    // Create merchant account for Aymen
    const merchant = new Merchant({
      name: 'Ayman Bekkai',
      email: 'aymenbekkai17@gmail.com',
      password: passwordHash,
      status: 'active',
      financialSettings: {
        adSaleCostDzd: 330,
        followUpFeeSuccessSpfy: 180,
        followUpFeeSuccessPage: 200,
        followUpFeeReturn: 100,
        defaultReturnDeliveryFee: 200
      }
    });

    await merchant.save();
    
    console.log('✅ Merchant account created successfully!');
    console.log('📧 Email: aymenbekkai17@gmail.com');
    console.log('🔑 Password: aymenbekkai17@');
    console.log('---');
    console.log('You can now login to merchant portal with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMerchantForAymen();
