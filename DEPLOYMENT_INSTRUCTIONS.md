# 🚂 Railway Deployment Instructions

## 🎯 **Current Issue**
Production frontend is trying to call `localhost:3001` but needs to call the Railway backend URL.

```
❌ https://keen-appreciation-production-09eb.up.railway.app → http://localhost:3001
✅ https://keen-appreciation-production-09eb.up.railway.app → https://your-backend.up.railway.app
```

## 🔧 **Solution Steps**

### **Step 1: Deploy Backend to Railway**

1. **Open Railway Dashboard**: Go to [railway.app](https://railway.app)
2. **Navigate to Your Project**: Find project `1a194d99-df0a-4155-bc55-7253a85d0834`
3. **Add Backend Service**:
   - Click "New Service" or "Deploy"
   - Select "GitHub Repository"
   - Choose your repository
   - Set **Root Directory**: `/backend`
   - Railway will detect the `railway.toml` configuration

4. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=[your Railway PostgreSQL URL]
   JWT_SECRET=[your JWT secret]
   CORS_ORIGIN=https://keen-appreciation-production-09eb.up.railway.app
   ```

### **Step 2: Get Backend URL**
After deployment, Railway will provide a URL like:
```
https://backend-production-xyz.up.railway.app
```

### **Step 3: Update Frontend Environment**

1. **In Railway Dashboard**, go to your **Frontend Service**
2. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://[your-backend-url].up.railway.app
   ```
   
3. **Trigger Frontend Redeploy** to pick up the new environment variable

### **Step 4: Verify Deployment**

Test these endpoints:
- ✅ Backend Health: `https://your-backend.up.railway.app/health`
- ✅ Frontend Settings: `https://your-frontend.up.railway.app/dashboard/settings`

## 🔍 **Troubleshooting**

### **Backend Deployment Issues**
- Check Railway build logs
- Ensure `package.json` has correct start script
- Verify database connection string

### **Frontend Still Shows 401 Errors**
- Confirm `NEXT_PUBLIC_API_URL` is set correctly
- Redeploy frontend after adding environment variable
- Check browser network tab for correct API calls

### **CORS Errors**
Update backend `.env` or Railway environment:
```
CORS_ORIGIN=https://your-frontend.up.railway.app
```

## ✅ **Success Indicators**

- ✅ Backend deploys successfully to Railway
- ✅ Frontend can reach backend API endpoints
- ✅ Settings page loads without 401 errors
- ✅ Authentication flow works end-to-end
- ✅ No more `localhost:3001` calls in production

## 🎯 **Expected URLs After Deployment**

- **Frontend**: `https://keen-appreciation-production-09eb.up.railway.app`
- **Backend**: `https://[your-backend-name]-production.up.railway.app`
- **Database**: Railway PostgreSQL (internal connection)

## 📝 **Files Modified**

- ✅ `.env.production` template created
- ✅ Backend API validation fixes applied  
- ✅ Settings functionality fully implemented
- ✅ Batch creation page added

Once you complete the Railway backend deployment, all API calls will work correctly in production.