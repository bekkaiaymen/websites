# 🚀 Vercel Deployment Configuration - Frontend Guide

## الدليل الكامل لنشر الـ Frontend على Vercel

---

## **⚠️ الخطأ الحالي:**

```
Deployment failed with error
> delivery-erp@0.0.0 build
> vite build
```

**السبب:** Vercel يبحث في الدليل الخاطئ (root بدل client-erp)

---

## **✅ الحل الكامل:**

### **خطوة 1️⃣: إنشاء مشروع Vercel للـ ERP Frontend**

1. اذهب إلى **[Vercel Dashboard](https://vercel.com/dashboard)**
2. اضغط **+ Add New** → **Project**
3. اختر Repository: **bekkaiaymen/websites**
4. اضغط **Import**

### **خطوة 2️⃣: تعيين Root Directory للـ ERP**

في صفحة Project Settings:

```
Framework Preset: Other
Root Directory: client-erp/  ← أهم خطوة!
Build Command: npm run build
Output Directory: dist
```

**✨ تحقق من أن:**
- ✅ Framework = "Other" (Vite will be auto-detected, لكن ندقق)
- ✅ Root Directory = `client-erp/`
- ✅ Build Command = `npm run build`
- ✅ Output Directory = `dist`

### **خطوة 3️⃣: إضافة Environment Variables (للـ ERP)**

في **Settings** → **Environment Variables**، أضف:

```
VITE_API_URL = https://YOUR-RENDER-URL.onrender.com/api
```

**مثال:**
```
VITE_API_URL = https://ali-baba-api.onrender.com/api
```

### **خطوة 4️⃣: Deploy!**

اضغط **Deploy** → انتظر الـ build

---

## **📋 إنشاء مشروع Vercel الثاني - Storefront**

كرر نفس الخطوات **لكن مع:**

```
Root Directory: client-storefront/  ← مختلف!
VITE_API_URL = https://YOUR-RENDER-URL.onrender.com/api
```

---

## **🔧 حل بديل: استخدام Monorepo Configuration**

إذا أردت مشروع واحد على Vercel يتحكم بـ كلا الـ Frontend:

### **1. في Root Repository Settings:**

```
Enable Monorepo: ON
```

### **2. أنشئ `vercel.json` قي Root:**

```json
{
  "projects": [
    {
      "name": "erp-frontend",
      "root": "client-erp",
      "builds": [
        { "src": "package.json", "use": "@vercel/node" }
      ]
    },
    {
      "name": "storefront-frontend", 
      "root": "client-storefront",
      "builds": [
        { "src": "package.json", "use": "@vercel/node" }
      ]
    }
  ]
}
```

---

## **📊 الشكل الموصى به (Recommended):**

| المشروع | Platform | Root Dir | URL |
|--------|----------|----------|-----|
| **Backend API** | Render | `server/` | `api.example.com` |
| **ERP Frontend** | Vercel | `client-erp/` | `erp.example.com` |
| **Storefront Frontend** | Vercel | `client-storefront/` | `storefront.example.com` |

---

## **🚨 تصحيح الـ Build الحالي:**

إذا كان المشروع الحالي auf Vercel فاشل:

### **الخيار A: تعديل الإعدادات الموجودة ⭐ (الأسهل)**

1. اذهب إلى **Project Settings**
2. ابحث عن **"Root Directory"**
3. غيّرها من `.` إلى `client-erp/`
4. اضغط **Save**
5. اضغط **Redeploy** → سيعمل! ✅

### **الخيار B: حذف وإعادة إنشاء (ضروري إذا كانت الإعدادات معقدة)**

1. اذهب إلى **Settings** → **Domains**
2. اذهب إلى **Settings** → **Danger Zone** → **Delete Project**
3. أنشئ مشروع جديد من الـ GitHub Repository
4. لا تنسى تعيين **Root Directory = `client-erp/`** من البداية!

---

## **💡 نصيحة مهمة:**

تأكد من أن كل مشروع Vercel:
- ✅ له عنوان URL خاص به
- ✅ تم توظيف Root Directory الصحيح
- ✅ له environment variables (VITE_API_URL)
- ✅ يستخدم الـ branch الصحيح (main)

---

## **🎯 الخطوات السريعة:**

```bash
# محليًا - تأكد من أن كل شيء يعمل:
cd client-erp && npm run build  # يجب أن ينتج dist/
cd ../client-storefront && npm run build  # يجب أن ينتج dist/
```

إذا كانت كلا الأوامر تعمل محليًا، ستعمل على Vercel أيضًا! ✅

---

## **❌ المشاكل الشائعة:**

### ❌ "npm ERR! code ENOENT"
**السبب:** Root Directory خاطئ
**الحل:** غيّره إلى `client-erp/` في الإعدادات

### ❌ "command not found: vite"
**السبب:** Dependencies لم تُثبت
**الحل:** تأكد من وجود `package-lock.json` في client-erp/

### ❌ "Cannot find module"
**السبب:** اسم Package.json مشروط
**الحل:** تحقق من `name` في `client-erp/package.json`

---

## **✨ بعد النشر:**

1. **اختبر الـ URL:**
   ```
   https://erp.example.com
   ```

2. **تحقق من Console:**
   ```javascript
   // في browser console
   console.log(import.meta.env.VITE_API_URL)
   // يجب أن يعرض: https://api.example.com
   ```

3. **اختبر API Call:**
   ```javascript
   fetch(`${import.meta.env.VITE_API_URL}/categories`)
     .then(r => r.json())
     .then(d => console.log(d))
   ```

---

**Last Updated:** 12 أبريل 2026  
**Status:** ✅ Ready for Vercel Deployment
