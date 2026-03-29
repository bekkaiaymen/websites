require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const MONGODB_URI = 'mongodb+srv://delirery_db_user:qmlJU6BpxHDpxLtt@cluster0.furvxar.mongodb.net/ghardaia_delivery?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Check if delivery user exists
  const existingDelivery = await Admin.findOne({ username: 'delivery' });
  if (existingDelivery) {
    console.log('Delivery user already exists! Deleting and recreating for clean slate or just updating password...');
    await Admin.deleteOne({ username: 'delivery' });
  }

  // Create new delivery user
  const deliveryUser = new Admin({
    username: 'delivery',
    password: 'delivery2026',
    role: 'delivery'
  });

  await deliveryUser.save();
  console.log('✅ Delivery user created successfully!');
  console.log('-----------------------------------');
  console.log('Username: delivery');
  console.log('Password: delivery2026');
  console.log('-----------------------------------');
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
