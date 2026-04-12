# 🎯 Deployment Quick Reference Card
# بطاقة المرجع السريع للنشر

---

## ⚡ نشر في 3 خطوات بسيطة

```
1️⃣  Backend (Render)
    Render → New Web Service → Root Directory: server ← npm install ← npm start

2️⃣  ERP Frontend (Vercel)  
    Vercel → Import Repo → Root Directory: client-erp ← npm run build

3️⃣  Storefront (Vercel)
    Vercel → Import Repo → Root Directory: client-storefront ← npm run build
```

---

## 📋 متغيرات البيئة (Environment Variables)

| الخدمة | المتغير | القيمة |
|-------|---------|--------|
| **Render** | PORT | 5000 |
| | NODE_ENV | production |
| | MONGODB_URI | [من MongoDB Atlas] |
| | JWT_SECRET | [توليد عشوائي] |
| | USD_BUY_RATE | 251 |
| | USD_SELL_RATE | 330 |
| | SHOPIFY_WEBHOOK_SECRET | [من Shopify] |
| **Vercel ERP** | VITE_API_URL | https://ali-baba-api.onrender.com |
| **Vercel Store** | VITE_API_URL | https://ali-baba-api.onrender.com |

---

## 🔗 URLs النهائية

```
Backend API:
  https://ali-baba-api.onrender.com

ERP Dashboard:
  https://alibaba-erp.vercel.app

Storefront:
  https://alibaba-store.vercel.app
```

---

## ✅ Verification Checklist (10 دقائق)

```bash
# 1. اختبر Backend
curl https://ali-baba-api.onrender.com/
# يجب يرجع: "Ali Baba Chocolate API is running 🍫"

# 2. افتح ERP في Browser
https://alibaba-erp.vercel.app
# يجب تحمّل بدون blank page

# 3. افتح Storefront
https://alibaba-store.vercel.app
# يجب تحمّل و تشوف المنتجات

# 4. في Browser Console (F12):
# تأكد لا توجد Red errors (أحمر)

# 5. اختبر Login
# في ERP: ادخل credentials
# يجب يدخل بدون API errors
```

---

## 🚨 الأخطاء الشائعة

| الخطأ | الحل |
|------|------|
| **404 - Build fails** | Root Directory خاطئ |
| **Cannot connect to MongoDB** | MONGODB_URI خاطئ أو IP not whitelisted |
| **CORS Error** | VITE_API_URL خاطئ أو CORS not configured |
| **Blank page on Vercel** | vercel.json missing أو corrupted |
| **Login fails** | JWT_SECRET مختلف بين services |
| **Timeout on Render** | Free tier cold start (طبيعي أول مرة) |

---

## ⚙️ تكوين سريع

### Render (Backend)

```yaml
Name: ali-baba-api
Runtime: Node
Root Directory: server
Build Command: npm install
Start Command: npm start
Region: Ohio (أو قريب من المستخدمين)
Auto Deploy: ON (من GitHub)
```

### Vercel (ERP & Storefront)

```yaml
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
Environment Variables:
  VITE_API_URL: https://ali-baba-api.onrender.com
```

---

## 🔄 Git Workflow

```bash
# 1. عمل التغييرات محلياً
git add .
git commit -m "نوع التغيير"

# 2. Push إلى GitHub
git push origin main

# 3. الخدمات تبني تلقائياً:
#    - Render: Check Logs after 1-2 minutes
#    - Vercel: Check Deployments after 1-2 minutes

# 4. اختبر الـ URLs الجديدة
https://ali-baba-api.onrender.com
https://alibaba-erp.vercel.app
https://alibaba-store.vercel.app
```

---

## 📱 على Mobile

```
في تطبيق Mobile أو تطبيق Shopify:
استبدل API URL بـ: https://ali-baba-api.onrender.com

لا تستخدم localhost - لن يعمل من الخارج
```

---

## 🔐 أمان (Security)

```
✅ DO:
- استخدم HTTPS فقط (Render و Vercel يفعلون هذا افتراضياً)
- أضف .env في .gitignore
- استخدم strong JWT_SECRET (32+ chars)
- غيّر الـ secrets كل 3-6 أشهر

❌ DON'T:
- لا تشارك .env في GitHub
- لا تنسخ API keys في Browser DevTools
- لا تستخدم production URLs في localhost testing
- لا تترك Free tier عام طويل (قد يوقف)
```

---

## 🉑 FAQ سريع

**س: كم المدة حتى تحمّل أول مرة؟**
ج: 2-5 دقائق على Render, 1-3 دقائق على Vercel

**س: كيف أعيد بناء بدون code changes؟**
ج: Render/Vercel → Manual Deploy أو Redeploy button

**س: الخادم بيوقف بعد فترة؟**
ج: نعم، Render Free tier يوقف بعد 15 دقيقة من عدم الاستخدام. الحل: upgrade الخطة

**س: كيف أتابع الأخطاء؟**
ج: Render/Vercel Dashboards لهم Logs tabs

**س: هل أحتاج أدفع؟**
ج: لا للبداية، لكن للـ Production: Render $7/month, Vercel $20/month

---

## 🎓 آخر خطوات (Post Deployment)

```
1. اختبر في Real Browser (ليس localhost)
2. اختبر في Mobile Device
3. اختبر الـ Features الرئيسية (Login, Create, Edit, Delete)
4. اتفقد Browser Logs في F12 Console
5. اتفقد Render/Vercel Logs للـ errors
6. ركّب Uptime Monitor (optional)
7. اضبط Auto Scaling (optional)
```

---

## 📞 روابط مهمة

| الخدمة | الموقع |
|-------|--------|
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| MongoDB Atlas | https://cloud.mongodb.com/v2 |
| GitHub | https://github.com |
| Shopify Admin | https://admin.shopify.com |

---

## 💾 File Locations

| الملف | الموقع |
|------|--------|
| Backend config | server/package.json |
| Backend env | server/.env (local only) |
| Frontend ERP config | client-erp/package.json |
| Frontend Store config | client-storefront/package.json |
| Render config | render.yaml |
| Vercel config | client-erp/vercel.json, client-storefront/vercel.json |

---

## 🎯 Success Indicators

```
✅ Backend responding: HTTP 200 from root endpoint
✅ ERP loading: No blank page, HTML loaded
✅ Storefront loading: No blank page, Products visible
✅ Login working: Can authenticate and get token
✅ API calls: Data flows from Backend to Frontend
✅ Webhooks: Shopify → Backend communication working
✅ Database: Users, Products, Orders properly stored
```

---

## 🆘 Emergency Contacts

| المشكلة | الحل |
|--------|------|
| **Backend down completely** | أعد بناء في Render |
| **Frontend blank page** | عدّل vercel.json rewrites |
| **Database disconnected** | تحقق MongoDB Atlas whitelist |
| **API timeout** | upgrade Render plan |
| **Build keeps failing** | اشوف Logs + اختبر محلياً |

---

**آخر تحديث:** 12 أبريل 2026 ✅

**الملخص:** من:
- إضافة متغيرات البيئة
- إلى الاختبار
= 30 دقيقة كاف لنشر كامل 🚀
