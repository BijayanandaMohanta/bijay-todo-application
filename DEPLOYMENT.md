# Deployment Guide

## Quick Start

### Login Credentials
- User ID: `bijay`
- Password: `7606938822`

## Backend Deployment (Step 1)

The backend API must be deployed first before deploying the frontend.

### Option 1: Vercel Serverless (Recommended)

1. Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    }
  ]
}
```

2. Deploy backend:
```bash
vercel --prod
```

3. Note the backend URL (e.g., https://your-app.vercel.app)

### Option 2: Render.com (Free Tier)

1. Push code to GitHub
2. Go to https://render.com
3. Create new "Web Service"
4. Connect GitHub repository
5. Settings:
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Environment: Node
6. Deploy and note the URL

### Option 3: Railway.app

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select repository
4. Railway auto-detects Node.js
5. Add start command: `npm run server`
6. Deploy and copy the URL

## Frontend Deployment (Step 2)

### Update API Endpoint

Edit `src/utils/todoService.js` line 3:
```javascript
const API_BASE = 'https://your-backend-url.com/api'; // Replace with your backend URL
```

### Deploy to Vercel

1. Push updated code to GitHub

2. Go to https://vercel.com

3. "New Project" → Import from GitHub

4. Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Click "Deploy"

6. Your app will be live at: `https://your-app.vercel.app`

## MongoDB Setup

1. Go to https://cloud.mongodb.com

2. Create free cluster (M0)

3. Database Access:
   - Create user (testinguser/userpass123 or your own)
   - Save credentials

4. Network Access:
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add your deployment platform IPs

5. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

6. Update `server/index.js` line 14:
```javascript
const uri = "your_mongodb_connection_string";
```

## Environment Variables

If using environment variables instead of hardcoding:

### Backend (.env or deployment platform)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=voicetodoapp
PORT=5000
```

### Frontend (Vercel environment variables)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Testing Deployment

1. Visit your frontend URL
2. Login with: bijay / 7606938822
3. Create a test todo
4. Verify it saves to MongoDB
5. Refresh page - todo should persist

## Troubleshooting

### Frontend can't connect to backend
- Check CORS is enabled in `server/index.js`
- Verify API_BASE URL in `todoService.js`
- Check browser console for errors

### MongoDB connection fails
- Verify connection string is correct
- Check Network Access whitelist
- Confirm database user credentials

### Build fails on Vercel
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs for specific errors

## Security Notes

⚠️ **For Personal Use Only**

Current security implementation:
- Static credentials (not for production)
- Hardcoded MongoDB URI (consider environment variables)
- No JWT tokens (uses localStorage)
- No rate limiting on backend

For production apps, implement:
- Proper authentication (JWT, OAuth)
- Environment variables for secrets
- Rate limiting middleware
- HTTPS only
- Input validation
- Password hashing

## Cost

All services offer free tiers:
- MongoDB Atlas: 512MB free forever
- Vercel: Unlimited hobby projects
- Render: 750 hours/month free
- Railway: $5 free credit/month

## Support

For issues:
1. Check browser console logs
2. Check backend server logs
3. Verify MongoDB connection
4. Check API endpoint URLs
