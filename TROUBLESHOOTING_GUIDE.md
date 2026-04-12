# 🔧 Deployment Troubleshooting Guide
# دليل استكشاف الأخطاء في النشر

---

## 📌 الأخطاء الشائعة وحلولها

### 🔴 Error 1: "Cannot find module in Render"

**الأعراض:**
```
Error: Cannot find module 'express'
at Function._load (internal/modules/loader.js:...)
```

**الحل:**
```
✅ تأكد من:
1. Root Directory في Render = "server" (وليس root)
2. Build Command = "npm install"
3. Start Command = "npm start"
4. الملف server/package.json موجود

إذا استمرت المشكلة:
1. في Render → Select Service → Logs
2. شوف الأسطر الأولى من البناء
3. تأكد من npm install يعمل بدون أخطاء
4. اضغط "Manual Deploy" لإعادة محاولة البناء
```

---

### 🔴 Error 2: "CORS Error" - API calls فشل

**الأعراض:**
```javascript
Cross-Origin Request Blocked: The Same Origin Policy disallows reading 
the remote resource at https://ali-baba-api.onrender.com. 
(Reason: CORS header 'Access-Control-Allow-Origin' missing).
```

**الحل:**
```bash
في server/index.js، تأكد من CORS setup:

const cors = require('cors');

app.use(cors({
  origin: [
    'https://alibaba-erp.vercel.app',
    'https://alibaba-store.vercel.app',
    'http://localhost:5173'  // للتطوير المحلي
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

ثم:
1. Push إلى GitHub
2. Render سيبني تلقائياً
3. اختبر API من Vercel مجدداً
```

---

### 🔴 Error 3: "API returns 404"

**الأعراض:**
```
GET https://ali-baba-api.onrender.com/api/products
Status: 404 Not Found
```

**الحل:**
1. تحقق من الرابط:
   ```
   ❌ https://ali-baba-api.onrender.com/api/products/
   ✅ https://ali-baba-api.onrender.com/api/products
   (لا slash في النهاية عادة)
   ```

2. اختبر من Postman/cURL:
   ```bash
   curl https://ali-baba-api.onrender.com/api/health
   # يجب يرجع: {"status": "ok"} أو شيء مشابه
   ```

3. تأكد الـ route موجود في Backend:
   ```javascript
   app.get('/api/products', (req, res) => {
     res.json({products: []});
   });
   ```

---

### 🔴 Error 4: "Vercel Build Fails"

**الأعراض:**
```
Build failed at "npm run build" step
Error: Cannot find module 'react'
```

**الحل:**
```
1. تأكد من Root Directory صحيح:
   ✅ Vercel Settings → Root Directory = "client-erp"
   (أو "client-storefront" حسب الـ app)

2. نظّف الـ dependencies:
   cd client-erp
   rm -rf node_modules package-lock.json
   npm install
   npm run build

3. إذا استمرت:
   في Vercel:
   - Settings → Build & Development Settings
   - اضغط "Override" و جرّب بناء يدوي
   - اطلع على Logs للأخطاء الدقيقة
```

---

### 🔴 Error 5: "Blank Page on Vercel"

**الأعراض:**
```
الصفحة تحمّل لكن بيضاء تماماً (no content)
F12 Console: No errors shown
```

**الحل:**
```
✅ المشكلة غالباً: SPA routing

تأكد من vercel.json في client-erp:

{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}

هذا يخبّر Vercel: في أي route، ارجع index.html
ثم React Router يتولى باقي المسار

✅ بعد الإضافة:
1. Push إلى GitHub
2. Vercel سيبني مجدداً
3. الصفحة يجب تحمّل الآن
```

---

### 🔴 Error 6: "Cannot Login - Auth Failed"

**الأعراض:**
```
Username/Password صحيح لكن Login فشل
Error: 401 Unauthorized
```

**الحل:**
```
1. تأكد من JWT_SECRET موجود في Render:
   Render → Service Settings → Environment
   تأكد: JWT_SECRET موجود

2. تأكد من MONGODB_URI صحيح:
   جرّب الاتصال محلياً:
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('Connected!'))
     .catch(e => console.log('Error:', e.message));
   "

3. تحقق من User في Database:
   في MongoDB Atlas → Collections
   اذهب إلى "users"
   تأكد admin user موجود

4. إذا لم يكن موجود، أنشئ واحد:
   cd server
   npm run seed  (إذا كان script موجود)
   أو استخدم MongoDB Atlas UI مباشرة
```

---

### 🔴 Error 7: "Database Connection Failed"

**الأعراض:**
```
Error: MongoServerError: connect ECONNREFUSED
Cannot connect to MongoDB
```

**الحل:**
```
1. تأكد من MONGODB_URI صحيح:
   mongodb+srv://username:password@cluster.mongodb.net/database

   اختبر القيمة:
   - فتح MongoDB Atlas → Clusters
   - اضغط "Connect"
   - انسخ رابط الاتصال مجدداً

2. تأكد من IP Whitelist:
   MongoDB Atlas → Network Access
   اضغط "Add IP Address"
   - اختر "Allow access from anywhere" (0.0.0.0/0)
   - هذا ضروري لـ Render

3. تحقق من username/password:
   في الـ URL:
   mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@...
   
   تأكد من تشفير الأحرف الخاصة:
   @ → %40
   # → %23
   و غيرها

4. استخدم mongodb.com/data-platform/atlas للتحديث إذا نسيت الـ password
```

---

### 🔴 Error 8: "Webhook Not Working - Shopify Integration Failed"

**الأعراض:**
```
Shopify orders لا تصل إلى Backend
في API Logs: لا توجد requests من Shopify
```

**الحل:**
```
1. تأكد من SHOPIFY_WEBHOOK_SECRET صحيح:
   Render → Environment Variables
   SHOPIFY_WEBHOOK_SECRET = [exact value from Shopify]

2. تحقق من Webhook URL:
   Shopify Admin → Settings → Webhooks
   اختر الـ webhook
   تأكد URL = https://ali-baba-api.onrender.com/api/shopify/webhooks

3. اختبر الـ webhook:
   في Shopify: اضغط "Send test event"
   غالباً يرسل test payload

4. شوف Logs في Render:
   Render Service → Logs
   ابحث عن POST requests لـ /api/shopify/webhooks
   
5. إذا لا توجد requests:
   - تأكد من URL صحيح في Shopify
   - تأكد من Render service يعمل (بأخضر)
   - جرّب "Send test event" مجدداً

6. إذا توجد requests لكن فشل (error):
   - اطلع على الـ error message في Logs
   - غالباً: SHOPIFY_WEBHOOK_SECRET غير صحيح
   - أو: الكود بيرفع Exception
```

---

### 🔴 Error 9: "Timeout - Service is Slow"

**الأعراض:**
```
API response takes > 10 seconds
أو timeout completely
```

**الحل:**
```
1. إذا كنت على Render Free tier:
   - Free services توقف بعد 15 دقيقة من عدم الاستخدام
   - عند أول request، يستغرق 20-30 ثانية (cold start)
   - هذا طبيعي لـ Free tier
   - الحل: ارقّ إلى Starter ($7/month)

2. إذا كنت على Paid:
   - قد تكون المشكلة في Database
   - شوف MongoDB performance:
     Atlas → Performance Advisor
   - أضف indexes للـ slow queries

3. اختبر محلياً:
   npm start
   جرّب الـ endpoints
   إذا سريع محلياً: المشكلة في deployment
   إذا بطيء محلياً: المشكلة في الكود
```

---

### 🔴 Error 10: "Environment Variables Not Working"

**الأعراض:**
```
process.env.VARIABLE_NAME يرجع "undefined"
حتى لو أضفت المتغير
```

**الحل:**
```
1. تأكد من إضافة المتغير بشكل صحيح:
   Render → Service → Settings → Environment
   تأكد من Key و Value صحيح (بدون spaces إضافية)

2. اعد بناء Service:
   في Render: "Manual Deploy" أو اضغط "Deploy" مجدداً
   (تغيير المتغيرات يحتاج rebuild)

3. في الكود، استخدم القيمة الافتراضية:
   const port = process.env.PORT || 5000;

4. اطبع المتغيرات للتحقق:
   في server/index.js:
   console.log('PORT:', process.env.PORT);
   console.log('NODE_ENV:', process.env.NODE_ENV);
   
   اطلع على Logs في Render
   يجب يظهر القيم

5. إذا يظهر "undefined":
   تأكد من إعادة البناء تمت بعد إضافة المتغيرات
```

---

## 🏥 عملية التشخيص الكاملة

إذا واجهت مشكلة لا تعرف حلها:

### الخطوة 1: تحديد الجزء المصاب
```
✅ البيئة: Backend / ERP Frontend / Storefront?
✅ المرحلة: الفترة / Build / Runtime؟
✅ رسالة الخطأ: متى بالضبط تظهر؟
```

### الخطوة 2: فحص الـ Logs
```
Render:
  Dashboard → Select Service → Logs
  ابحث عن أحمر (errors) أو أصفر (warnings)

Vercel:
  Dashboard → Select Project → Deployments
  اختر أحدث deployment
  اضغط "Logs"
  شوف Build Log و Function Logs
```

### الخطوة 3: اختبر محلياً أولاً
```
npm install
npm run dev  (أو npm start)
جرّب الفيتشر محلياً
هل يعمل؟
  - نعم: المشكلة في deployment config
  - لا: المشكلة في الكود

For Frontend:
cd client-erp
npm run build  (اختبر البناء محلياً)
npm run dev    (اختبر التشغيل)
```

### الخطوة 4: تحقق من المتغيرات
```
Render:
  Settings → Environment Variables
  تأكد من كل المتغيرات موجودة و صحيحة

Vercel:
  Settings → Environment Variables
  تأكد من VITE_API_URL مشير للـ Render URL الصحيح
```

### الخطوة 5: أعد البناء
```
Render: Manual Deploy
Vercel: Push نقطة جديدة أو "Redeploy" من UI

انتظر 2-5 دقائق و اختبر مجدداً
```

---

## 🔗 Check Lists سريعة

### ✅ قبل نشر Backend (Render)

- [ ] Root Directory = "server"
- [ ] Build Command = "npm install"  
- [ ] Start Command = "npm start"
- [ ] PORT = 5000 (environment)
- [ ] NODE_ENV = production (environment)
- [ ] MONGODB_URI موجود و صحيح
- [ ] JWT_SECRET موجود و قوي (32+ characters)
- [ ] SHOPIFY_WEBHOOK_SECRET موجود (إذا كنت تستخدم Shopify)
- [ ] CORS_ORIGIN مشير للـ URLs الصحيحة
- [ ] npm start يعمل محلياً

### ✅ قبل نشر Frontend (Vercel - ERP)

- [ ] Root Directory = "client-erp"
- [ ] Framework = Vite
- [ ] Build Command = "npm run build"
- [ ] VITE_API_URL = correct Render URL (no trailing slash)
- [ ] npm run build ينجح محلياً
- [ ] vercel.json موجود في client-erp
- [ ] لا توجد errors في Browser Console

### ✅ قبل نشر Frontend (Vercel - Storefront)

- [ ] Root Directory = "client-storefront"
- [ ] Framework = Vite
- [ ] Build Command = "npm run build"
- [ ] VITE_API_URL = correct Render URL
- [ ] npm run build ينجح محلياً
- [ ] vercel.json موجود في client-storefront

---

## 📞 الموارد الإضافية

| المشكلة | موقع المساعدة |
|--------|---------------|
| Render Issues | https://render.com/docs/troubleshooting |
| Vercel Issues | https://vercel.com/docs |
| MongoDB Issues | https://docs.mongodb.com/atlas/guide/ |
| CORS Issues | https://enable-cors.org/ |
| Node.js Issues | https://nodejs.org/docs/ |

---

**آخر تحديث:** 12 أبريل 2026
**الحالة:** جاهز للاستخدام ✅
