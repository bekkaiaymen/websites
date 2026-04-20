const express = require('express');
const router = express.Router();
const ErpNotification = require('../models/ErpNotification');

// GET /api/erp/notifications
router.get('/', async (req, res) => {
  try {
    const role = req.user.role; // 'superadmin', 'admin', 'merchant'
    const userId = req.user.id;
    let query = {};

    if (role === 'merchant') {
      const merchantId = req.user.merchantId;
      query = { 
        $or: [
          { audience: 'both' },
          { audience: 'merchant', merchantId: null }, // global merchant notifications
          { audience: 'merchant', merchantId: merchantId }
        ]
      };
    } else {
      // Admin
      query = {
        $or: [
          { audience: 'both' },
          { audience: 'admin' }
        ]
      };
    }

    const unreadOnly = req.query.unread === 'true';
    if (unreadOnly) {
      query.readBy = { $ne: userId };
    }

    const notifications = await ErpNotification.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/erp/notifications/read/:id
router.post('/read/:id', async (req, res) => {
  try {
    const notification = await ErpNotification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    if (!notification.readBy.includes(req.user.id)) {
      notification.readBy.push(req.user.id);
      await notification.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/erp/notifications/read-all
router.post('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    // We fetch them and update them to save to array
    const unreads = await ErpNotification.find({ readBy: { $ne: userId } });
    for (let notif of unreads) {
      notif.readBy.push(userId);
      await notif.save();
    }
    res.json({ success: true, count: unreads.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
