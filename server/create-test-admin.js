/**
 * Create test admin user
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
    console.log('✅ Connected\n');

    // Delete old admin
    await Admin.deleteMany({ username: 'testadmin' });

    // Create new  admin
    const admin = new Admin({
      username: 'testadmin',
      password: 'test123456',
      email: 'test@alibaba.com',
      role: 'superadmin',
      active: true
    });

    await admin.save();
    console.log('✅ Test admin created!');
    console.log(`👤 اسم المستخدم: testadmin`);
    console.log(`🔐 كلمة المرور: test123456\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
