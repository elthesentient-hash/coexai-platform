#!/bin/bash

# PLUTUS Setup Script
# Automates installation and configuration

echo "═══════════════════════════════════════════════════════════"
echo "  PLUTUS - Polymarket Trading Bot Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Found: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Edit .env and add your PRIVATE_KEY"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
mkdir -p logs data

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Edit .env and configure your settings"
echo "2. Add your PRIVATE_KEY to .env"
echo "3. Fund your wallet with USDC on Polygon"
echo "4. Run: npm start"
echo ""
echo "For more info, see README.md"
echo ""

# Offer to edit .env
read -p "Would you like to edit .env now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Please edit .env manually"
    fi
fi

echo ""
echo "🚀 Ready to trade! Run: npm start"
