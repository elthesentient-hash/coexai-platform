#!/bin/bash
# Quick deploy script - run this after setting VERCEL_TOKEN

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN not set"
  echo "Get token from: https://vercel.com/account/tokens"
  exit 1
fi

# Deploy to Vercel
npx vercel --token "$VERCEL_TOKEN" --prod --yes
