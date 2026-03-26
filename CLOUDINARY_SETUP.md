# Cloudinary Setup Guide for Ali Baba Gifts & Chocolate

## Environment Variables Setup

Add these environment variables to your `.env` file (in the `client/` folder) and Vercel project settings:

```env
# Cloudinary Credentials (from your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=dhixv7vvh
CLOUDINARY_API_KEY=962612658717368
CLOUDINARY_API_SECRET=aLlhQbA68BBLdfv8LXZqQEJzzlk
```

## Where to Configure These in Vercel

1. Go to your Vercel Project Dashboard: https://vercel.com/dashboard
2. Select your project: "websites"
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - Key: `CLOUDINARY_CLOUD_NAME` → Value: `dhixv7vvh`
   - Key: `CLOUDINARY_API_KEY` → Value: `962612658717368`
   - Key: `CLOUDINARY_API_SECRET` → Value: `aLlhQbA68BBLdfv8LXZqQEJzzlk`
5. Click **Save**
6. Redeploy your project for changes to take effect

## Local Development Setup

1. Create a `.env.local` file in the `client/` folder with your Cloudinary credentials
2. The development server will automatically read these variables

## Architecture

### Backend Changes
- **Upload Middleware**: `client/api/middleware/upload.js`
  - Handles file upload validation
  - Size limit: 50MB
  - Allowed formats: JPG, PNG, GIF, WebP
  - Automatically optimizes images to 1000x1000px

- **Cloudinary Config**: `client/api/config/cloudinary.js`
  - Configures Cloudinary with API credentials

- **Updated Routes**:
  - `POST /api/categories` - Upload category image
  - `PUT /api/categories/:id` - Update category with new image
  - `POST /api/products` - Upload product image
  - `PUT /api/products/:id` - Update product with new image

### Frontend Changes
- **AdminProducts.jsx**: File input with preview and FormData submission
- **AdminCategories.jsx**: File input with preview and FormData submission
- Both components show "جاري رفع الصورة والحفظ..." loading state during upload

## How It Works

### User Uploads Image via Admin Panel

1. Admin clicks "رفع صورة" (Upload Image) in AdminProducts or AdminCategories
2. Multer middleware validates the file:
   - Checks file type and size
   - Rejects if not image or >50MB
3. Multer-Storage-Cloudinary:
   - Sends image to Cloudinary server
   - Automatically optimizes (max 1000x1000px)
   - Returns secure_url to backend
4. Backend saves Cloudinary URL to MongoDB:
   ```javascript
   // Example: Cloudinary URL stored in database
   image: "https://res.cloudinary.com/dhixv7vvh/image/upload/v1234567890/alibaba-gifts-chocolate/product_abc123.jpg"
   ```
5. Frontend displays product/category with Cloudinary image

### Benefits of Cloudinary

✅ **Serverless Compatible**: Images hosted on CDN, not local storage
✅ **Auto-Optimization**: Images automatically resized and compressed
✅ **Global CDN**: Fast delivery worldwide
✅ **Secure URLs**: HTTPS by default
✅ **Version Control**: All images versioned and tracked
✅ **Transformations**: Easy image manipulation if needed in future

## Testing the Upload

### Local Testing
1. Go to http://localhost:5173/admin
2. Click "إضافة منتج" (Add Product)
3. Fill in product details
4. Click file input and select an image from your computer
5. You should see a preview
6. Click "حفظ المنتج" (Save Product)
7. Watch the loading spinner: "جاري رفع الصورة والحفظ..."
8. After upload, product should appear in the list with Cloudinary image

### Vercel Production
1. Push changes to GitHub
2. Vercel automatically deploys
3. Go to https://websites-henna-beta.vercel.app/admin
4. Test the same flow above
5. Images will be uploaded to your Cloudinary account

## Troubleshooting

### "ERESOLVE unable to resolve dependency tree"
If you see this, it was already fixed with `--legacy-peer-deps` flag during installation.

### Images Not Uploading
1. Check Cloudinary credentials in Vercel environment variables
2. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set
3. Check browser console for error messages
4. Ensure file is less than 50MB
5. Ensure file is JPG, PNG, GIF, or WebP format

### Images Showing Broken Links
1. Verify Cloudinary URLs in MongoDB
2. Check if Cloudinary API credentials are correct
3. Ensure images are publicly accessible in Cloudinary dashboard

## Cloudinary Dashboard

Access your Cloudinary account at: https://cloudinary.com/console/c/b9e5f45cbb42e01e07c4614d9c5ef79f/dashboard

All uploaded images go to folder: `alibaba-gifts-chocolate/`

## Security Notes

⚠️ **DO NOT commit `.env` file to GitHub**
⚠️ **API Secret should only be used server-side in backend**
⚠️ **Frontend only has access to Cloud Name and API Key (limited permissions)**

## API Routes with Image Upload

### Upload Product Image
```bash
POST /api/products
Content-Type: multipart/form-data

name: "Product EN"
nameAr: "اسم المنتج"
category: "63f7d8c2e4b0f4c12345678"
price: 2500
description: "English Description"
descriptionAr: "الوصف العربي"
stock: 100
isLocal: false
isNational: true
premium: true
image: <FILE>
```

### Upload Category Image
```bash
POST /api/categories
Content-Type: multipart/form-data

name: "Category EN"
nameAr: "اسم الفئة"
icon: "🎁"
description: "Category description"
color: "#D4AF37"
image: <FILE>
```

### Update with New Image
```bash
PUT /api/products/:id
Content-Type: multipart/form-data

[same fields as POST]
image: <FILE>  [only include if uploading new image]
```

---

Questions? Check the browser developer console (F12) for detailed error messages.
