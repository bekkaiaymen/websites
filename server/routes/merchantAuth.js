const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const Merchant = require('../models/Merchant');

const router = express.Router();

// POST /api/merchant/login - Secure Merchant Login
// Only merchants with password set can login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find merchant by email
    const merchant = await Merchant.findOne({ 
      email,
      status: 'active'
    });

    if (!merchant || !merchant.password) {
      return res.status(401).json({ 
        error: 'Invalid credentials or merchant account not activated' 
      });
    }

    // Compare password with bcrypt
    const passwordMatch = await bcryptjs.compare(password, merchant.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with merchant ID
    const token = jwt.sign(
      { 
        id: merchant._id, 
        email: merchant.email,
        name: merchant.name,
        type: 'merchant'
      },
      process.env.JWT_SECRET || 'alibaba_secret_key_2024',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        status: merchant.status
      }
    });
  } catch (error) {
    console.error('Merchant login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/merchant/setup-password - Admin sets initial password for merchant
// Used when admin creates a merchant account
router.post('/:merchantId/setup-password', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { password },
      { new: true }
    ).select('_id name email status');

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ 
      message: 'Password set successfully',
      merchant 
    });
  } catch (error) {
    console.error('Error setting merchant password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware for merchant authentication
const authenticateMerchant = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'alibaba_secret_key_2024'
    );

    // Verify this is a merchant token
    if (decoded.type !== 'merchant') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    req.merchant = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = router;
module.exports.authenticateMerchant = authenticateMerchant;
