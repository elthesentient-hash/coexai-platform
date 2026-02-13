# COEXAI API Integration Guide
## Complete Documentation for All 6 AI Agents

**Version:** 2.0  
**Last Updated:** 2026-02-13  
**Status:** Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Maya - Content Multiplier](#maya---content-multiplier)
4. [Engage - Community Manager](#engage---community-manager)
5. [Pitch - Brand Deal Hunter](#pitch---brand-deal-hunter)
6. [Analyze - Analytics Engine](#analyze---analytics-engine)
7. [Support - Admin Assistant](#support---admin-assistant)
8. [SEO - Discoverability](#seo---discoverability)
9. [Error Handling](#error-handling)
10. [Rate Limits](#rate-limits)

---

## Quick Start

### Installation

```bash
npm install @coexai/agents
```

### Basic Setup

```javascript
const { MayaAgent, EngageAgent, PitchAgent, AnalyzeAgent, SupportAgent, SEOAgent } = require('@coexai/agents');

// Initialize with your API key
const config = {
  openaiKey: process.env.OPENAI_API_KEY,
  creatorId: 'your-creator-id'
};

// Create agent instances
const maya = new MayaAgent(config);
const engage = new EngageAgent(config);
const pitch = new PitchAgent(config);
const analyze = new AnalyzeAgent(config);
const support = new SupportAgent(config);
const seo = new SEOAgent(config);
```

---

## Authentication

All agents require an OpenAI API key with GPT-4 access.

### Environment Variables

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
YOUTUBE_API_KEY=...
TIKTOK_API_KEY=...
INSTAGRAM_API_KEY=...
```

### API Key Permissions Required

- `gpt-4` model access
- `text-embedding-ada-002` for embeddings
- `whisper-1` for transcription (Maya)

---

## Maya - Content Multiplier

**Purpose:** Transform 1 video into 20+ platform-optimized content pieces

### Constructor

```javascript
const maya = new MayaAgent({
  openaiKey: string,      // Required: OpenAI API key
  creatorId: string,      // Required: Unique creator identifier
  creatorVoice: string    // Optional: Brand voice guidelines
});
```

### Core Methods

#### `multiplyContent(videoData)`

Transform a single video into multiple content pieces.

**Parameters:**
```javascript
{
  url: string,           // Video URL (YouTube, TikTok, etc.)
  title: string,         // Video title
  duration: number,      // Duration in seconds
  transcript: string,    // Optional: Pre-generated transcript
  platform: string       // Source platform
}
```

**Returns:**
```javascript
{
  original: { ... },
  generated: {
    shorts: Array,       // 5 YouTube Shorts/TikToks
    clips: Array,        // 5 longer clips
    tweets: Array,       // 5 standalone tweets
    threads: Array,      // 2 Twitter threads
    carousels: Array,    // 3 Instagram carousels
    quotes: Array,       // 5 quote graphics
    blogPosts: Array,    // 2 blog posts
    newsletters: Array,  // 1 newsletter
    thumbnails: Array,   // 5 thumbnail ideas
    scripts: Array       // 5 hook scripts
  },
  metadata: {
    totalPieces: number,    // Total content pieces generated
    platforms: Array,       // Target platforms
    timeSaved: number       // Hours saved (estimated)
  }
}
```

**Example:**
```javascript
const contentPackage = await maya.multiplyContent({
  url: 'https://youtube.com/watch?v=abc123',
  title: '10 AI Tools That Changed My Business',
  duration: 1200,
  platform: 'youtube'
});

console.log(`Generated ${contentPackage.metadata.totalPieces} pieces`);
console.log('Shorts:', contentPackage.generated.shorts);
```

#### `analyzeVideo(videoData)`

Deep analysis of video content for optimization.

**Returns:**
```javascript
{
  transcript: string,        // Full transcript
  keyMoments: Array,         // 5-7 key moments with timestamps
  topics: string,            // Main topics covered
  quotes: Array,             // 10 quotable moments
  summary: string,           // Executive summary
  hooks: Array               // Extracted hook patterns
}
```

#### `generateShorts(analysis, count)`

Generate short-form video concepts.

**Parameters:**
- `analysis`: Video analysis object
- `count`: Number of shorts to generate (default: 5)

**Returns:** Array of short video objects with scripts, captions, and hashtags.

### Platform Integrations

**YouTube:**
```javascript
// Requires YouTube Data API v3
const youtube = google.youtube({
  version: 'v3',
  auth: config.youtubeApiKey
});
```

**TikTok:**
```javascript
// Requires TikTok for Business API
const tiktokAuth = await getTikTokAuth();
```

**Instagram:**
```javascript
// Requires Instagram Basic Display API
const ig = new IgApiClient();
```

### Error Handling

```javascript
try {
  const content = await maya.multiplyContent(videoData);
} catch (error) {
  if (error.code === 'TRANSCRIPTION_FAILED') {
    // Retry with different audio source
  } else if (error.code === 'RATE_LIMITED') {
    // Wait and retry
  }
}
```

---

## Engage - Community Manager

**Purpose:** Automated comment replies, DM management, and community engagement

### Constructor

```javascript
const engage = new EngageAgent({
  openaiKey: string,
  supabaseUrl: string,
  supabaseKey: string,
  creatorId: string
});
```

### Core Methods

#### `initialize()`

Load creator profile and voice settings.

```javascript
await engage.initialize();
```

#### `processComments(platform, videoId, comments)`

Process and reply to comments automatically.

**Parameters:**
```javascript
platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter'
videoId: string
comments: Array<{
  id: string,
  text: string,
  author: string,
  timestamp: string
}>
```

**Returns:**
```javascript
{
  replies: Array<{
    commentId: string,
    reply: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    action: 'replied' | 'flagged' | 'ignored'
  }>,
  stats: {
    totalProcessed: number,
    replied: number,
    flagged: number,
    ignored: number
  }
}
```

**Example:**
```javascript
const comments = await fetchYouTubeComments(videoId);
const result = await engage.processComments('youtube', videoId, comments);

console.log(`Replied to ${result.stats.replied} comments`);
```

#### `generateReply(comment, context)`

Generate personalized reply to a comment.

**Parameters:**
```javascript
comment: {
  text: string,
  author: string,
  sentiment: string
}
context: {
  videoTopic: string,
  creatorTone: string
}
```

**Returns:** Personalized reply string.

#### `isSpam(text)`

Detect spam/toxic comments.

**Returns:** `boolean`

### Platform Integrations

**YouTube Comments API:**
```javascript
const response = await youtube.commentThreads.list({
  part: 'snippet',
  videoId: videoId,
  maxResults: 100
});
```

**TikTok Comments:**
```javascript
const comments = await tiktok.comment.list({
  video_id: videoId
});
```

**Instagram Graph API:**
```javascript
const comments = await ig.media.comments(mediaId);
```

### Voice Training

```javascript
// Learn creator's voice from samples
await engage.learnVoice([
  'Previous comment reply 1...',
  'Previous comment reply 2...',
  'DM response example...'
]);
```

---

## Pitch - Brand Deal Hunter

**Purpose:** Find brand opportunities, draft pitches, negotiate deals

### Constructor

```javascript
const pitch = new PitchAgent({
  openaiKey: string,
  creatorId: string
});
```

### Core Methods

#### `initialize(creatorProfile)`

Set up creator profile for brand matching.

**Parameters:**
```javascript
{
  niche: string,              // 'fitness', 'tech', 'beauty', etc.
  platforms: Array<string>,   // ['youtube', 'instagram', 'tiktok']
  followers: {
    youtube: number,
    instagram: number,
    tiktok: number
  },
  engagementRate: number,     // e.g., 4.5
  avgViews: {
    youtube: number,
    // ...
  },
  audienceDemo: string,       // '18-34, 60% female'
  pastBrands: Array<string>,
  contentStyle: string,
  rateCard: {
    instagram_post: number,
    youtube_video: number,
    // ...
  },
  email: string,
  portfolio: string
}
```

#### `discoverBrands()`

Find brand partnership opportunities.

**Returns:**
```javascript
[
  {
    brand: string,
    platform: string,        // 'grin.co', 'upfluence.com'
    budget: string,          // '$50K-100K'
    lookingFor: string,      // Description
    campaignType: string,
    matchScore: number,      // 0-100
    estimatedDealSize: number,
    priority: number         // Higher = better match
  }
]
```

**Example:**
```javascript
await pitch.initialize(creatorProfile);
const opportunities = await pitch.discoverBrands();

// Top 5 opportunities
const top5 = opportunities.slice(0, 5);
```

#### `generatePitch(brand)`

Create personalized pitch email.

**Returns:**
```javascript
{
  subject: string,
  body: string,
  brand: string,
  generatedAt: string
}
```

**Example:**
```javascript
const pitchEmail = await pitch.generatePitch(opportunities[0]);
console.log('Subject:', pitchEmail.subject);
console.log('Body:', pitchEmail.body);
```

#### `analyzeOffer(offerDetails)`

Evaluate incoming brand offer.

**Parameters:**
```javascript
{
  brand: string,
  deliverables: {
    instagram_post: number,
    youtube_video: number,
    // ...
  },
  compensation: number,
  usageRights: string,
  timeline: string
}
```

**Returns:**
```javascript
{
  isFair: boolean,
  marketRate: number,
  offeredRate: number,
  recommendation: string,
  counterOffer: number,
  negotiationStrategy: string
}
```

#### `sendFollowUps()`

Automatically follow up on pending pitches.

**Returns:** Number of follow-ups sent.

### Integration Points

**Influencer Platforms:**
- Grin
- Upfluence
- Creator.co
- Aspire
- Impact

**Brand Databases:**
- Manual research
- Social media monitoring
- Competitor analysis

---

## Analyze - Analytics Engine

**Purpose:** Track metrics, generate insights, predict trends

### Constructor

```javascript
const analyze = new AnalyzeAgent({
  openaiKey: string,
  creatorId: string,
  platforms: ['youtube', 'tiktok', 'instagram', 'twitter']
});
```

### Core Methods

#### `initialize()`

Load platform APIs and benchmarks.

```javascript
await analyze.initialize();
```

#### `fetchAllMetrics(timeRange)`

Pull metrics from all platforms.

**Parameters:**
- `timeRange`: '7d' | '30d' | '90d' | '1y'

**Returns:**
```javascript
{
  youtube: {
    subscribers: number,
    views: number,
    watchTime: number,
    avgViewDuration: number,
    clickThroughRate: number,
    topVideos: Array,
    audienceRetention: Array,
    trafficSources: Object,
    demographics: Object
  },
  tiktok: { ... },
  instagram: { ... },
  twitter: { ... },
  aggregated: {
    followers: number,
    views: number,
    engagement: number,
    engagementRate: number,
    platforms: Array
  }
}
```

#### `generateReport(timeRange)`

Generate comprehensive analytics report.

**Returns:**
```javascript
{
  period: string,
  generatedAt: string,
  summary: {
    totalViews: number,
    totalEngagement: number,
    engagementRate: string,
    growthRate: string,
    topPlatform: string,
    bestPerformingContent: Array,
    alerts: Array
  },
  insights: Array<string>,
  recommendations: Array<{
    category: string,
    title: string,
    description: string,
    impact: number,
    effort: string,
    action: string
  }>,
  benchmarks: {
    engagementRate: Object,
    growthRate: Object,
    viewVelocity: Object
  },
  predictions: {
    '30d_projection': Object,
    '90d_projection': Object,
    scenarios: Object
  }
}
```

**Example:**
```javascript
const report = await analyze.generateReport('30d');
console.log('Engagement rate:', report.summary.engagementRate);
console.log('Top recommendations:', report.recommendations.slice(0, 3));
```

#### `predictViralPotential(contentIdea)`

Score content idea for viral potential.

**Parameters:**
```javascript
{
  title: string,
  description: string,
  format: string,      // 'video', 'short', 'post'
  topic: string
}
```

**Returns:**
```javascript
{
  score: number,       // 0-100
  breakdown: {
    hookStrength: number,
    trendAlignment: number,
    audienceInterest: number,
    shareability: number
  },
  improvements: Array<string>
}
```

### Platform Integrations

**YouTube Analytics API:**
```javascript
const analytics = await youtubeAnalytics.reports.query({
  ids: 'channel==MINE',
  startDate: '2026-01-01',
  endDate: '2026-02-01',
  metrics: 'views,likes,comments'
});
```

**TikTok Analytics:**
```javascript
const stats = await tiktok.analytics.videoStats(videoId);
```

**Instagram Insights:**
```javascript
const insights = await ig.insights.media(mediaId);
```

---

## Support - Admin Assistant

**Purpose:** Manage inbox, invoices, taxes, contracts

### Constructor

```javascript
const support = new SupportAgent({
  openaiKey: string,
  creatorId: string,
  emailIntegration: Object,    // Gmail/Outlook config
  calendarIntegration: Object  // Google Calendar config
});
```

### Core Methods

#### `initialize(creatorProfile)`

Set up business profile.

**Parameters:**
```javascript
{
  name: string,
  businessName: string,
  email: string,
  taxId: string,
  address: string,
  paymentMethods: Array,
  rateCard: Object,
  businessType: string
}
```

#### `processInbox(emails)`

Categorize and process emails.

**Parameters:**
```javascript
Array<{
  id: string,
  from: string,
  subject: string,
  preview: string,
  body: string
}>
```

**Returns:**
```javascript
{
  brandDeals: Array,
  fanMail: Array,
  business: Array,
  urgent: Array,
  spam: Array,
  needsReply: Array
}
```

#### `generateInvoice(dealDetails)`

Create professional invoice.

**Parameters:**
```javascript
{
  brand: string,
  contactEmail: string,
  brandAddress: string,
  deliverables: Array<{
    description: string,
    quantity: number,
    rate: number
  }>,
  terms: string,
  notes: string
}
```

**Returns:** Invoice object with calculated totals.

**Example:**
```javascript
const invoice = await support.generateInvoice({
  brand: 'Nike',
  contactEmail: 'partnerships@nike.com',
  deliverables: [
    { description: 'Instagram Post', quantity: 1, rate: 5000 },
    { description: 'Instagram Story', quantity: 3, rate: 1500 }
  ],
  terms: 'Net 30'
});

console.log('Total:', invoice.total);
```

#### `trackPayments(invoices)`

Monitor payment status.

**Returns:**
```javascript
{
  paid: Array,
  pending: Array,
  overdue: Array,
  totalOutstanding: number,
  totalPaid: number
}
```

#### `organizeTaxDocuments(year, transactions)`

Prepare tax documentation.

**Returns:**
```javascript
{
  year: number,
  income: {
    brandDeals: Array,
    platformRevenue: Array,
    total: number
  },
  expenses: {
    equipment: Array,
    software: Array,
    total: number
  },
  deductions: Array,
  documents: {
    '1099s': Array,
    invoices: Array,
    receipts: Array
  }
}
```

#### `reviewContract(contractText)`

Analyze brand contract for red flags.

**Returns:**
```javascript
{
  summary: string,
  redFlags: Array<string>,
  recommendations: Array<string>,
  paymentTerms: Object,
  usageRights: Object
}
```

### Calendar Integration

```javascript
// Schedule brand calls
await support.scheduleBrandCall(brandContact, proposedTimes);

// Manage content calendar
await support.manageContentCalendar(contentPlan);
```

### Email Integration

**Gmail API:**
```javascript
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
```

**Outlook/Microsoft Graph:**
```javascript
const client = Client.init({
  authProvider: (done) => done(null, accessToken)
});
```

---

## SEO - Discoverability

**Purpose:** Optimize content for YouTube, TikTok, Instagram search

### Constructor

```javascript
const seo = new SEOAgent({
  openaiKey: string,
  creatorId: string,
  niche: string,           // 'fitness', 'tech', etc.
  platforms: ['youtube', 'tiktok', 'instagram']
});
```

### Core Methods

#### `researchKeywords(topic, platform)`

Find high-opportunity keywords.

**Parameters:**
- `topic`: Content topic
- `platform`: 'youtube' | 'tiktok' | 'instagram'

**Returns:**
```javascript
[
  {
    keyword: string,
    type: 'primary' | 'secondary' | 'longTail' | 'trending',
    volume: number,
    competition: number,
    relevance: number,
    trending: boolean,
    opportunity: number  // 0-100 score
  }
]
```

**Example:**
```javascript
const keywords = await seo.researchKeywords('AI tools for business', 'youtube');
const topKeywords = keywords.slice(0, 10);
```

#### `optimizeYouTubeVideo(videoData)`

Full YouTube optimization.

**Returns:**
```javascript
{
  title: Array<string>,     // 5 title options
  description: string,      // SEO-optimized description
  tags: Array<string>,      // 15 tags
  thumbnailText: Array<string>,
  bestTime: {
    day: string,
    time: string
  },
  playlist: {
    existing: string,
    createNew: string
  }
}
```

#### `optimizeTikTok(contentData)`

TikTok content optimization.

**Returns:**
```javascript
{
  caption: string,
  hashtags: Array<string>,
  sounds: Array<Object>,
  bestTime: Object,
  hook: string
}
```

#### `optimizeInstagram(contentData)`

Instagram content optimization.

**Returns:**
```javascript
{
  caption: string,
  hashtags: Array<string>,
  altText: string,
  bestTime: Object,
  location: string
}
```

#### `trackSearchRankings(keywords, platform)`

Monitor search positions.

**Returns:**
```javascript
[
  {
    keyword: string,
    platform: string,
    currentRank: number,
    previousRank: number,
    trend: 'up' | 'down' | 'stable' | 'new'
  }
]
```

### Trending Topics

```javascript
// Get trending in niche
const trends = await seo.getTrendingKeywords('youtube');

// Check keyword trends
const isTrending = trends.some(t => t.keyword.includes('AI'));
```

---

## Error Handling

All agents throw structured errors:

```javascript
{
  code: string,          // Error code
  message: string,       // Human-readable message
  agent: string,         // Which agent failed
  retryable: boolean,    // Can retry?
  details: Object        // Additional context
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `RATE_LIMITED` | API rate limit hit | Wait and retry |
| `AUTH_FAILED` | Authentication error | Check API keys |
| `PLATFORM_ERROR` | Platform API error | Check platform status |
| `TRANSCRIPTION_FAILED` | Audio processing failed | Check audio quality |
| `NO_DATA` | No data returned | Check input parameters |

### Retry Logic

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!error.retryable || i === maxRetries - 1) throw error;
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

## Rate Limits

| Agent | Operation | Limit |
|-------|-----------|-------|
| Maya | Video processing | 10/hour |
| Maya | Content generation | 50/hour |
| Engage | Comments processed | 1000/hour |
| Pitch | Brand discovery | 20/hour |
| Analyze | Report generation | 10/hour |
| Support | Emails processed | 500/hour |
| SEO | Keyword research | 100/hour |

**OpenAI Rate Limits:**
- GPT-4: 200 requests/minute
- GPT-4 Turbo: 500 requests/minute

---

## Webhooks

Receive real-time updates:

```javascript
// Configure webhook endpoint
const webhook = {
  url: 'https://your-app.com/webhooks/coexai',
  events: ['content.generated', 'engagement.reply', 'deal.found']
};
```

### Event Types

- `content.generated` - New content created
- `engagement.reply` - Comment reply sent
- `deal.found` - Brand opportunity discovered
- `analytics.alert` - Performance threshold crossed
- `payment.received` - Invoice paid

---

## Support

**Documentation:** https://docs.coexai.com  
**API Status:** https://status.coexai.com  
**Support Email:** support@coexai.com  
**Discord:** https://discord.gg/coexai

---

*Last updated: 2026-02-13*
