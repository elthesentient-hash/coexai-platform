# 🚀 CoExAI Setup Guide

Complete guide to setting up CoExAI with real authentication, payments, and platform connections.

## 📋 Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Stripe account (free tier works)
- Google Cloud Console (for YouTube OAuth)
- TikTok Developer account (for TikTok OAuth)

---

## Step 1: Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "coexai"
4. Choose region closest to your users
5. Wait for project to be created

### 2. Get API Keys
1. Go to Project Settings → API
2. Copy:
   - `URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

### 3. Run Database Schema
1. Go to SQL Editor
2. Copy contents of `database/auth-schema.sql`
3. Paste and run

---

## Step 2: Stripe Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Create account (free)
3. Go to Developers → API Keys
4. Copy:
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY`

### 2. Create Products & Prices
1. Go to Products → Add Product
2. Create 4 products:
   - **Starter** - $500/month
   - **Growth** - $700/month  
   - **Pro** - $1,000/month
   - **Empire** - $1,200/month

3. For each product:
   - Set recurring monthly
   - Copy Price ID to `.env`

### 3. Set Up Webhook
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: YouTube OAuth Setup

### 1. Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project "CoExAI"
3. Enable YouTube Data API v3

### 2. OAuth Consent Screen
1. APIs & Services → OAuth consent screen
2. Choose "External"
3. Fill in:
   - App name: CoExAI
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
5. Add test users (your email)

### 3. Create Credentials
1. APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/connect/youtube/callback` (dev)
   - `https://your-domain.com/api/connect/youtube/callback` (prod)
5. Copy:
   - `Client ID` → `YOUTUBE_CLIENT_ID`
   - `Client Secret` → `YOUTUBE_CLIENT_SECRET`

---

## Step 4: Environment Setup

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Fill In All Values
Edit `.env` with all the keys you collected above.

---

## Step 5: Install & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
# or
node api/server.js
```

### 3. Test Locally
- Landing page: http://localhost:3000
- Auth: http://localhost:3000/auth
- API: http://localhost:3000/api

---

## Step 6: Deploy

### Option A: Vercel (Frontend)
```bash
npm i -g vercel
vercel
```

### Option B: Railway (Backend)
1. Push to GitHub
2. Connect Railway to repo
3. Add environment variables
4. Deploy

### Option C: Self-Hosted
```bash
# Using PM2
npm i -g pm2
pm2 start api/server.js --name coexai-api
```

---

## 🔧 Testing the Flow

### 1. Sign Up Flow
1. Visit landing page
2. Click "Start Free Trial"
3. Select Growth plan
4. Create account
5. Check email for confirmation
6. Connect YouTube
7. Access dashboard

### 2. Test Payments
1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future date, any 3-digit CVC
3. Should create subscription

### 3. Test AI Agents
1. Upload test video
2. Check Maya processes it
3. Check Engage replies to comments

---

## 🐛 Troubleshooting

### Supabase Connection Issues
- Check URL and key are correct
- Ensure RLS policies allow operations
- Check database tables exist

### Stripe Webhook Not Working
- Verify webhook URL is accessible
- Check signing secret is correct
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/payments/webhook
  ```

### OAuth Callback Errors
- Verify redirect URIs match exactly
- Check client ID/secret
- Ensure user is added as test user (Google)

---

## 📚 Next Steps

1. **Add TikTok OAuth** - Similar process to YouTube
2. **Add Instagram OAuth** - Requires Facebook app
3. **Add Twitter OAuth** - Apply for developer account
4. **Build Pitch Agent** - Brand deal hunter
5. **Add Analytics** - Track user behavior

---

## 💰 Revenue Model

| Plan | Price | Target |
|------|-------|--------|
| Starter | $500/mo | 10K-100K followers |
| Growth | $700/mo | 100K-500K followers |
| Pro | $1,000/mo | 500K-1M followers |
| Empire | $1,200/mo | 1M+ followers |

**Goal:** 100 customers × $700 avg = $70K MRR = $840K ARR

---

**Need help?** Contact support@coexai.com
