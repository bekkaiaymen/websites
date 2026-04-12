# Environment Variables Checklist
# ✅ استخدم هذا الملف كمرجع لكل المتغيرات المطلوبة

## 🔴 RENDER.COM - Backend (server/.env)

### المتغيرات الأساسية (REQUIRED)
```
✅ PORT=5000
✅ NODE_ENV=production
✅ MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alibaba_chocolate
✅ JWT_SECRET=your-production-secret-key-min-32-chars
```

### متغيرات الأعمال (Required for Operations)
```
✅ USD_BUY_RATE=251
✅ USD_SELL_RATE=330
✅ SHOPIFY_FULFILLMENT_FEE=200
✅ SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

### متغيرات اختيارية (Optional)
```
⭕ SMTP_HOST=smtp.gmail.com
⭕ SMTP_PORT=587
⭕ SMTP_USER=your-email@gmail.com
⭕ SMTP_PASS=app-specific-password
⭕ CORS_ORIGIN=https://alibaba-erp.vercel.app,https://alibaba-store.vercel.app
⭕ LOG_LEVEL=info
```

---

## 🔵 VERCEL.COM - ERP Dashboard (client-erp)

### بيئات الإنتاج
```
✅ VITE_API_URL=https://ali-baba-api.onrender.com
```

### بيانات Vercel Project
```
- Root Directory: client-erp
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
```

---

## 🟢 VERCEL.COM - Storefront (client-storefront)

### بيئات الإنتاج
```
✅ VITE_API_URL=https://ali-baba-api.onrender.com
```

### بيانات Vercel Project
```
- Root Directory: client-storefront
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
```

---

## 📋 نموذج لملء المتغيرات

### للـ Render Backend:
```
اسم المتغير                     | القيمة               | الوصف
------                          | ------              | ------
PORT                            | 5000                | منفذ الخادم الأساسي
NODE_ENV                        | production          | بيئة الإنتاج
MONGODB_URI                     | [copy from Atlas]   | رابط قاعدة البيانات
JWT_SECRET                      | [generate random]   | مفتاح تشفير التوكنات
USD_BUY_RATE                    | 251                 | سعر شرائك للدولار
USD_SELL_RATE                   | 330                 | سعر بيعك للدولار
SHOPIFY_WEBHOOK_SECRET          | [copy from Shopify] | Shopify Signing Secret
SHOPIFY_FULFILLMENT_FEE         | 200                 | رسم الديليفري
CORS_ORIGIN                     | [frontend URLs]     | مصادر CORS المسموحة
```

---

## 🔗 كيفية الحصول على كل المتغيرات

### 1. MongoDB_URI (قاعدة البيانات)
```
1. اذهب إلى https://www.mongodb.com/cloud/atlas
2. اختر Database → Overview
3. اضغط "Connect" → "Connect your application"
4. اختر Driver: Node.js version 3.6 أو أحدث
5. انسخ رابط الاتصال
6. استبدل:
   <username> → اسم المستخدم
   <password> → كلمة المرور
   <myFirstDatabase> → alibaba_chocolate
```

### 2. JWT_SECRET (مفتاح سري قوي)
```
الخيار 1: استخدم Command Line:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

الخيار 2: استخدم موقع:
  https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&symbols=on

تأكد أنه أطول من 32 حرف
```

### 3. SHOPIFY_WEBHOOK_SECRET
```
1. اذهب إلى Shopify Admin
2. Settings → Apps and integrations
3. اختر development apps أو integration
4. في Webhooks، وجد "Signing secret"
5. اضغط "Show" و انسخ القيمة
```

### 4. CORS_ORIGIN
```
بعد نشر Frontends على Vercel:
  https://alibaba-erp.vercel.app
  https://alibaba-store.vercel.app

أو إذا أضفت أسماء مخصصة:
  https://erp.alibaba-chocolate.com
  https://store.alibaba-chocolate.com
```

---

## ✅ التحقق من الإضافة الصحيحة

### في Render:
```
1. Dashboard → Select Project → Settings
2. اذهب إلى "Environment"
3. تأكد من وجود كل المتغيرات:
   - PORT ✅
   - NODE_ENV ✅
   - MONGODB_URI ✅
   - JWT_SECRET ✅
   - وبقية المتغيرات
```

### في Vercel:
```
1. Dashboard → Select Project → Settings
2. اذهب إلى "Environment Variables"
3. تأكد من:
   - VITE_API_URL ✅ مشير إلى Render URL
   - لا توجد متغيرات مكررة
```

---

## 🚨 الأخطاء الشائعة في المتغيرات

❌ **خطأ 1:** نسيان MONGODB_URI
```
الأعراض: Cannot connect to MongoDB
الحل: أضف MONGODB_URI بقيمة صحيحة من MongoDB Atlas
```

❌ **خطأ 2:** VITE_API_URL خاطئ
```
الأعراض: API calls فشل (404 أو CORS error)
الحل: تأكد من:
  - لا توجد slash في النهاية: ❌ https://api.com/ ✅ https://api.com
  - الرابط صحيح والـ Backend يعمل
```

❌ **خطأ 3:** JWT_SECRET قصير جداً
```
الأعراض: Tokens غير صحيحة
الحل: استخدم secret أطول من 32 حرف
```

❌ **خطأ 4:** متغيرات مكررة
```
الأعراض: Vercel build fails مع رسالة غريبة
الحل: احذف المتغيرات المكررة
```

---

## 📝 ملف .env.example (نسخة آمنة بدون قيم)

ضع هذا الملف في GitHub:

### server/.env.example
```
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
USD_BUY_RATE=251
USD_SELL_RATE=330
SHOPIFY_WEBHOOK_SECRET=your_shopify_secret_here
SHOPIFY_FULFILLMENT_FEE=200
CORS_ORIGIN=https://front1.vercel.app,https://front2.vercel.app
```

### .gitignore (احمي .env)
```
.env
.env.local
.env.*.local
!.env.example
```

---

## 🔐 نصائح الأمان

✅ **استخدم متغيرات قوية:**
- JWT_SECRET: حد أدنى 32 حرف عشوائي
- API URLs: استخدم HTTPS فقط

✅ **لا تنسخ المتغيرات عبر GitHub:**
- أضف .env في .gitignore
- استخدم مميزات Render/Vercel للسرية

✅ **غيّر المتغيرات السرية بشكل دوري:**
- قم بتحديث JWT_SECRET كل 3-6 أشهر
- غيّر أسعار الصرف عند الحاجة

✅ **لا تشارك الـ Secrets:**
- لا تنسخ في Slack أو Telegram
- استخدم 1Password أو LastPass

---

## 📞 ملخص سريع

| الخدمة | الملف | المتغيرات المطلوبة | حيث |
|-------|------|------------------|------|
| Render | server/.env | 8+ متغيرات | Render Dashboard → Env |
| Vercel ERP | - | 1 متغير | Vercel Dashboard → Env |
| Vercel Store | - | 1 متغير | Vercel Dashboard → Env |

---

**آخر تحديث:** 12 أبريل 2026
**الحالة:** جاهز للإنتاج ✅
