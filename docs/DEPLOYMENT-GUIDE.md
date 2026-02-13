# CoExAI API Deployment Guide

## Option 1: Railway (Recommended - Easiest)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Initialize Project
```bash
cd /root/.openclaw/workspace
railway init
```
- Select "Empty Project"
- Name it: `coexai-api`

### Step 4: Add PostgreSQL Database
```bash
railway add --database postgres
```

### Step 5: Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="your-super-secret-key-change-this"
```

**Note:** DATABASE_URL will be auto-populated by Railway when PostgreSQL is ready.

### Step 6: Deploy
```bash
railway up
```

### Step 7: Get Domain
```bash
railway domain
```

Output: `https://coexai-api.up.railway.app`

### Step 8: Run Database Migrations
```bash
railway connect postgres
psql \c railway
# Then paste contents of api/schema.sql
```

Or locally with Railway CLI:
```bash
railway run psql $DATABASE_URL < api/schema.sql
```

### Step 9: Update Frontend
Edit `assets/auth.js` and update:
```javascript
const AUTH_CONFIG = {
  API_URL: 'https://coexai-api.up.railway.app/api',
  // ... rest
};
```

---

## Option 2: Render.com

### Step 1: Create Web Service
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Select the repository

### Step 2: Configure Service
- **Name:** coexai-api
- **Root Directory:** api
- **Build Command:** npm install
- **Start Command:** npm start

### Step 3: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: coexai-db
3. Copy the "Internal Database URL"

### Step 4: Set Environment Variables
In Web Service → Environment:
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
DATABASE_URL=postgres://... (from step 3)
```

### Step 5: Deploy
Click "Create Web Service"

### Step 6: Run Migrations
```bash
psql $DATABASE_URL < api/schema.sql
```

---

## Option 3: Fly.io

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login
```bash
flyctl auth login
```

### Step 3: Create App
```bash
cd api
flyctl launch --name coexai-api
```

### Step 4: Create Database
```bash
flyctl postgres create --name coexai-db
flyctl postgres attach coexai-db
```

### Step 5: Set Secrets
```bash
flyctl secrets set JWT_SECRET="your-secret-key"
```

### Step 6: Deploy
```bash
flyctl deploy
```

---

## Option 4: Vercel (Serverless)

**Note:** Vercel is serverless, best for frontend. For API, use Railway/Render instead.

If you must use Vercel:
1. Create `api/index.js` with Express adapter
2. Use Vercel Postgres (paid)
3. Deploy with `vercel --prod`

---

## Quick Start (Railway - One Command)

```bash
# Run the deployment script
chmod +x deploy-railway.sh
./deploy-railway.sh
```

---

## Post-Deployment Checklist

- [ ] API health check passes: `GET /api/health`
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Frontend API_URL updated
- [ ] CORS origin added for production domain
- [ ] Test user registration works
- [ ] Test login works
- [ ] Waitlist signup works

---

## Troubleshooting

### Database Connection Failed
```bash
# Check if DATABASE_URL is set
railway variables

# Verify database is running
railway status
```

### CORS Errors
Update `api/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### JWT Errors
Make sure JWT_SECRET is set:
```bash
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
```

---

## Recommended: Railway

**Why Railway?**
- ✅ Free tier (PostgreSQL + hosting)
- ✅ Automatic HTTPS
- ✅ Git-based deployments
- ✅ Easy environment variables
- ✅ Built-in database
- ✅ Auto-scaling

**Free Tier Limits:**
- 500 hours/month runtime
- 1GB PostgreSQL storage
- $5 credit/month (enough for small app)

**Estimated Cost:** $0-5/month for beta
