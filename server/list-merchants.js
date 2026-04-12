const mongoose = require('mongoose');
require('dotenv').config();

const merchantSchema = new mongoose.Schema({
  name: String,
  email: String,
  status: String
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);

async function listMerchants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://delirery_db_user:qmlJU6BpxHDpxLpt@cluster0.furvxar.mongodb.net/ghardaia_delivery?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB\n');

    const merchants = await Merchant.find({}).select('_id name email status');
    
    if (merchants.length === 0) {
      console.log('❌ No merchants found in database');
      process.exit(1);
    }

    console.log('📋 Available Merchants:');
    console.log('---');
    merchants.forEach((m, i) => {
      console.log(`${i + 1}. Name: ${m.name}`);
      console.log(`   Email: ${m.email}`);
      console.log(`   ObjectId: ${m._id}`);
      console.log(`   Status: ${m.status}`);
      console.log('');
    });

    console.log('For Shopify webhook URL, use the ObjectId:');
    console.log(`Example: https://prince-delivery.onrender.com/api/erp/webhooks/shopify?merchantId=${merchants[0]._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listMerchants();
