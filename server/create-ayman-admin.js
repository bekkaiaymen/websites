/**
 * Create Ayman Admin Account
 * Direct account creation with provided credentials
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const Admin = require('./models/Admin');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

async function createAymanAdmin() {
  try {
    console.log('🔗 جاري الاتصال بـ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بـ MongoDB\n');

    // Delete existing account if exists
    await Admin.deleteOne({ email: 'aymenbekkai17@gmail.com' });
    await Admin.deleteOne({ username: 'aymen' });
    console.log('🗑️  تم مسح الحساب القديم (إن وجد)\n');

    // Hash password
    const password = 'aymenbekkai17@';
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create Admin Account
    const admin = new Admin({
      username: 'aymen',
      email: 'aymenbekkai17@gmail.com',
      password: hashedPassword,
      role: 'admin',
      active: true
    });

    await admin.save();

    console.log('✅✅✅ حساب Admin تم إنشاؤه بنجاح! ✅✅✅\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 بيانات الدخول الخاصة بك:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👤 الـ Username:  aymen');
    console.log('📧 البريد:       aymenbekkai17@gmail.com');
    console.log('🔐 كلمة المرور: aymenbekkai17@');
    console.log('');
    console.log('🌐 رابط الدخول:');
    console.log('   https://erp.example.com/admin/login');
    console.log('');
    console.log('📍 المسار المحلي:');
    console.log('   http://localhost:5173/admin/login');
    console.log('');
    console.log('👑 الصلاحيات:');
    console.log('   ✅ لوحة التحكم الكاملة');
    console.log('   ✅ إدارة الطلبيات');
    console.log('   ✅ إدارة المنتجات والفئات');
    console.log('   ✅ إدارة التجار');
    console.log('   ✅ الإعدادات الديناميكية (أسعار USD، الرسوم)');
    console.log('   ✅ تتبع الطلبيات والتسليم');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 مرحباً بك في الكود يا أيمن!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

createAymanAdmin();
