# 🚀 EcoSync Deployment Guide

Complete guide for deploying EcoSync to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
  - [Railway](#railway)
  - [Render](#render)
  - [Heroku](#heroku)
- [Frontend Deployment](#frontend-deployment)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
- [Domain & SSL](#domain--ssl)
- [Monitoring & Logs](#monitoring--logs)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before deploying, ensure you have:

- [x] Supabase project created
- [x] Database migrations completed
- [x] All environment variables documented
- [x] GitHub repository set up
- [x] Production API keys (OpenWeatherMap, etc.)
- [x] Domain name (optional but recommended)

---

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (`.env.production`)

```env
# Supabase (Production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-production-service-role-key

# Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=strong-random-secret-key-here-use-secrets.token-hex

# Server
PORT=8000
HOST=0.0.0.0

# CORS (Update with your frontend domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Sentry for error tracking
SENTRY_DSN=your-sentry-dsn
```

#### Frontend (`.env.production`)

```env
# Supabase (Production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# API (Update with your backend URL)
VITE_API_URL=https://api.yourdomain.com/api

# External APIs
VITE_OPENWEATHER_API_KEY=your-production-api-key

# Environment
VITE_ENV=production
```

> **Security Warning**: Never commit production `.env` files to Git!

---

## 🗄️ Database Setup

### 1. Supabase Production Configuration

1. **Enable Connection Pooling**
   - Go to Database → Connection Pooling
   - Enable pooling mode: Transaction
   - Note the pooler connection string

2. **Configure RLS Policies**
   ```sql
   -- Verify all RLS policies are enabled
   SELECT tablename, policyname, permissive
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Set up Backups**
   - Database → Backups → Enable Point-in-Time Recovery
   - Configure daily backups

4. **Create Indexes** (if not already done)
   ```sql
   -- GIN index for resolution photos
   CREATE INDEX IF NOT EXISTS idx_complaints_resolution_media_urls_gin
   ON complaints USING GIN (resolution_media_urls);
   
   -- B-tree indexes for frequent queries
   CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
   CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
   CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
   ```

5. **Storage Buckets**
   - Ensure `complaint-media` bucket is public
   - Configure CORS:
     ```json
     {
       "allowedOrigins": ["https://yourdomain.com"],
       "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "allowedHeaders": ["*"],
       "maxAgeSeconds": 3600
     }
     ```

---

## 🐍 Backend Deployment

### Option 1: Railway (Recommended)

**Pros**: Easy setup, automatic SSL, built-in monitoring

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login & Initialize**
   ```bash
   railway login
   cd backend
   railway init
   ```

3. **Add Environment Variables**
   ```bash
   railway variables set SUPABASE_URL=https://...
   railway variables set SUPABASE_KEY=...
   railway variables set FLASK_ENV=production
   railway variables set SECRET_KEY=...
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Configure Custom Domain** (optional)
   ```bash
   railway domain
   ```

**Railway Configuration** (`railway.toml`):
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "gunicorn -w 4 -b 0.0.0.0:$PORT app:app"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
```

### Option 2: Render

1. **Create Web Service**
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

2. **Add Environment Variables** in Render dashboard

3. **Deploy** (automatic on git push)

**render.yaml**:
```yaml
services:
  - type: web
    name: ecosync-backend
    env: python
    region: oregon
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
    healthCheckPath: /api/health
    envVars:
      - key: FLASK_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
```

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login & Create App**
   ```bash
   heroku login
   cd backend
   heroku create ecosync-api
   ```

3. **Add Buildpack**
   ```bash
   heroku buildpacks:set heroku/python
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL=https://...
   heroku config:set SUPABASE_KEY=...
   heroku config:set FLASK_ENV=production
   heroku config:set SECRET_KEY=...
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

**Procfile**:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

**runtime.txt**:
```
python-3.11.0
```

---

## ⚛️ Frontend Deployment

### Option 1: Vercel (Recommended)

**Pros**: Zero config, automatic SSL, global CDN, preview deployments

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure via Vercel Dashboard**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables** in Settings → Environment Variables

5. **Custom Domain** in Settings → Domains

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   cd frontend
   netlify deploy --prod
   ```

3. **Or Use GitHub Integration**
   - Connect repository in Netlify dashboard
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

4. **Add Environment Variables** in Site Settings → Build & Deploy → Environment

5. **Configure Redirects** (`frontend/public/_redirects`):
   ```
   /*    /index.html   200
   ```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🌐 Domain & SSL

### 1. Custom Domain Setup

**Vercel:**
```bash
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com
```

**Railway:**
```bash
railway domain yourdomain.com
```

### 2. DNS Configuration

Add these records to your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Vercel IP | 300 |
| CNAME | www | yourdomain.vercel.app | 300 |
| CNAME | api | ecosync-api.railway.app | 300 |

### 3. SSL Certificates

Both Vercel and Railway automatically provision SSL certificates via Let's Encrypt. No manual configuration needed!

### 4. Update CORS Origins

Update backend `.env`:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 📊 Monitoring & Logs

### Backend Monitoring

**Railway:**
```bash
# View logs
railway logs

# Monitor metrics
railway status
```

**Render:**
- Logs available in dashboard under Events tab
- Set up log drains for external monitoring

**Heroku:**
```bash
# View logs
heroku logs --tail

# Metrics
heroku ps:scale
```

### Frontend Monitoring

**Vercel:**
- Analytics in dashboard (free tier)
- Real-time logs for each deployment
- Web Vitals tracking

**Netlify:**
- Deploy logs in dashboard
- Analytics (paid)

### Error Tracking

**Sentry Integration:**

1. **Install Sentry**
   ```bash
   # Backend
   pip install sentry-sdk[flask]
   
   # Frontend
   npm install @sentry/react
   ```

2. **Backend Setup** (`backend/app/__init__.py`):
   ```python
   import sentry_sdk
   from sentry_sdk.integrations.flask import FlaskIntegration
   
   sentry_sdk.init(
       dsn=os.getenv("SENTRY_DSN"),
       integrations=[FlaskIntegration()],
       environment="production",
       traces_sample_rate=0.1
   )
   ```

3. **Frontend Setup** (`frontend/src/main.jsx`):
   ```javascript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: "production",
     tracesSampleRate: 0.1,
   });
   ```

---

## 📈 Scaling

### Backend Scaling

**Horizontal Scaling (Railway/Render):**
```bash
# Railway
railway scale --replicas 3

# Render
# Upgrade to Standard plan, increase instances in dashboard
```

**Vertical Scaling:**
- Upgrade plan for more CPU/RAM
- Railway: Settings → Plan
- Render: Settings → Instance Type

**Database Scaling:**
- Supabase: Upgrade to Pro plan for connection pooling
- Enable read replicas for read-heavy workloads

### Frontend Scaling

- Vercel/Netlify automatically scale via CDN
- No manual configuration needed
- 100+ edge locations worldwide

### Performance Optimizations

1. **Enable Compression**
   ```python
   # Backend (Flask)
   from flask_compress import Compress
   compress = Compress()
   compress.init_app(app)
   ```

2. **Cache Static Assets**
   ```nginx
   # Vercel does this automatically
   # For custom setups:
   location /assets {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

3. **Image Optimization**
   - Use Cloudinary for user uploads (future)
   - Implement lazy loading (already done)

---

## 🔥 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Error**: `Access-Control-Allow-Origin` blocked

**Fix:**
```python
# backend/app/__init__.py
CORS(app, origins=os.getenv("CORS_ORIGINS", "").split(","))
```

Verify `CORS_ORIGINS` in backend `.env`.

#### 2. Environment Variables Not Loading

**Error**: `Missing Supabase environment variables`

**Fix:**
- Verify variables are set in deployment platform
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

#### 3. Database Connection Timeout

**Error**: `Connection timeout to Supabase`

**Fix:**
- Use connection pooler URL in production
- Increase timeout in Supabase client:
  ```python
  supabase = create_client(url, key, options={
      "timeout": 10  # seconds
  })
  ```

#### 4. Build Failures

**Error**: `npm ERR! code ELIFECYCLE`

**Fix:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 5. 404 on Page Refresh (SPA)

**Error**: 404 when refreshing `/citizen/dashboard`

**Fix**: Add redirect rules (see [Frontend Deployment](#frontend-deployment))

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations completed
- [ ] RLS policies enabled and tested
- [ ] Storage buckets configured
- [ ] SSL certificates active
- [ ] Custom domain pointing correctly
- [ ] CORS origins updated
- [ ] Error tracking (Sentry) configured
- [ ] Logs accessible
- [ ] Health check endpoints responding
- [ ] Test all user flows (citizen, staff, admin)
- [ ] Performance monitoring active
- [ ] Backup strategy in place
- [ ] Team notified of deployment

---

## 📞 Support

If you encounter issues:
1. Check logs first
2. Search [GitHub Issues](https://github.com/yourusername/ecosync/issues)
3. Create new issue with:
   - Platform (Vercel/Railway/etc.)
   - Error logs
   - Steps to reproduce
   - Environment (dev/prod)

---

**Happy Deploying! 🚀**
