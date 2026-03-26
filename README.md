# 🎁 علي بابا للهدايا والشوكولاتة - Ali Baba Gifts & Chocolate

متجر إلكتروني احترافي متخصص في الهدايا الفاخرة والشوكولاتة البلجيكية والعطور والمنتجات التقليدية الجزائرية.

## ✨ المميزات الرئيسية

- 🎁 **متجر الهدايا الفاخرة** - أرقى الهدايا والمنتجات في غرداية
- 🍫 **الشوكولاتة الفاخرة** - شوكولاتة بلجيكية أصلية وعطور فاخرة
- 📦 **بناء صندوق مخصص** - دع العميل يختار منتجاته ويحدد الميزانية
- ☁️ **رفع الصور مباشرة** - إدارة الصور من خلال Cloudinary CDN
- 🔐 **لوحة تحكم إدارية** - إدارة كاملة للمنتجات والفئات والطلبات
- 📱 **واجهة احترافية** - تصميم حديث وسهل الاستخدام
- 🚀 **استضافة على Vercel** - سريع وموثوق مع CDN عالمي

## 🛠️ التكنولوجيا المستخدمة

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Express.js (Serverless على Vercel)
- **Database**: MongoDB Atlas
- **Image Hosting**: Cloudinary
- **Deployment**: Vercel

## 📋 البدء السريع

### 1. المتطلبات الأساسية

```bash
# Node.js 16+ و npm مثبتة على جهازك
node --version
npm --version
```

### 2. التثبيت المحلي

```bash
# الدخول إلى مجلد المشروع
cd e:\delivery\client

# تثبيت المكتبات
npm install

# تشغيل الخادم الوالتطوير
npm run dev
```

ثم افتح: `http://localhost:5173`

### 3. متغيرات البيئة (Environment Variables)

انسخ هذا إلى ملف `.env.local` في مجلد `client/`:

```env
# MongoDB
MONGO_URI=mongodb+srv://[user]:[password]@cluster.mongodb.net/alibaba_db

# Cloudinary (من dashboard الخاص بك)
CLOUDINARY_CLOUD_NAME=dhixv7vvh
CLOUDINARY_API_KEY=962612658717368
CLOUDINARY_API_SECRET=aLlhQbA68BBLdfv8LXZqQEJzzlk

# API URL (اترك فارغاً في الإنتاج لاستخدام relative URLs)
VITE_API_URL=
```

## 🌐 الرفع على Vercel

### الخطوة 1: تجهيز GitHub
```bash
git add .
git commit -m "New features: Cloudinary integration, gift branding"
git push origin main
```

### الخطوة 2: ربط Vercel
1. اذهب إلى https://vercel.com
2. اختر مشروعك
3. ادخل متغيرات البيئة في Settings → Environment Variables
4. Vercel سيعيد النشر تلقائياً

## 📂 هيكل المشروع

```
client/
├── api/
│   ├── config/cloudinary.js       # إعدادات Cloudinary
│   ├── middleware/upload.js       # Multer middleware
│   ├── models/                    # MongoDB schemas
│   │   ├── Category.js
│   │   ├── Product.js
│   │   └── Order.js
│   └── index.js                   # Express API routes
├── src/
│   ├── components/
│   │   ├── Hero.jsx              # الصفحة الرئيسية الجديدة
│   │   ├── AdvancedCustomBoxBuilder.jsx  # بناء صندوق مخصص
│   │   ├── CategoryCircles.jsx   # فلتر الفئات
│   │   ├── AdminProducts.jsx      # إدارة المنتجات
│   │   └── AdminCategories.jsx    # إدارة الفئات
│   └── pages/
│       ├── Home.jsx               # الصفحة الرئيسية
│       └── Admin.jsx              # لوحة التحكم
└── package.json

server/                            # (خادم قديم - اختياري)
```

## 🔑 أهم الميزات الجديدة

### 1. رفع الصور مباشرة ☁️
- الآن يمكن رفع الصور من الهاتف أو الكمبيوتر مباشرة
- يتم حفظ الصور على Cloudinary (آمن وسريع)
- لا تقلق بشأن مساحة التخزين

### 2. بناء صندوق مخصص 🎁
- اختر ميزانيتك
- اختر المنتجات التي تريدها
- رؤية الإجمالي في الوقت الفعلي
- رسالة WhatsApp تلقائياً مع التفاصيل

### 3. لوحة تحكم متقدمة 🎯
- إدارة الفئات بالكامل (إضافة/تعديل/حذف)
- إدارة المنتجات بالتفاصيل
- عرض جميع الطلبات
- صور مباشرة من الكاميرا أو الملفات

## 📖 الدليل الكامل

### رفع صورة منتج جديد
1. اذهب إلى `/admin`
2. اختر تبويب "المنتجات"
3. انقر "إضافة منتج"
4. ملء البيانات
5. اختر صورة من جهازك
6. اضغط "حفظ المنتج"
7. انتظر رسالة "جاري رفع الصورة والحفظ..."
8. تم! تظهر الصورة من Cloudinary

### إضافة فئة جديدة
1. اذهب إلى `/admin`
2. اختر تبويب "الفئات"
3. انقر "إضافة فئة"
4. أدخل اسم (EN و Arabic)
5. اختر لون (ملون حسب رغبتك!)
6. رفع صورة الفئة
7. اضغط "حفظ الفئة"

## 📞 التواصل والدعم

**رقم الواتساب**: +213 664 021 599  
**الموقع**: https://websites-henna-beta.vercel.app  
**لوحة التحكم**: https://websites-henna-beta.vercel.app/admin

## 🔐 الأمان

- ✅ جميع البيانات مشفرة على MongoDB
- ✅ الصور خلال CDN آمن (Cloudinary)
- ✅ لا يتم حفظ معلومات الدفع (نستخدم WhatsApp للطلبات)
- ✅ Environment variables محمية على Vercel

## 📝 ملاحظات هامة

- صور المنتجات يجب أن لا تكون أكبر من 50MB
- الصيغ المقبولة: JPG, PNG, GIF, WebP
- الصور يتم تحسينها تلقائياً إلى 1000x1000px
- جميع الصور في مجلد: `alibaba-gifts-chocolate/` على Cloudinary

## 🎨 الألوان والعلامة التجارية

- 🟡 **Gold**: #D4AF37 (الون الرئيسي)
- 🟫 **Dark**: #0f0a08 (الخلفية)
- ⚫ **Cream**: #F5E6D3 (النصوص الفاتحة)

---

**تم آخر تحديث**: مارس 2026
**إصدار**: 2.0 (مع Cloudinary و Gift Branding)

- إنشاء طلبات متعددة
- تتبع حالة الطلبات

### للحرفيين والمتاجر:
- نفس المميزات + خيار تسجيل كـ "حرفي"

## 📱 تحييل إلى PWA 

يمكن للزبائن تحميله على الهاتف من المتصفح!

## 🚀 الرفع إلى الاستضافة

اتبع التعليمات على Render بربط مستودع GitHub الخاص بك.

---

**شكراً لاستخدام توصيل غرداية! 🚀📦**
