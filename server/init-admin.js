/**
 * إنشاء مدير اختبار جديد
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_chocolate';

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
    console.log('✅ MongoDB متصل\n');

    // حذف الإداريين القدماء
    await Admin.deleteMany({});
    console.log('🗑️  تم مسح الإداريين القدماء');

    // إنشاء مدير جديد
    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
      email: 'admin@erp.local',
      role: 'superadmin',
      active: true
    });

    await admin.save();
    console.log('✅ تم إنشاء مدير جديد!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 اسم المستخدم: admin');
    console.log('🔐 كلمة المرور: admin123');
    console.log('⭐ الصلاحية: superadmin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
})();
