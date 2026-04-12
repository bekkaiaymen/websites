# 🔌 API Endpoints المطلوبة للتحكم بالإعدادات و Fulfillment

**تاريخ الإنشاء:** 12 أبريل 2026
**المتطلب:** إضافة هذه الـ endpoints إلى Backend (server/routes أو server/controllers)

---

## 📋 جدول المحتويات

1. [Settings Endpoints](#settings-endpoints) - التحكم بالأسعار والقيم
2. [Order Status Endpoints](#order-status-endpoints) - تحديث حالات الطلبيات
3. [Fulfillment Endpoints](#fulfillment-endpoints) - معلومات التسليم
4. [Database Schema Updates](#database-schema-updates) - تحديثات قاعدة البيانات

---

## 🏠 Settings Endpoints

### GET `/api/settings`

**الوصف:** الحصول على إعدادات النظام الحالية

**الرد:**
```json
{
  "usdBuyRate": 251,
  "usdSellRate": 330,
  "shopifyFulfillmentFee": 200,
  "deliveryFee": 0,
  "taxRate": 0,
  "platformCommission": 5
}
```

**كود المثال (Backend):**
```javascript
router.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne() || {
      usdBuyRate: 251,
      usdSellRate: 330,
      shopifyFulfillmentFee: 200,
      deliveryFee: 0,
      taxRate: 0,
      platformCommission: 5
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### PUT `/api/settings`

**الوصف:** تحديث إعدادات النظام

**المتطلبات:** Bearer Token (Admin فقط)

**الجسم المرسل:**
```json
{
  "usdBuyRate": 251,
  "usdSellRate": 330,
  "shopifyFulfillmentFee": 200,
  "deliveryFee": 50,
  "taxRate": 19,
  "platformCommission": 5
}
```

**الرد:**
```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "settings": { ... }
}
```

**كود المثال (Backend):**
```javascript
router.put('/api/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, message: 'تم التحديث', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**نموذج Mongoose (Server):**
```javascript
const settingsSchema = new Schema({
  usdBuyRate: { type: Number, default: 251 },
  usdSellRate: { type: Number, default: 330 },
  shopifyFulfillmentFee: { type: Number, default: 200 },
  deliveryFee: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 5 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
```

---

## 📦 Order Status Endpoints

### GET `/api/orders`

**الوصف:** الحصول على جميع الطلبيات

**الاختيارات:**
- `status` - فلتر حسب الحالة (pending, processing, shipped, fulfilled, cancelled)
- `page` - رقم الصفحة
- `limit` - عدد الطلبيات في الصفحة

**مثال:**
```
GET /api/orders?status=pending&page=1&limit=20
```

**الرد:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "customerName": "أحمد",
    "customerPhone": "05551234567",
    "wilaya": "الجزائر",
    "commune": "بن عكنون",
    "address": "شارع ديدوشة مراد",
    "items": [
      {
        "productName": "صندوق الشوكولاتة",
        "quantity": 2,
        "price": 1500
      }
    ],
    "totalAmount": 3000,
    "status": "pending",
    "trackingNumber": "TRK123456",
    "estimatedDelivery": "2026-04-15",
    "createdAt": "2026-04-12T10:30:00Z",
    "updatedAt": "2026-04-12T10:30:00Z"
  }
]
```

---

### PUT `/api/orders/:orderId`

**الوصف:** تحديث حالة الطلبية

**المتطلبات:** Bearer Token (Admin فقط)

**الجسم المرسل:**
```json
{
  "status": "processing",
  "trackingNumber": "TRK123456",
  "estimatedDelivery": "2026-04-15"
}
```

**الرد:**
```json
{
  "success": true,
  "message": "تم تحديث حالة الطلبية",
  "order": { ... }
}
```

**كود المثال (Backend):**
```javascript
router.put('/api/orders/:orderId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      {
        status,
        trackingNumber,
        estimatedDelivery,
        updatedAt: new Date()
      },
      { new: true }
    );

    // إذا تم تحديث الحالة إلى 'fulfilled'، أرسل إشعار للزبون
    if (status === 'fulfilled') {
      // أرسل بريد إلكتروني أو SMS
    }

    res.json({ success: true, message: 'تم التحديث', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## ✅ Fulfillment Endpoints

### POST `/api/fulfillment/mark-delivered`

**الوصف:** تحديد الطلبية كمُسلّمة و محدثة الأرباح

**الجسم المرسل:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "deliveredAt": "2026-04-15T14:30:00Z",
  "notes": "تم التسليم بنجاح"
}
```

**الرد:**
```json
{
  "success": true,
  "message": "تم تحديد الطلبية كمُسلّمة",
  "order": { ... },
  "profitCalculation": {
    "totalAmount": 3000,
    "platformCommission": 150,
    "fulfillmentFee": 200,
    "profit": 2650
  }
}
```

**كود المثال (Backend):**
```javascript
router.post('/api/fulfillment/mark-delivered', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orderId, deliveredAt, notes } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'fulfilled',
        deliveredAt,
        notes,
        fulfillmentCompleted: true
      },
      { new: true }
    );

    // حساب الأرباح
    const settings = await Settings.findOne();
    const profitCalculation = {
      totalAmount: order.totalAmount,
      platformCommission: (order.totalAmount * (settings.platformCommission / 100)),
      fulfillmentFee: settings.shopifyFulfillmentFee,
      profit: order.totalAmount - (order.totalAmount * (settings.platformCommission / 100)) - settings.shopifyFulfillmentFee
    };

    // تحديث الأرباح في الـ wallet
    await AdminWallet.updateOne(
      { admin: req.user.id },
      { 
        $inc: { 
          totalProfit: profitCalculation.profit,
          totalOrders: 1
        }
      }
    );

    res.json({ success: true, message: 'تم التسليم', order, profitCalculation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### GET `/api/fulfillment/analytics`

**الوصف:** الحصول على تحليلات الـ Fulfillment

**الرد:**
```json
{
  "totalOrders": 150,
  "fulfilledOrders": 145,
  "fulfillmentRate": 96.67,
  "averageDeliveryTime": 3.5,
  "totalProfit": 450000,
  "platformCommissions": 22500,
  "fulfillmentFees": 29000,
  "topWeek": {
    "orders": 45,
    "profit": 135000
  }
}
```

---

## 🗄️ Database Schema Updates

### Order Schema Update

أضف هذه الحقول إلى نموذج Order:

```javascript
const orderSchema = new Schema({
  // الحقول الموجودة...
  customerName: String,
  customerPhone: String,
  wilaya: String,
  commune: String,
  address: String,
  items: [{
    productName: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,

  // الحقول الجديدة:
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  fulfillmentCompleted: { type: Boolean, default: false },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Settings Schema

```javascript
const settingsSchema = new Schema({
  usdBuyRate: { type: Number, default: 251 },
  usdSellRate: { type: Number, default: 330 },
  shopifyFulfillmentFee: { type: Number, default: 200 },
  deliveryFee: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 5 },
  updatedAt: { type: Date, default: Date.now }
});
```

---

## 🚀 ملخص التطبيق

### في الـ Frontend (client-erp):

```
✅ صفحة AdminSettings: التحكم بالأسعار والقيم الديناميكية
✅ صفحة AdminOrderTracking: تتبع الطلبيات و تحديث الحالات
✅ نظام Fulfillment متكامل مع حساب الأرباح
```

### في الـ Backend (server) - المطلوب:

```
⚠️ يحتاج التطبيق:
  1. GET /api/settings - الحصول على الإعدادات
  2. PUT /api/settings - تحديث الإعدادات
  3. PUT /api/orders/:orderId - تحديث حالة الطلبية
  4. POST /api/fulfillment/mark-delivered - تحديد كمُسلّمة
  5. GET /api/fulfillment/analytics - تحليلات

  + تحديثات قاعدة البيانات
```

---

## ✅ القائمة السريعة للتطبيق

- [x] إنشاء AdminSettings.jsx
- [x] إنشاء AdminOrderTracking.jsx
- [x] إضافة الروتات إلى App.jsx
- [ ] إنشاء Settings Model في Backend
- [ ] إنشاء API Endpoints
- [ ] اختبار كل الـ APIs
- [ ] ربط Frontend بـ Backend

---

**ملاحظة:** نسخ هذا الملف للمطور لكي يتمكن من إضافة جميع الـ endpoints المطلوبة في الـ Backend.
