#!/bin/bash
# Deploy CoExAI API to Railway

echo "🚀 CoExAI Railway Deployment Script"
echo "===================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway status > /dev/null 2>&1; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Initialize project if not already
echo ""
echo "📦 Checking project..."
if [ ! -f ".railway/config.json" ]; then
    echo "🆕 Creating new Railway project..."
    railway init
else
    echo "✅ Project already initialized"
fi

# Add PostgreSQL database
echo ""
echo "🐘 Adding PostgreSQL database..."
railway add --database postgres

# Set environment variables
echo ""
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Deploy
echo ""
echo "🚀 Deploying to Railway..."
railway up

# Get URL
echo ""
echo "🌐 Getting deployment URL..."
DEPLOY_URL=$(railway domain)
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌍 API URL: $DEPLOY_URL"
echo "📊 Health Check: $DEPLOY_URL/api/health"
echo ""
echo "Don't forget to:"
echo "1. Update DATABASE_URL after Postgres is provisioned"
echo "2. Run database migrations: psql $DATABASE_URL < api/schema.sql"
echo "3. Update frontend API_URL in assets/auth.js"
