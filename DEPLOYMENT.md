# Deployment Guide

This project is deployed on two platforms:
- **Frontend**: Vercel (React/Vite)
- **Backend**: Render (Express.js/Node.js)

## Prerequisites

1. **GitHub Repository**: https://github.com/bekkaiaymen/websites
2. **MongoDB Atlas**: Database connection string
3. **Vercel Account**: https://vercel.com
4. **Render Account**: https://render.com

---

## 1. Vercel Deployment (Frontend)

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Choose your GitHub repository: `bekkaiaymen/websites`
5. Click "Import"

### Step 2: Configure Project Settings

1. **Project Name**: `ali-baba-client` (or any name)
2. **Root Directory**: `client`
3. **Framework Preset**: `Vite`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
VITE_API_URL=https://ali-baba-api.onrender.com
```

(Replace with your Render backend URL after deployment)

### Step 4: Deploy

Click "Deploy" → Vercel will automatically build and deploy your frontend.

**Frontend URL**: `https://your-frontend-url.vercel.app`

---

## 2. Render Deployment (Backend)

### Step 1: Create a Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New+" → "Web Service"
3. Connect your GitHub repository: `bekkaiaymen/websites`
4. Click "Connect"

### Step 2: Configure Service

- **Name**: `ali-baba-api`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Runtime**: `Node`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Set Environment Variables

In Render Dashboard → Environment, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key-change-this
PORT=5000
```

Get `MONGODB_URI` from MongoDB Atlas:
1. Go to MongoDB Atlas Dashboard
2. Click "Connect"
3. Choose "Drivers"
4. Copy connection string
5. Replace `<password>` and `<database>` with your credentials

### Step 4: Deploy

Click "Create Web Service" → Render will automatically build and deploy.

**Backend URL**: `https://ali-baba-api.onrender.com`

---

## 3. Update Frontend with Backend URL

After Render deployment, update Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings
2. Find Environment Variables
3. Update `VITE_API_URL` with your Render backend URL
4. Redeploy or the changes will apply on next push

---

## 4. Database & Authentication Setup

### Create Admin User

After both services are deployed, connect to MongoDB Atlas and create an admin user:

```javascript
db.admins.insertOne({
  username: "admin",
  password: "password123",  // Should be hashed in production
  email: "admin@example.com",
  role: "admin",
  active: true,
  createdAt: new Date()
})
```

**Note**: Implement proper password hashing in production!

---

## 5. Testing Deployment

### Test Frontend
```
https://your-frontend-url.vercel.app
```

### Test Backend Health Check
```
https://ali-baba-api.onrender.com
```

Should return: `Ali Baba Chocolate API is running 🍫`

### Test Admin Login
```
https://your-frontend-url.vercel.app/admin/login
```

Username: `admin`
Password: `password123`

---

## 6. Troubleshooting

### Frontend: API Connection Error
- ✅ Check `VITE_API_URL` environment variable in Vercel
- ✅ Ensure backend is running on Render
- ✅ Check CORS settings in `server/index.js`

### Backend: Database Connection Error
- ✅ Verify `MONGODB_URI` in Render environment variables
- ✅ Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- ✅ Ensure database exists in MongoDB Atlas

### 500 Errors
- ✅ Check Render logs: Dashboard → Your Service → Logs
- ✅ Check Vercel logs: Dashboard → Your Project → Logs
- ✅ Verify all environment variables are set

---

## 7. Auto-Deployment

Both Vercel and Render automatically redeploy when you:
1. Push to `main` branch on GitHub
2. Changes are automatically detected
3. Build and deployment happen automatically

---

## 8. Production Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render
- [ ] Environment variables set on both platforms
- [ ] Database user created
- [ ] Admin user created in MongoDB
- [ ] CORS properly configured
- [ ] JWT_SECRET changed to a strong secret
- [ ] Password hashing implemented for admin users
- [ ] Email notifications configured (optional)
- [ ] Monitoring/error tracking set up (optional)

---

## Environment Variables Reference

### Frontend (.env / Vercel)
```
VITE_API_URL=https://ali-baba-api.onrender.com
```

### Backend (.env / Render)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-production-secret-key
PORT=5000
```

---

## Support

For issues:
1. Check deployment logs on both platforms
2. Verify environment variables
3. Test API endpoints locally first
4. Check MongoDB Atlas connection settings
