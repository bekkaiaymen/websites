/**
 * Check existing admins in database
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

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

async function checkAdmins() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const admins = await Admin.find({}, 'username role active email -password');
    
    if (admins.length === 0) {
      console.log('❌ لا يوجد مديرون في قاعدة البيانات');
      console.log('\n📝 سيتم إنشاء مدير افتراضي...\n');
      
      // Create default admin
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = new Admin({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@alibaba.com',
        role: 'superadmin',
        active: true
      });
      
      await newAdmin.save();
      console.log('✅ تم إنشاء المدير الافتراضي:\n');
      console.log('👤 اسم المستخدم: admin');
      console.log('🔐 كلمة المرور: admin123');
      console.log('📧 البريد: admin@alibaba.com');
      console.log('⭐ الصلاحية: superadmin\n');
    } else {
      console.log('📋 المديرون الموجودون:\n');
      admins.forEach((admin, idx) => {
        console.log(`${idx + 1}. ${admin.username}`);
        console.log(`   📧 ${admin.email || 'بدون بريد'}`);
        console.log(`   ⭐ ${admin.role}`);
        console.log(`   ${admin.active ? '✅ مفعّل' : '❌ معطّل'}`);
        console.log();
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkAdmins();
