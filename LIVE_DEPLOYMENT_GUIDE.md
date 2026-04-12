# 🚀 دليل النشر المباشر إلى الإنتاج
# LIVE_DEPLOYMENT_GUIDE.md

**تاريخ الإنشاء:** 12 أبريل 2026
**الحالة:** جاهز للإنتاج
**المعمارية:** Monorepo (Backend + Frontend ERP + Storefront)

---

## 📋 محتويات الدليل

1. [نظرة عامة على البنية](#نظرة-عامة)
2. [نشر Backend على Render](#نشر-backend-على-render)
3. [نشر ERP Frontend على Vercel](#نشر-erp-على-vercel)
4. [نشر Storefront على Vercel](#نشر-storefront-على-vercel)
5. [متغيرات البيئة](#متغيرات-البيئة)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🏗️ نظرة عامة على البنية

مشروعك يُقسم إلى 3 أجزاء:

```
📦 Monorepo
├── 📁 server (Node.js/Express)
│   └── Deploy to Render.com (Web Service)
│
├── 📁 client-erp (React/Vite - ERP Dashboard)
│   └── Deploy to Vercel
│
└── 📁 client-storefront (React/Vite - Customer Store)
    └── Deploy to Vercel
```

**روابط النشر المتوقعة:**
- Backend API: `https://ali-baba-api.onrender.com` (مثال)
- ERP Dashboard: `https://erp.alibaba-chocolate.com` (مثال)
- Storefront: `https://store.alibaba-chocolate.com` (مثال)

---

## 🔧 الخطوة 1️⃣: نشر Backend على Render

### المتطلبات قبل البدء:

✅ تسجيل حساب على Render.com (https://render.com)
✅ ربط حساب GitHub
✅ وجود repository على GitHub

### خطوات النشر:

#### 1. تسجيل الدخول إلى Render

```
1. اذهب إلى https://render.com
2. اضغط على "Sign Up" أو "Sign In"
3. اختر "GitHub" و وافق على الأذونات
```

#### 2. إنشاء Web Service جديد

```
1. من لوحة التحكم → اضغط "New" → "Web Service"
2. اختر Repository: اختر مشروعك (alibaba-chocolate أو ما يسميه)
3. اضغط "Connect"
```

#### 3. إعدادات النشر

```
الاسم (Name):
  ↳ ali-baba-api

البرنامج (Runtime):
  ↳ Node

الجذر (Root Directory):
  ↳ server
  ⚠️ مهم جداً: يجب أن تختار "server" لأن المجلد الجذري للـ Backend موجود هناك

أمر البناء (Build Command):
  ↳ npm install

أمر التشغيل (Start Command):
  ↳ npm start

خطة التسعير (Plan):
  ↳ اختر "Free" للبداية (مناسب للتطوير)
```

#### 4. إضافة متغيرات البيئة (Environment Variables)

⚠️ **مهم جداً: يجب أن تسرد كل المتغيرات التالية:**

```
في قسم "Environment":

PORT = 5000

MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/database
(احصل على هذا من MongoDB Atlas)

JWT_SECRET = your-super-secret-key-change-this-in-production
(استخدم مفتاح قوي عشوائي)

USD_BUY_RATE = 251

USD_SELL_RATE = 330

SHOPIFY_WEBHOOK_SECRET = your-shopify-webhook-signing-secret
(احصل عليه من Shopify Admin)

SHOPIFY_FULFILLMENT_FEE = 200

NODE_ENV = production
```

#### 5. النشر

```
1. اضغط على "Create Web Service"
2. سيبدأ البناء تلقائياً (قد يستغرق 2-5 دقائق)
3. ستظهر رابط مثل: https://ali-baba-api.onrender.com
4. تحقق من الصحة: زر https://ali-baba-api.onrender.com/
```

**ملاحظات مهمة عن Render:**

- ✅ النشر التلقائي: كل push إلى GitHub سيُشغّل بناء جديد تلقائياً
- ✅ السجلات: يمكنك رؤية logs مباشرة من لوحة التحكم
- ⚠️ Free tier: الخادم قد يُوقف بعد 15 دقيقة من عدم النشاط (startup delay)
- 💡 للإنتاج الحقيقي: ارقّ إلى "Paid" لتجنب التأخير

---

## 🎨 الخطوة 2️⃣: نشر ERP Dashboard على Vercel

### المتطلبات:

✅ حساب على Vercel.com (https://vercel.com)
✅ ربط GitHub

### خطوات النشر:

#### 1. تسجيل/دخول Vercel

```
اذهب إلى https://vercel.com/signup
اختر "Continue with GitHub"
وافق على الأذونات
```

#### 2. استيراد المشروع

```
1. اضغط "Add New" → "Project"
2. اختر "Import Git Repository"
3. ابحث عن: alibaba-chocolate (أو اسم repo)
4. اضغط "Import"
```

#### 3. إعدادات المشروع

**جداً مهم: اختر المجلد الجذري الصحيح:**

```
Framework Preset:
  ↳ Vite

Root Directory:
  ↳ client-erp
  ⚠️ هذا هو المفتاح: يجب أن تختار "client-erp"

Build Command:
  ↳ npm run build

Output Directory:
  ↳ dist
```

#### 4. متغيرات البيئة

أضف تحت "Environment Variables":

```
VITE_API_URL = https://ali-baba-api.onrender.com
(استبدل الرابط برابط Backend API الخاص بك)
```

#### 5. النشر

```
اضغط "Deploy"
انتظر حتى ينتهي البناء (1-3 دقائق)
ستحصل على رابط مثل: https://alibaba-erp.vercel.app
```

**بعد النشر:**

```
في إعدادات المشروع → Domains:

أضف اسم نطاق مخصص (اختياري):
  erp.alibaba-chocolate.com
```

---

## 🛒 الخطوة 3️⃣: نشر Storefront على Vercel

نفس الخطوات السابقة لكن مع اختلاف واحد:

#### الفرق الوحيد:

```
Root Directory:
  ↳ client-storefront  ← استخدم client-storefront بدلاً من client-erp

جميع الخطوات الأخرى نفسها
```

**النتيجة:** ستحصل على رابط مثل `https://alibaba-store.vercel.app`

---

## 🌍 متغيرات البيئة - شرح كامل

### البيئة 1: Render (Backend)

**المتغيرات المطلوبة في `server/.env`:**

```bash
# ⚙️ الخادم الأساسي
PORT=5000
NODE_ENV=production

# 🗄️ قاعدة البيانات
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alibaba_chocolate?retryWrites=true&w=majority

# 🔐 المفاتيح السرية
JWT_SECRET=your-super-secret-production-key-min-32-chars
(استخدم: https://www.random.org/strings/ للتوليد)

# 💰 أسعار الصرف
USD_BUY_RATE=251
USD_SELL_RATE=330

# 🛍️ Shopify Integration
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-from-shopify-admin
SHOPIFY_FULFILLMENT_FEE=200

# 📧 البريد الإلكتروني (إذا كنت تستخدمه)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**كيفية الحصول على كل متغير:**

1. **MONGODB_URI:**
   ```
   1. اذهب إلى MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
   2. اختر Database → Connect
   3. انسخ رابط الاتصال
   4. استبدل كلمة المرور واسم قاعدة البيانات
   ```

2. **JWT_SECRET:**
   ```
   استخدم أي أداة عشوائية أو:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **SHOPIFY_WEBHOOK_SECRET:**
   ```
   من Shopify Admin → Settings → Apps and integrations → Webhooks
   عند إنشاء webhook جديد، ستجد "Signing secret"
   ```

### البيئة 2: Vercel (Frontend - ERP)

**في إعدادات Vercel Project → Environment Variables:**

```
VITE_API_URL = https://ali-baba-api.onrender.com

ملاحظات:
- استبدل الرابط برابط Backend الفعلي
- البادئة VITE_ مهمة (Vite يقرأها تلقائياً)
```

### البيئة 3: Vercel (Frontend - Storefront)

**نفس الشيء:**

```
VITE_API_URL = https://ali-baba-api.onrender.com
```

---

## 📝 ملخص المتغيرات المطلوبة

| المتغير | الحيث | الغرض | مثال |
|--------|------|-------|------|
| PORT | Render | منفذ الخادم | 5000 |
| MONGODB_URI | Render | قاعدة البيانات | mongodb+srv://... |
| JWT_SECRET | Render | تشفير التوكنات | abc123def456... |
| USD_BUY_RATE | Render | سعر شرائك | 251 |
| USD_SELL_RATE | Render | سعر الفروج | 330 |
| SHOPIFY_WEBHOOK_SECRET | Render | Shopify webhooks | xyz789... |
| VITE_API_URL | Vercel ERP | رابط API | https://api.onrender.com |
| VITE_API_URL | Vercel Store | رابط API | https://api.onrender.com |

---

## 🔗 الربط بين المكونات

بعد النشر، ستحتاج لتحديث روابط API في Frontend:

### في Vercel (ERP Dashboard):

```
Environment Variables:
  VITE_API_URL = https://ali-baba-api.onrender.com
```

### في Vercel (Storefront):

```
Environment Variables:
  VITE_API_URL = https://ali-baba-api.onrender.com
```

### في Render (Backend):

```
CORS الإشارة إلى:
- https://alibaba-erp.vercel.app
- https://alibaba-store.vercel.app
(إذا أضفت أسماء نطاقات مخصصة)
```

---

## 🛠️ استكشاف الأخطاء الشائعة

### ❌ مشكلة 1: "Cannot find module 'express'"

**الحل:**
```
في Render:
- تحقق أن Root Directory = server
- تحقق أن Build Command = npm install
- فعّل Logs: Settings → Deploy Logs
```

### ❌ مشكلة 2: "CORS Error"

**الحل:**
```
أضف في server/.env:
CORS_ORIGIN=https://alibaba-erp.vercel.app,https://alibaba-store.vercel.app

وفي server/index.js:
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true
}));
```

### ❌ مشكلة 3: "API endpoint returns 404"

**الحل:**
```
تحقق من:
1. هل VITE_API_URL صحيح؟
2. هل Backend يعمل؟ زر https://ali-baba-api.onrender.com/
3. اطبع VITE_API_URL في browser console للتحقق
```

### ❌ مشكلة 4: "Vercel Build Fails"

**الحل:**
```
1. تحقق من Root Directory (يجب client-erp أو client-storefront)
2. تحقق أن vite.config.js موجود
3. اطلع على Build Logs في Vercel
4.تأكد من npm run build ينجح محلياً أولاً:
   cd client-erp && npm run build
```

### ❌ مشكلة 5: "Blank page on Vercel"

**الحل:**
```
Vercel routing configuration:
تحقق من vercel.json في client-erp:

{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

هذا يضمن SPA routing يعمل تماماً
```

---

## ✅ كيفية التحقق من أن كل شيء يعمل

### 1. تحقق من Backend:

```bash
curl https://ali-baba-api.onrender.com/
# يجب أن ترى: Ali Baba Chocolate API is running 🍫
```

### 2. تحقق من ERP:

```
افتح: https://alibaba-erp.vercel.app
يجب أن تدخل بدون أخطاء 404
```

### 3. تحقق من Storefront:

```
افتح: https://alibaba-store.vercel.app
يجب أن تدخل وتشوف الصفحة الرئيسية
```

### 4. تحقق من الاتصال:

```
في ERP Dashboard:
1. اذهب إلى Admin Login
2. تسجيل دخول ناجح؟ ✅ API يعمل
3. هل ترى البيانات؟ ✅ كل شيء متصل
```

---

## 🔄 النشر المستقبلي (Auto Deployment)

### كل مرة تعمل push إلى GitHub:

```
1. Render يُبني Backend تلقائياً
   - يأخذ 2-5 دقائق
   - لا تحتاج تفعل أي شيء

2. Vercel تُبني Frontends تلقائياً
   - تأخذ 1-3 دقائق لكل app
   - غالباً تحتاج أقل من دقيقة
```

**للتحقق من حالة البناء:**
- Render: Dashboard → Logs
- Vercel: projectName → Deployments

---

## 📱 نصائح الإنتاج

✅ **استخدم HTTPS دائماً:**
- Render يستخدم HTTPS افتراضياً
- Vercel يستخدم HTTPS افتراضياً

✅ **أضف أسماء نطاقات مخصصة:**
```
بدلاً من: alibaba-erp.vercel.app
استخدم: erp.alibaba-chocolate.com
```

✅ **راقب الأداء:**
- Render Dashboard → Metrics
- Vercel Dashboard → Analytics

✅ **احفظ النسخ الاحتياطية:**
```
LinkedIn: انسخ قيم البيئة إلى ملف آمن
GitHub: ضع .env.example (بدون قيم سرية)
```

✅ **للإنتاج الحقيقي:**
- ارقّ Render من Free إلى Starter ($7/شهر)
- استخدم Custom Domain لـ SEO
- فَعّل HTTPS/TLS
- اضبط monitoring و alerts

---

## 🆘 الدعم والموارد

| المشكلة | الموقع |
|--------|--------|
| مشاكل Render | https://render.com/docs |
| مشاكل Vercel | https://vercel.com/docs |
| مشاكل MongoDB | https://www.mongodb.com/docs/atlas/ |
| مشاكل Shopify | https://shopify.dev/docs |

---

## 📅 جدول المراجعة قبل الإطلاق

- [ ] كل المتغيرات البيئية مضافة في Render
- [ ] كل المتغيرات البيئية مضافة في Vercel
- [ ] Backend يعمل: https://ali-baba-api.onrender.com/
- [ ] ERP يحمّل بدون أخطاء
- [ ] Storefront يحمّل بدون أخطاء
- [ ] المصادقة تعمل (Login)
- [ ] API calls تعمل (البيانات تحمّل)
- [ ] Webhooks تعمل (Shopify → Backend)
- [ ] Database متصلة (يمكنك شوف البيانات)
- [ ] CORS نشتغل بشكل صحيح

---

**ملاحظة أخيرة:** 🎉

هذا الدليل يغطي الإعداد الأساسي. للإنتاج الضخم:
- أضف CDN (Cloudflare)
- أضف Monitoring (Sentry, DataDog)
- اضبط Rate Limiting
- أضف Database Backups
- استخدم Environment-specific configs

**بالتوفيق! 🚀**
