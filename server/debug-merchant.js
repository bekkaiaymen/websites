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

async function debugMerchant() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://delirery_db_user:qmlJU6BpxHDpxLtt@cluster0.furvxar.mongodb.net/ghardaia_delivery?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Find all merchants
    const merchants = await Merchant.find({}).select('email password status');
    console.log('\n📋 All Merchants in Database:');
    console.log('---');
    merchants.forEach((m, i) => {
      console.log(`${i + 1}. Email: ${m.email}`);
      console.log(`   Status: ${m.status}`);
      console.log(`   Password Hash: ${m.password?.substring(0, 50)}...`);
      console.log(`   Hash Valid: ${m.password?.startsWith('$2') ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });

    // Test bcrypt comparison
    if (merchants.length > 0) {
      const testMerchant = merchants[0];
      console.log('🧪 Testing bcrypt comparison with first merchant:');
      console.log(`   Email: ${testMerchant.email}`);
      
      try {
        const match = await bcryptjs.compare('merchant123', testMerchant.password);
        console.log(`   Password "merchant123" matches: ${match ? '✅ YES' : '❌ NO'}`);
      } catch (err) {
        console.log(`   ❌ Comparison error: ${err.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugMerchant();
