# X-CLI Setup for CoExAI

## ✅ INSTALLED

x-cli is now available at: `x-cli`

## 📋 WHAT IT DOES

CLI tool for X/Twitter API v2:
- Post tweets, replies, quotes
- Search tweets
- Get user timelines, followers
- Like, retweet
- Manage bookmarks
- Get tweet analytics

## 🔑 AUTHENTICATION REQUIRED

You need 5 credentials from X Developer Portal:

1. Go to https://developer.x.com/en/portal/dashboard
2. Create an app (or use existing)
3. Get these 5 values:
   - Consumer Key (API Key)
   - Secret Key (API Secret)
   - Bearer Token
   - Access Token
   - Access Token Secret

4. Add to: `~/.config/x-cli/.env`

```bash
X_API_KEY=your_consumer_key
X_API_SECRET=your_secret_key
X_BEARER_TOKEN=your_bearer_token
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
```

## 🚀 USAGE EXAMPLES

```bash
# Post a tweet
x-cli tweet post "Hello from CoExAI"

# Search tweets
x-cli tweet search "AI agents" --max 20

# Get user info
x-cli user get elonmusk

# Like a tweet
x-cli like https://x.com/user/status/123456

# Get your mentions
x-cli me mentions --max 10

# Get bookmarks
x-cli me bookmarks --max 20
```

## 📊 OUTPUT FORMATS

```bash
# Default (human-readable with colors)
x-cli tweet get 123456

# JSON (for piping)
x-cli -j tweet search "AI" | jq '.data[].text'

# Markdown
x-cli -md user get elonmusk

# Verbose (full data)
x-cli -v tweet get 123456
```

## 🔗 INTEGRATION

x-cli is now available system-wide. Use it in:
- Terminal commands
- Scripts
- OpenClaw agent sessions
- Automation workflows

## 📚 MORE INFO

Full docs: https://github.com/Infatoshi/x-cli
