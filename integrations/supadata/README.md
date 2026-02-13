# Supadata Integration for CoExAI

Production-ready API client with rate limiting, retries, and error handling.

## ✅ What's Fixed

| Issue | Solution |
|-------|----------|
| Rate limits | 6-second delay between requests + retry logic |
| 404 errors | Multiple endpoint fallback system |
| No error handling | Comprehensive error catching and recovery |
| No batch support | Built-in batch processing with early termination |
| No documentation | This file + inline code docs |

## 🚀 Quick Start

```bash
# Set API key
export SUPADATA_API_KEY=sd_903c1bb3b0df338fa1cd1f294d9ab4fc

# Get YouTube transcript
node supadata-client.js youtube dQw4w9WgXcQ

# Scrape web page
node supadata-client.js web https://example.com

# Get video info
node supadata-client.js info jNQXAC9IVRw
```

## 📦 Installation

```bash
cd integrations/supadata
npm install axios
```

## 🔌 API Reference

### YouTube Transcript

```javascript
const SupadataClient = require('./supadata-client');
const client = new SupadataClient('your-api-key');

// Get transcript
const result = await client.getYouTubeTranscript('VIDEO_ID', true);

// Response:
{
  success: true,
  data: {
    lang: "en",
    availableLangs: ["en"],
    content: "Full transcript text..."
  }
}
```

### Web Scraping

```javascript
// Automatically tries multiple endpoints
const result = await client.scrapeWeb('https://example.com');

// Response:
{
  success: true,
  data: { /* page content */ },
  endpointUsed: '/web/scrape'
}
```

### Batch Processing

```javascript
const videoIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0'];
const results = await client.batchYouTubeTranscripts(videoIds);

// Stops early if rate limited
```

## 🔧 Configuration

```javascript
const client = new SupadataClient('your-api-key', {
  minRequestInterval: 6000,  // ms between requests
  maxRetries: 3,              // retry attempts
  retryDelay: 10000,          // ms between retries
  timeout: 30000              // request timeout
});
```

## 📊 Rate Limiting

**Free Plan Limits:**
- ~10 requests per minute
- Automatic 6-second delays between requests
- 10-second retry delays on rate limit errors
- Early termination on batch operations

**Recommendation:** Upgrade to paid plan for production use.

## 🎯 CoExAI Integration

### Maya (Content Agent)

```javascript
// Extract YouTube content for repurposing
const transcript = await client.getYouTubeTranscript(videoId, true);
// → Feed to Maya for content creation
```

### Engage (Community Agent)

```javascript
// Analyze comment sentiment from transcripts
const videos = await client.batchYouTubeTranscripts(channelVideos);
// → Process with Engage for community insights
```

### Analyze (Analytics Agent)

```javascript
// Scrape competitor content
const competitorContent = await client.scrapeWeb(competitorUrl);
// → Analyze with Analyze agent
```

### SEO Agent

```javascript
// Extract top-ranking page content
const topPages = await Promise.all(
  urls.map(url => client.scrapeWeb(url))
);
// → SEO analysis and optimization
```

## ⚠️ Error Handling

```javascript
const result = await client.getYouTubeTranscript('invalid-id');

if (!result.success) {
  console.error(result.error);
  // Handle: "Rate limit exceeded", "Video not found", etc.
}
```

## 🧪 Testing

```bash
# Test YouTube
node supadata-client.js youtube jNQXAC9IVRw

# Test web scraping
node supadata-client.js web https://supadata.ai

# Test batch (create ids.json first)
echo '["jNQXAC9IVRw", "dQw4w9WgXcQ"]' > ids.json
node supadata-client.js batch ids.json
```

## 📁 Files

| File | Purpose |
|------|---------|
| `supadata-client.js` | Main API client |
| `README.md` | This documentation |
| `examples/` | Usage examples |

## 🔗 Resources

- **API Base:** `https://api.supadata.ai/v1`
- **Working Endpoints:**
  - `GET /youtube/transcript?videoId={id}&text={true|false}`
  - `GET /web/scrape?url={url}`
  - `GET /web?url={url}`
  - `GET /web/reader?url={url}`

## 💡 Pro Tips

1. **Always use text=true** for YouTube to get clean text
2. **Batch carefully** - free plan limits are tight
3. **Handle failures gracefully** - some videos block transcripts
4. **Cache results** - avoid re-fetching same content
5. **Upgrade plan** for production workloads
