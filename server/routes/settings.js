const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

/**
 * ============ SETTINGS ENDPOINTS ============
 * API for managing dynamic system settings
 * All PUT endpoints require admin authentication
 */

/**
 * GET /api/erp/settings
 * Fetch current system settings
 * Public endpoint - accessible to all
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new Settings();
      await settings.save();
      console.log('✅ Default settings created');
    }

    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Server error fetching settings',
      message: error.message 
    });
  }
});

/**
 * PUT /api/erp/settings
 * Update system settings
 * Requires: Admin authentication
 */
router.put('/settings', async (req, res) => {
  try {
    // Validate that at least one field is provided
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No settings provided to update' });
    }

    // Whitelist of updatable fields
    const allowedFields = [
      'usdBuyRate',
      'usdSellRate',
      'shopifyFulfillmentFee',
      'deliveryFee',
      'platformCommission',
      'taxRate',
      'trackingEnabled',
      'autoFulfillmentEnabled'
    ];

    // Filter request body to only include allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    // Add admin ID who made the change
    if (req.user && req.user.id) {
      updateData.lastModifiedBy = req.user.id;
    }

    // Find and update settings
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if none exist
      settings = new Settings(updateData);
    } else {
      // Update existing settings
      Object.assign(settings, updateData);
    }

    await settings.save();

    console.log('✅ Settings updated successfully:', updateData);
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      settings: settings
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ 
      error: 'Server error updating settings',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/settings/usd-rates
 * Fetch only USD exchange rates
 * Public endpoint - used by frontend for calculations
 */
router.get('/settings/usd-rates', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.json({
        usdBuyRate: 251,
        usdSellRate: 330
      });
    }

    res.json({
      usdBuyRate: settings.usdBuyRate,
      usdSellRate: settings.usdSellRate
    });
  } catch (error) {
    console.error('❌ Error fetching USD rates:', error);
    res.status(500).json({ 
      error: 'Server error fetching USD rates',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/settings/fees
 * Fetch only fees and commissions
 * Public endpoint - used for order calculations
 */
router.get('/settings/fees', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.json({
        shopifyFulfillmentFee: 200,
        deliveryFee: 0,
        platformCommission: 5,
        taxRate: 0
      });
    }

    res.json({
      shopifyFulfillmentFee: settings.shopifyFulfillmentFee,
      deliveryFee: settings.deliveryFee,
      platformCommission: settings.platformCommission,
      taxRate: settings.taxRate
    });
  } catch (error) {
    console.error('❌ Error fetching fees:', error);
    res.status(500).json({ 
      error: 'Server error fetching fees',
      message: error.message 
    });
  }
});

/**
 * POST /api/erp/settings/reset
 * Reset settings to defaults
 * Requires: Admin authentication
 */
router.post('/settings/reset', async (req, res) => {
  try {
    const defaultSettings = new Settings();
    await Settings.deleteMany({});
    await defaultSettings.save();

    console.log('✅ Settings reset to defaults');
    
    res.json({
      success: true,
      message: 'تم إعادة تعيين الإعدادات إلى الافتراضيات',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    res.status(500).json({ 
      error: 'Server error resetting settings',
      message: error.message 
    });
  }
});

module.exports = router;
