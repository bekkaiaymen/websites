# ✅ Pre-Deployment Checklist
# قائمة التحقق قبل النشر إلى الإنتاج

**تاريخ الفحص:** _____________
**المسؤول عن الفحص:** _____________
**ملاحظات عامة:** _____________

---

## 🔍 PHASE 1: كود و البيئة المحلية

### الكود (Code Quality)

- [ ] جميع الملفات المؤقتة محذوفة (console.logs, debug code)
- [ ] لا توجد syntax errors: `npm run lint` ✅
- [ ] جميع imports صحيحة وليست معلقة
- [ ] لا توجد commented-out code غير ضروري
- [ ] Error handling موجود لكل API calls
- [ ] Validation موجود لكل user inputs

### البيئة المحلية (Local Environment)

- [ ] Node.js version صحيح: `node --version` ✅
- [ ] npm version محدّثة: `npm --version` ✅
- [ ] جميع dependencies مثبتة: `npm install` ✅
- [ ] لا توجد missing modules
- [ ] .env.local موجود و صحيح (local development)

### الاختبار المحلي (Local Testing)

- [ ] `npm run dev` يشتغل بدون errors
- [ ] جميع الـ routes تحمّل صحيح
- [ ] API endpoints تجاوب بنتائج صحيحة
- [ ] Database connections تعمل locally
- [ ] Authentication/Login يعمل locally
- [ ] جميع الـ Features الأساسية تعمل

---

## 🛠️ PHASE 2: صور و موارد

### الملفات الثابتة (Static Files)

- [ ] جميع الصور معرّفة (paths صحيحة)
- [ ] جميع الـ icons معرّفة
- [ ] fonts محملة صحيح
- [ ] CSS/SCSS ينسّق على صحو
- [ ] Responsive design اختُبر على mobile

### الضّاجبات (Assets)

- [ ] جميع الـ images معرّفة في `public/` folder
- [ ] الـ image sizes معقول (مضغوط، لا كبير جداً)
- [ ] CDN links (لو موجود) تعمل
- [ ] Cloudinary/S3 links صحيحة (إن كان يستخدم)

---

## 🗄️ PHASE 3: قاعدة البيانات

### إعداد MongoDB

- [ ] MongoDB Atlas account موجود
- [ ] Database cluster موجود و active
- [ ] IP Whitelist متضمن `0.0.0.0/0` (Render access)
- [ ] Username و Password محفوظ بأمان
- [ ] MONGODB_URI صحيح و محفوظ

### البيانات (Data)

- [ ] النموذجيات (Models) معرّفة صحيح
- [ ] Indexes موجود للـ frequently queried fields
- [ ] جميع التوثيق (Validation) صحيح
- [ ] test data موجود في Database (optional)
- [ ] لا توجد production secrets في seed data

---

## 🔐 PHASE 4: الأمان (Security)

### Secrets و Keys

- [ ] JWT_SECRET حدّثت و قوي (32+ characters)
- [ ] جميع API keys آمنة و ليست في الكود
- [ ] third-party credentials محفوظة
- [ ] .env file في .gitignore
- [ ] .env.example موجود (بدون سرية)

### معايير الأمان (Security Standards)

- [ ] Password hashing مستخدم (bcrypt/similar)
- [ ] CORS مضبوط صحيح للـ allowed domains
- [ ] API rate limiting موجود (اختياري لكن مفيد)
- [ ] Input validation موجود لكل endpoints
- [ ] SQL Injection protection موجود (إن كان يستخدم SQL)
- [ ] XSS protection موجود (في Frontend)
- [ ] HTTPS في كل جزء من متطلبات الإنتاج

---

## 📦 PHASE 5: البناء و الإنشاء (Build)

### Backend Build

- [ ] `npm install` ينجح بدون errors
- [ ] no peer dependency warnings غير مقبولة
- [ ] Build artifacts صحيح

### Frontend Build

- [ ] `npm run build` ينجح للـ ERP: `cd client-erp && npm run build` ✅
- [ ] Build dist folder موجود مع أحجام معقول
- [ ] ما في warnings أساسي من Vite
- [ ] `npm run build` ينجح للـ Storefront: `cd client-storefront && npm run build` ✅
- [ ] Source maps معطله للـ production (security)

---

## 🌐 PHASE 6: متغيرات البيئة للإنتاج

### Render Environment Variables

- [ ] PORT=5000
- [ ] NODE_ENV=production
- [ ] MONGODB_URI=[valid connection string]
- [ ] JWT_SECRET=[securely generated]
- [ ] USD_BUY_RATE=251
- [ ] USD_SELL_RATE=330
- [ ] SHOPIFY_WEBHOOK_SECRET=[من Shopify]
- [ ] SHOPIFY_FULFILLMENT_FEE=200
- [ ] CORS_ORIGIN=[Vercel frontend URLs]

### Vercel Environment Variables (ERP)

- [ ] VITE_API_URL=https://ali-baba-api.onrender.com

### Vercel Environment Variables (Storefront)

- [ ] VITE_API_URL=https://ali-baba-api.onrender.com

---

## 🚀 PHASE 7: إعدادات النشر (Deployment Configuration)

### Render Configuration

- [ ] render.yaml موجود في root
- [ ] name: ali-baba-api
- [ ] runtime: node
- [ ] rootDir: server (مهم!)
- [ ] buildCommand: npm install
- [ ] startCommand: npm start
- [ ] region: ohio (أو مناسب)
- [ ] autoDeploy: true

### Vercel Configuration (ERP)

- [ ] vercel.json موجود في client-erp
- [ ] rewrites لـ SPA routing موجود
- [ ] buildCommand: npm run build
- [ ] outputDirectory: dist
- [ ] Root Directory setting: client-erp

### Vercel Configuration (Storefront)

- [ ] vercel.json موجود في client-storefront
- [ ] rewrites لـ SPA routing موجود
- [ ] buildCommand: npm run build
- [ ] outputDirectory: dist
- [ ] Root Directory setting: client-storefront

---

## 📝 PHASE 8: التوثيق (Documentation)

### Documentation Files

- [ ] README.md محدّث
- [ ] LIVE_DEPLOYMENT_GUIDE.md موجود
- [ ] ENV_VARIABLES_CHECKLIST.md موجود
- [ ] DEPLOYMENT_QUICK_REFERENCE.md موجود
- [ ] TROUBLESHOOTING_GUIDE.md موجود
- [ ] API documentation محدّثة (if exists)
- [ ] Installation instructions واضحة

### Comments و Code Documentation

- [ ] Complex functions موثقة
- [ ] Environment-specific code مشروح
- [ ] API endpoints موثقة
- [ ] Database schema موثق

---

## 🔄 PHASE 9: Git و Version Control

### Repository Cleanliness

- [ ] جميع التغييرات Committed
- [ ] Working directory clean: `git status` قاول "nothing to commit"
- [ ] `.gitignore` يستثني `.env` و `node_modules`
- [ ] لا توجد merge conflicts
- [ ] Latest code from remote: `git pull`

### Branch Readiness

- [ ] جميع التغييرات في main/master branch
- [ ] جميع tests pass locally
- [ ] no broken commits في history

---

## ✨ PHASE 10: آخر فحوصات

### API Endpoints

- [ ] Health check endpoint موجود و يجاوب
- [ ] جميع الـ routes موجودة و accessible
- [ ] Error responses واضحة و helpful
- [ ] جميع المتوقع endpoints working

### Frontend Routes

- [ ] جميع الـ routes تحمّل
- [ ] Navigation يعمل صحيح
- [ ] Forms ترسل بيانات صحيح
- [ ] Error boundaries موجود

### Third-party Integrations (if applicable)

- [ ] Shopify webhook configured
- [ ] Cloudinary setup complete
- [ ] Payment gateway ready (if applicable)
- [ ] Email service configured (if applicable)

---

## 🎯 PHASE 11: اختبار التوافق (Compatibility Testing)

### Browser Compatibility

- [ ] Chrome/Chromium ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

### Responsive Design

- [ ] Mobile (320px+) ✅
- [ ] Tablet (768px+) ✅
- [ ] Desktop (1024px+) ✅

### Performance

- [ ] Page load time < 3 seconds
- [ ] No console errors (F12)
- [ ] No console warnings (critical ones)
- [ ] Images optimized
- [ ] API responses reasonable speed

---

## 📋 PHASE 12: الاختبار النهائي قبل الضغط (Final Pre-Push Testing)

### منطقة التسجيل (Login Flow)

- [ ] Register new user works
- [ ] Login with credentials works
- [ ] JWT token is created
- [ ] Token persists in localStorage
- [ ] Logout clears token

### CRUD Operations

- [ ] Create works (if applicable)
- [ ] Read works (Fetch data)
- [ ] Update works (if applicable)
- [ ] Delete works (if applicable)

### Data Persistence

- [ ] Data saves to MongoDB
- [ ] Data retrieves correctly
- [ ] Foreign keys/references work
- [ ] Transactions complete properly

---

## 📤 PHASE 13: الدفع النهائي (Final Push)

### قبل الدفع (Before Push)

- [ ] جميع التغييرات committed locally
- [ ] لا توجد untracked sensitive files
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

### الدفع (Push)

```bash
# ✅ تأكد من الفرع الصحيح
git branch  # يجب يظهر * main أو * master

# ✅ دفع التغييرات
git push origin main

# ✅ اتابع الـ CI/CD في GitHub
# Render سيبني تلقائياً
# Vercel سيبني تلقائياً
```

### بعد الدفع (After Push)

- [ ] GitHub shows "✅ All checks passed"
- [ ] Render يبدأ الـ build (check red status → green)
- [ ] Vercel يبدأ الـ build (check building → ready)

---

## 🧪 PHASE 14: اختبار الإنتاج (Production Testing)

### Verify Deployments (30 دقيقة بعد الدفع)

```bash
# ✅ Backend
curl https://ali-baba-api.onrender.com/
# يجب يرجع: "Ali Baba Chocolate API is running 🍫"

# ✅ Health Check
curl https://ali-baba-api.onrender.com/api/health
# يجب يرجع: {"status": "ok"}

# ✅ إختبر ERP Frontend
https://alibaba-erp.vercel.app
# لازم تحمّل بدون blank page

# ✅ إختبر Storefront
https://alibaba-store.vercel.app
# لازم تحمّل و تشوف المنتجات
```

### Browser Testing (Production URLs)

- [ ] Open ERP: https://alibaba-erp.vercel.app
- [ ] Open DevTools (F12)
- [ ] Check Console tab for red errors
- [ ] Network tab: لا يجب يكون فيه red requests (404/500)
- [ ] Try logging in
- [ ] Try navigating between pages

### Mobile Testing (if applicable)

- [ ] Open on iPhone/iPad
- [ ] Open on Android
- [ ] Check responsive layout
- [ ] Touch interactions work

### API Integration Testing

```javascript
// في Browser Console (F12 → Console):

// 1. اختبر API endpoint
fetch('https://ali-baba-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

// يجب يظهر: {status: "ok"} أو شيء مشابه
```

---

## 🚨 PHASE 15: الطوارئ و الرجوع (Rollback Plan)

### إذا حدثت مشكلة:

- [ ] Render logs مشفوعة على الموقع
- [ ] Vercel logs مشفوعة على الموقع
- [ ] GitHub commit message يوضّح التغييرات
- [ ] rollback strategy معروف (revert to previous commit)

### Emergency Contacts

- [ ] Render Support: https://support.render.com
- [ ] Vercel Support: https://vercel.com/support
- [ ] MongoDB Support: https://support.mongodb.com

---

## ✅ FINAL SIGN-OFF

### التوقيع النهائي (Sign Off)

```
تاريخ الفحص:         _______________
المسؤول:             _______________

الحالة الكاملة:      ✅ جاهز للإطلاق
أو:                  ❌ يحتاج تصحيحات

الملاحظات:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### بعد النشر الناجح

- [ ] أخبر الفريق بـ URLs الجديدة
- [ ] قدّم نسخة من checklist للـ stakeholders
- [ ] احفظ backup من environment variables
- [ ] ركّب monitoring (Sentry/DataDog)
- [ ] اضبط alerts للـ errors و downtime

---

**آخر تحديث:** 12 أبريل 2026
**حالة القائمة:** جاهزة للاستخدام ✅

**ملاحظة:** يفترض هذا القائمة أنك اتبعت جميع الخطوات في LIVE_DEPLOYMENT_GUIDE.md
