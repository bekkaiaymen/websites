# 🔐 Environment Variables Setup Guide

## توثيق إعداد متغيرات البيئة

---

## **المرحلة 1️⃣: التطوير المحلي - Local Development**

### في جهازك المحلي:
1. **انسخ ملف المثال:**
```bash
cp server/.env.example server/.env
```

2. **عدّل `server/.env` بـ بيانات الاتصال الخاصة بك:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/database_name?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

3. **ملاحظة أمنية:**
   - ❌ لا تضع `.env` على GitHub
   - ✅ `.env` مُدرج في `.gitignore` (آمن)
   - ✅ استخدم `.env.example` للتوثيق

---

## **المرحلة 2️⃣: الإنتاج على Render - Production Deployment**

### خطوات إعداد Render:

**1. اذهب إلى Render Dashboard:**
   - https://dashboard.render.com

**2. اختر الـ Service (ali-baba-api):**
   - اضغط على الـ service الخاص بك
   - اذهب إلى **Environment**

**3. أضف متغيرات البيئة الآمنة:**
   - اضغط **+ Add Environment Variable**

**4. أضف كل المتغيرات المطلوبة:**

| المتغير | القيمة | ملاحظات |
|--------|--------|--------|
| `PORT` | `5000` | معايير |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/database` | من MongoDB Atlas |
| `JWT_SECRET` | `strong-production-secret-key` | غيّر عن الـ dev! |
| `SHOPIFY_WEBHOOK_SECRET` | `your-webhook-secret` | من Shopify |
| `CLOUDINARY_NAME` | `your-cloudinary-name` | من Cloudinary |
| `CLOUDINARY_API_KEY` | `your-api-key` | من Cloudinary |
| `CLOUDINARY_API_SECRET` | `your-api-secret` | من Cloudinary |

**5. احفظ التغييرات:**
   - اضغط **Save Changes**
   - Render سيعيد development الـ server تلقائيًا ✅

---

## **🚨 المشاكل الشائعة:**

### ❌ Error: Cannot find MongoDB

**السبب:** `MONGODB_URI` غير صحيح أو ناقص

**الحل:**
```bash
# تحقق من Connection String في MongoDB Atlas:
# 1. MongoDB Atlas Dashboard
# 2. Cluster → Connect
# 3. Connection String → Copy
# 4. الشكل الصحيح:
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### ❌ Error: ENOTFOUND _mongodb._tcp.cluster.mongodb.net

**السبب:** عنوان IP لم يُضاف إلى MongoDB Atlas whitelist

**الحل:**
```
1. MongoDB Atlas → Network Access
2. Add IP Address
3. خيارات:
   - أضف عنوان IP الحالي
   - أو 0.0.0.0/0 (مؤقتًا للاختبار)
```

### ❌ Error: Invalid Credentials

**السبب:** اسم المستخدم/كلمة المرور غير صحيحة

**الحل:**
```
1. MongoDB Atlas → Database Access
2. تحقق من اسم المستخدم وكلمة المرور
3. انسخ من Edit password إن لزم الأمر
```

---

## **✅ كيفية التحقق من الاتصال:**

### محليًا:
```bash
cd server
npm start
# يجب أن ترى: ✅ MongoDB connected
```

### على Render:
```
1. Render Dashboard
2. اختر الـ service
3. Logs tab
4. ابحث عن: ✅ MongoDB connected
```

---

## **📋 الحد الأدنى للمتغيرات المطلوبة:**

| اسم المتغير | نوع | الحالة |
|-----------|------|-------|
| `MONGODB_URI` | String | **مطلوب** (للاتصال بقاعدة البيانات) |
| `JWT_SECRET` | String | **مطلوب** (للـ authentication) |
| `PORT` | Number | اختياري (default: 5000) |
| `SHOPIFY_WEBHOOK_SECRET` | String | اختياري (لـ Shopify فقط) |
| `CLOUDINARY_*` | Strings | اختياري (لـ image uploads) |

---

## **🔄 Render Auto-Deploy:**

عندما تغيّر متغيرات البيئة على Render:
```
1. اضغط Save
2. انتظر القائمة التي تقول "Deploying..."
3. سيُعاد تشغيل الـ server تلقائيًا ✅
```

---

## **🛡️ نصائح الأمان:**

✅ **افعل:**
- استخدم كلمات مرور قوية
- غيّر `JWT_SECRET` في الإنتاج
- فعّل IP whitelist على MongoDB Atlas
- استخدم HTTPS فقط

❌ **لا تفعل:**
- أبدًا لا تشاركم `.env` على GitHub
- لا تستخدم نفس الأسرار في development و production
- لا تترك `0.0.0.0/0` دائمًا في MongoDB (أمان مؤقت فقط)

---

**آخر تحديث:** 12 أبريل 2026
**الحالة:** ✅ جميع الخوادم متصلة وتعمل بشكل صحيح
