/**
 * Quick admin creator - stores password as plain text (matching the login endpoint)
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba-gifts';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['admin', 'superadmin', 'delivery'], default: 'admin' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Try to find or create admin
    let admin = await Admin.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('✅ Admin already exists!');
      console.log(`   اسم المستخدم: ${admin.username}`);
      console.log(`   الصلاحية: ${admin.role}`);
      console.log(`   ${admin.active ? '✅ مفعّل' : '❌ معطّل'}`);
    } else {
      const newAdmin = new Admin({
        username: 'admin',
        password: 'admin123', // Store as plain text (matching login endpoint logic)
        email: 'admin@alibaba.com',
        role: 'superadmin',
        active: true
      });
      
      await newAdmin.save();
      console.log('✅ تم إنشاء المدير!\n');
      console.log('👤 اسم المستخدم: admin');
      console.log('🔐 كلمة المرور: admin123');
      console.log('📧 البريد: admin@alibaba.com');
      console.log('⭐ الصلاحية: superadmin');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
})();
