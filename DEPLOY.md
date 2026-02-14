# Deploy Instructions

## Option 1: Manual Deploy (Fastest)
1. Go to https://vercel.com/dashboard
2. Find "coexai-platform" project
3. Click ⋯ → "Redeploy"

## Option 2: GitHub Actions (Auto-deploy)
Add these secrets to GitHub (Settings → Secrets → Actions):

1. **VERCEL_TOKEN** - Get from https://vercel.com/account/tokens
2. **VERCEL_ORG_ID** - Get from project settings
3. **VERCEL_PROJECT_ID** - Get from project settings

## Option 3: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```
