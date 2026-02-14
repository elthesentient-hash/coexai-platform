# YouTube Research Toolkit for OpenClaw

## Overview
Complete YouTube research capabilities for your AI agents - transcripts, search, channels, playlists, and metadata all in one skill.

## Installation

Add to your `SKILL.md`:

```yaml
name: youtube-research
description: Complete YouTube toolkit for AI agents
tools:
  - web_search
  - web_fetch
  - browser
```

## Capabilities

### 1. Get YouTube Video Transcripts
Extract full transcripts from any YouTube video for analysis, summarization, or research.

**Prompt:**
```
Get the transcript from this YouTube video: {video_url}
Then summarize the key points in 3 bullet points.
```

**Implementation:**
```javascript
// Use invidious or similar API
const transcript = await fetch(`https://yt.lemnoslife.com/videos?part=snippet&id=${videoId}`);
```

### 2. Search YouTube Videos
Find relevant videos on any topic with metadata.

**Prompt:**
```
Search YouTube for the top 5 videos about "{topic}"
For each video, provide:
- Title
- Channel
- View count
- Publish date
- Why it's relevant
```

### 3. Get Channel Information
Analyze YouTube channels for content strategy, upload frequency, and performance.

**Prompt:**
```
Analyze this YouTube channel: {channel_url}
Provide:
- Subscriber count
- Total videos
- Average views per video
- Content categories
- Upload frequency
- Best performing video
```

### 4. Extract Video Metadata
Get detailed information about any video.

**Prompt:**
```
Get complete metadata for this video: {video_url}
Include:
- Title, description, tags
- View count, likes, comments
- Publish date
- Duration
- Category
- Language
```

### 5. Playlist Analysis
Analyze playlists for content series and watch time.

**Prompt:**
```
Analyze this YouTube playlist: {playlist_url}
Provide:
- Total videos
- Total duration
- Average video length
- Topic consistency
- Best video in playlist
```

## API Methods

### Method 1: Invidious (Free, No API Key)
```bash
# Video info
curl "https://yt.lemnoslife.com/videos?part=snippet&id=VIDEO_ID"

# Channel info  
curl "https://yt.lemnoslife.com/channels?part=statistics&id=CHANNEL_ID"

# Search
curl "https://yt.lemnoslife.com/search?q=QUERY&type=video"
```

### Method 2: YouTube Data API (Official)
```bash
# Requires API key from Google Cloud Console
export YOUTUBE_API_KEY="your_key_here"

# Video info
curl "https://www.googleapis.com/youtube/v3/videos?id=VIDEO_ID&part=snippet,statistics&key=$YOUTUBE_API_KEY"

# Search
curl "https://www.googleapis.com/youtube/v3/search?q=QUERY&type=video&key=$YOUTUBE_API_KEY"
```

### Method 3: Web Scraping (Fallback)
Use `web_fetch` to extract data directly from YouTube pages.

## Usage Examples

### Example 1: Research Competitor Content
```
"Find the 10 most popular videos about AI agents on YouTube from the last 6 months. 
For each video, get the transcript and identify the key pain points they address."
```

### Example 2: Content Gap Analysis
```
"Search YouTube for 'Polymarket trading strategy'. 
Analyze the top 20 results to identify:
- What topics are covered
- What topics are missing
- Average video length
- Engagement patterns"
```

### Example 3: Influencer Research
```
"Find YouTube channels with 10K-100K subscribers that talk about crypto trading.
For each channel:
- Get their last 10 videos
- Calculate average views
- Identify their top-performing content type
- Check upload frequency"
```

### Example 4: Video Summarization
```
"Get the transcript from this 2-hour podcast video and create:
- 1 paragraph summary
- 10 key takeaways
- 3 actionable insights
- Timestamped chapter markers"
```

## Advanced Features

### Sentiment Analysis
```
"Get transcripts from 50 videos about '{topic}'. 
Analyze the sentiment of comments and identify:
- Common complaints
- What people love
- Feature requests
- Common questions"
```

### Trend Detection
```
"Search YouTube for '{topic}' videos from the last 30 days vs 30-60 days ago.
Compare:
- Upload frequency
- View counts
- Topics covered
- What's trending now vs then"
```

### Content Calendar Generation
```
"Analyze the top 20 channels in {niche}.
Based on their most popular content, suggest 10 video ideas that would perform well.
For each idea, include:
- Title
- Target keywords
- Estimated video length
- Why it would work"
```

## Integration with CoExAI

Your agents can now:
1. **Maya (Content)** - Research trending topics, analyze viral content
2. **Engage (Community)** - Monitor YouTube comments for feedback
3. **Pitch (Sales)** - Find potential clients on YouTube
4. **Analyze (Analytics)** - Track competitor YouTube performance
5. **SEO (Search)** - Optimize video titles, descriptions, tags

## Setup in OpenClaw

1. Add this skill to your agent's `SKILL.md`
2. Set environment variable: `YOUTUBE_API_KEY=your_key` (optional, for official API)
3. Test with: "Search YouTube for 'AI trading bots' and summarize the top 3 videos"

## Free Tier Limits

- **Invidious**: No limits, but may be slower
- **YouTube Data API**: 10,000 units/day (sufficient for most use cases)
- **Web scraping**: Unlimited, but less reliable

## Cost: $0

This skill uses free APIs and web scraping. No paid services required.
