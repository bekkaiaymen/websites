# ERP API Documentation

## Merchants Endpoints (التجار)

### 1. الحصول على جميع التجار
```
GET /api/erp/merchants
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "businessName": "متجر التسوق",
    "ownerName": "أحمد محمد",
    "phone": "0798765432",
    "email": "merchant@example.com",
    "financialSettings": {
      "followUpFeeSuccessSpfy": 180,
      "followUpFeeSuccessMeta": 200,
      "adSaleCostDzd": 330,
      "splitExpensePercentage": 50
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### 2. الحصول على بيانات تاجر محدد
```
GET /api/erp/merchants/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "businessName": "متجر التسوق",
  "ownerName": "أحمد محمد",
  "phone": "0798765432",
  "email": "merchant@example.com",
  "financialSettings": {
    "followUpFeeSuccessSpfy": 180,
    "followUpFeeSuccessMeta": 200,
    "adSaleCostDzd": 330,
    "splitExpensePercentage": 50
  }
}
```

---

### 3. إضافة تاجر جديد
```
POST /api/erp/merchants
Authorization: Bearer {token}
Content-Type: application/json

{
  "businessName": "متجر التسوق",
  "ownerName": "أحمد محمد",
  "phone": "0798765432",
  "email": "merchant@example.com",
  "financialSettings": {
    "followUpFeeSuccessSpfy": 180,
    "followUpFeeSuccessMeta": 200,
    "adSaleCostDzd": 330,
    "splitExpensePercentage": 50
  }
}
```

**Response (201):**
```json
{
  "message": "تم إضافة التاجر بنجاح",
  "merchant": {
    "_id": "507f1f77bcf86cd799439011",
    ...
  }
}
```

---

### 4. تحديث بيانات تاجر
```
PUT /api/erp/merchants/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "businessName": "متجر التسوق الجديد",
  "ownerName": "أحمد محمد علي",
  "phone": "0798765432",
  "email": "newemail@example.com",
  "financialSettings": {
    "followUpFeeSuccessSpfy": 190,
    "followUpFeeSuccessMeta": 210,
    "adSaleCostDzd": 340,
    "splitExpensePercentage": 60
  }
}
```

**Response (200):**
```json
{
  "message": "تم تحديث بيانات التاجر بنجاح",
  "merchant": {...}
}
```

---

### 5. حذف تاجر
```
DELETE /api/erp/merchants/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "تم حذف التاجر بنجاح",
  "deletedMerchant": {...}
}
```

---

### 6. الحصول على إحصائيات التاجر
```
GET /api/erp/merchants/{id}/statistics
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "merchantId": "507f1f77bcf86cd799439011",
  "businessName": "متجر التسوق",
  "totalOrders": 156,
  "totalRevenue": 450000,
  "averageOrderValue": 2884,
  "deliverySuccessRate": 95.5
}
```

---

## Invoices Endpoints (الفواتير)

### 1. الحصول على جميع الفواتير
```
GET /api/erp/invoices
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "_id": "607f1f77bcf86cd799439012",
    "merchantId": {
      "_id": "507f1f77bcf86cd799439011",
      "businessName": "متجر التسوق",
      "ownerName": "أحمد محمد"
    },
    "periodStartDate": "2025-01-01T00:00:00.000Z",
    "periodEndDate": "2025-01-31T23:59:59.999Z",
    "summary": {
      "totalOrdersProcessed": 150,
      "deliveredCount": 142,
      "returnedCount": 8,
      "deliverySuccessRate": "94.67%",
      "totalRevenuesDzd": 500000,
      "totalCommissionsDzd": 28400,
      "adSpendUsd": 100,
      "adSpendDzd": 33000,
      "sharedExpensesDzd": 5000,
      "returnedPenaltiesDzd": 4000,
      "totalOwedDzd": 429600
    },
    "status": "generated",
    "createdAt": "2025-02-01T10:00:00.000Z"
  }
]
```

---

### 2. الحصول على فاتورة محددة
```
GET /api/erp/invoices/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "_id": "607f1f77bcf86cd799439012",
  "merchantId": {...},
  "periodStartDate": "2025-01-01T00:00:00.000Z",
  "periodEndDate": "2025-01-31T23:59:59.999Z",
  "summary": {...},
  "orderDetails": {
    "deliveredOrders": [
      {
        "orderId": "507f1f77bcf86cd799439013",
        "clientName": "محمد علي",
        "deliveryPrice": 3000,
        "followUpFee": 180
      }
    ],
    "returnedOrders": [
      {
        "orderId": "507f1f77bcf86cd799439014",
        "clientName": "فاطمة أحمد",
        "deliveryPrice": 2500,
        "returnedFee": 500
      }
    ]
  },
  "adsAndMarketingDetails": [...],
  "expensesDetails": [...],
  "status": "generated"
}
```

---

### 3. توليد فاتورة جديدة
```
POST /api/erp/invoices/generate/{merchantId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Response (201):**
```json
{
  "message": "تم توليد الفاتورة بنجاح",
  "invoice": {...}
}
```

---

### 4. تنزيل الفاتورة كملف Excel
```
GET /api/erp/invoices/{id}/download
Authorization: Bearer {token}
```

**Response:** Excel File (.xlsx)

يتم تحميل ملف Excel يحتوي على:
- ملخص الفاتورة مع بيانات التاجر
- جدول الطلبيات المسددة
- جدول الطلبيات المرتجعة
- جدول الإعلانات والتسويق
- جدول المصاريف الثابتة

---

### 5. تحديث حالة الفاتورة
```
PUT /api/erp/invoices/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "paid",
  "notes": "تم التحويل البنكي بنجاح"
}
```

**الحالات الممكنة:** `draft`, `generated`, `sent`, `paid`, `archived`

**Response (200):**
```json
{
  "message": "تم تحديث الفاتورة بنجاح",
  "invoice": {...}
}
```

---

### 6. حذف فاتورة
```
DELETE /api/erp/invoices/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "تم حذف الفاتورة بنجاح",
  "deletedInvoice": {...}
}
```

---

## Wallet Endpoints (المحفظة الذكية)

### 1. شراء وإيداع رصيد
```
POST /api/erp/wallet/topup
Authorization: Bearer {token}
Content-Type: application/json

{
  "amountUsd": 100,
  "exchangeRateDzd": 251,
  "billingRateDzd": 330,
  "description": "شحن بطاقة Wise"
}
```

---

### 2. صرف رصيد (إعلانات/عقوبات)
```
POST /api/erp/wallet/spend
Authorization: Bearer {token}
Content-Type: application/json

{
  "amountUsd": 50,
  "description": "حملة إعلانية لمحمد علي",
  "type": "spend"
}
```

---

### 3. جلب بيانات المحفظة
```
GET /api/erp/wallet/dashboard
Authorization: Bearer {token}
```

---

## Authentication

جميع الـ Endpoints تتطلب Bearer Token في الـ Header:
```
Authorization: Bearer {adjwt.token}
```

---

## HTTP Status Codes

- `200` - نجح الطلب
- `201` - تم الإنشاء بنجاح
- `400` - إدخال خاطئ
- `401` - عدم المصادقة
- `403` - غير مصرح الوصول
- `404` - غير موجود
- `500` - خطأ في الخادم

---

## الأخطاء الشائعة

### 401 Unauthorized
```json
{ "error": "Access token required" }
```

### 404 Not Found
```json
{ "error": "التاجر غير موجود" }
```

### 400 Bad Request
```json
{ "error": "الرجاء إدخال جميع البيانات المطلوبة" }
```

---

**ملاحظة:** جميع الـ Timestamps تُمثل في صيغة ISO 8601 (UTC).
