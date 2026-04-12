/**
 * Create Custom User Account
 * Allows you to create admin or merchant accounts with custom credentials
 * 
 * Usage:
 * node create-custom-user.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const readline = require('readline');

// Import models
const Admin = require('./models/Admin');
const Merchant = require('./models/Merchant');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createCustomUser() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Ask user type
    console.log('اختر نوع الحساب:');
    console.log('1. Admin (مدير)');
    console.log('2. Merchant (تاجر)');
    
    const userType = await question('\nأدخل الرقم (1 أو 2): ');

    // Get user details
    const name = await question('اسم المستخدم: ');
    const email = await question('البريد الإلكتروني: ');
    const password = await question('كلمة المرور: ');

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    if (userType === '1') {
      // Create Admin
      const admin = new Admin({
        name: name,
        email: email,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await admin.save();
      
      console.log('\n✅ حساب Admin تم إنشاؤه بنجاح!');
      console.log('   الاسم: ' + name);
      console.log('   البريد: ' + email);
      console.log('   كلمة المرور: ' + password);
      console.log('   رابط الدخول: https://erp.example.com/admin/login');
      
    } else if (userType === '2') {
      // Create Merchant
      const phone = await question('رقم الهاتف: ');
      const location = await question('المدينة/الموقع: ');
      const businessType = await question('نوع العمل: ');
      
      const merchant = new Merchant({
        name: name,
        email: email,
        password: hashedPassword,
        phone: phone,
        location: location,
        businessType: businessType,
        isActive: true,
        isVerified: true
      });
      await merchant.save();
      
      console.log('\n✅ حساب Merchant تم إنشاؤه بنجاح!');
      console.log('   الاسم: ' + name);
      console.log('   البريد: ' + email);
      console.log('   كلمة المرور: ' + password);
      console.log('   رابط الدخول: https://erp.example.com/merchant/login');
      
    } else {
      console.log('❌ اختيار غير صحيح');
    }

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    rl.close();
    process.exit(1);
  }
}

createCustomUser();
