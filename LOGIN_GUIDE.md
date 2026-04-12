# 🔐 دليل تسجيل الدخول - Login Guide

## **إنشاء حسابات اختبار**

### **الخطوة 1️⃣: تشغيل سكريبت إنشاء المستخدمين**

في جهازك المحلي:

```bash
cd server
node create-test-users.js
```

### **الناتج:**
```
✅ Admin created
✅ Merchant created
🎉 Test users created successfully!
```

---

## **🔑 بيانات تسجيل الدخول للاختبار**

### **1. حساب Admin (مدير النظام)**

| الحقل | القيمة |
|------|--------|
| **الإيميل** | `admin@test.com` |
| **كلمة المرور** | `password123` |
| **رابط الاستخدام** | `https://erp.example.com/admin/login` |
| **الدور** | Admin (صلاحيات كاملة) |

#### **الصلاحيات:**
- ✅ لوحة التحكم الرئيسية
- ✅ إدارة الطلبيات
- ✅ إدارة الفئات والمنتجات
- ✅ إدارة التجار
- ✅ الإعدادات الديناميكية (USD rates, fees)
- ✅ تتبع الطلبيات والتسليم

---

### **2. حساب Merchant (التاجر)**

| الحقل | القيمة |
|------|--------|
| **الإيميل** | `merchant@test.com` |
| **كلمة المرور** | `password123` |
| **رابط الاستخدام** | `https://erp.example.com/merchant/login` |
| **الدور** | Merchant (صلاحيات محدودة) |

#### **الصلاحيات:**
- ✅ عرض الطلبيات الخاصة به
- ✅ إدارة المحفظة والرصيد
- ✅ عرض الفواتير
- ✅ تحديث بيانات الملف الشخصي

---

### **3. متجر المنتجات (Storefront)**

| الحقل | القيمة |
|------|--------|
| **رابط الاستخدام** | `https://storefront.example.com` |
| **التسجيل** | اختياري (تصفح مجاني) |

#### **الميزات:**
- ✅ تصفح المنتجات والفئات
- ✅ إضافة إلى السلة
- ✅ إكمال الشراء
- ⏳ سجل الطلبيات (قريباً)

---

## **📍 روابط تسجيل الدخول الكاملة**

### **Development (محليًا):**
```
Admin:     http://localhost:5173/admin/login
Merchant:  http://localhost:5173/merchant/login
Storefront: http://localhost:5174 (أو قثيرة منفصلة)
```

### **Production (على الإنترنت):**
```
Admin:     https://erp.yourdomain.com/admin/login
Merchant:  https://erp.yourdomain.com/merchant/login
Storefront: https://storefront.yourdomain.com
```

---

## **🔄 خطوات تسجيل الدخول خطوة بخطوة**

### **Admin Login:**
1. اذهب إلى: `https://erp.example.com/admin/login`
2. أدخل البريد: `admin@test.com`
3. أدخل كلمة المرور: `password123`
4. اضغط **تسجيل الدخول** / **Login**
5. ستذهب إلى: `/admin` (لوحة التحكم)

### **Merchant Login:**
1. اذهب إلى: `https://erp.example.com/merchant/login`
2. أدخل البريد: `merchant@test.com`
3. أدخل كلمة المرور: `password123`
4. اضغط **تسجيل الدخول** / **Login**
5. ستذهب إلى: `/merchant/dashboard` (لوحة التاجر)

---

## **⚙️ إنشاء حسابات إضافية (محليًا)**

### **عدّل سكريبت `create-test-users.js`:**

```javascript
// أضف هذا قبل process.exit
const newAdmin = new Admin({
  name: 'Your Admin Name',
  email: 'your-email@example.com',
  password: await bcryptjs.hash('your-password', 10),
  role: 'admin',
  isActive: true
});
await newAdmin.save();
```

ثم شغّل الـ script من جديد.

---

## **🛡️ نصائح الأمان**

### **لـ Production:**
- ❌ **لا تستخدم كلمات مرور ضعيفة** مثل `password123`
- ✅ استخدم كلمات مرور قوية (uppercase + lowercase + numbers + symbols)
- ✅ غيّر كلمات المرور بعد الاختبار الأول
- ✅ استخدم HTTPS دائماً

### **كيفية تغيير كلمة المرور:**
```
1. سجّل دخولك بـ حسابك
2. اذهب إلى الإعدادات (Settings)
3. اضغط على "تغيير كلمة المرور"
4. أدخل الكلمة الجديدة
5. اضغط Save
```

---

## **❓ مشاكل شائعة وحلولها**

### ❌ تظهر رسالة "خادم غير متاح"
- **السبب:** Backend (Render) لم يبدأ بعد
- **الحل:** انتظر 2-3 دقائق أو تحقق من Render status

### ❌ رسالة "بيانات غير صحيحة"
- **السبب:** الإيميل أو كلمة المرور خاطئة
- **الحل:** تأكد من كتابة:
  - `admin@test.com` (وليس `admin@example.com`)
  - `password123` (وليس شيء آخر)

### ❌ "حساب غير مفعّل"
- **السبب:** الحساب معطّل في قاعدة البيانات
- **الحل:** شغّل السكريبت من جديد

### ❌ لا أرى لوحة التحكم بعد الدخول
- **السبب:** قد تكون الـ UI لم تحمّل بشكل صحيح
- **الحل:** 
  - اضغط F5 (refresh)
  - امسح الـ browser cache
  - جرب في متصفح مختلف

---

## **📊 جدول سريع للبيانات**

| نوع الحساب | الإيميل | الكلمة | الرابط |
|-----------|--------|--------|--------|
| Admin | admin@test.com | password123 | /admin/login |
| Merchant | merchant@test.com | password123 | /merchant/login |
| Customer | أي إيميل | أي كلمة | (اختياري) |

---

## **📖 قراءة إضافية:**

- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - تفاصيل النشر
- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - إعدادات البيئة
- [API_ENDPOINTS_REQUIREMENTS.md](./API_ENDPOINTS_REQUIREMENTS.md) - واجهات البرنامج

---

**آخر تحديث:** 12 أبريل 2026  
**الحالة:** ✅ جاهز للاختبار والإنتاج
