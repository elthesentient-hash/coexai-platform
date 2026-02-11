---
name: viral-clipper
description: Download YouTube videos and cut viral clips for social media (TikTok, Reels, Shorts). Use when user wants to repurpose long-form video content into short viral clips, extract highlights from podcasts/interviews, or create social media content from YouTube videos.
---

# Viral Clipper

Transform long-form YouTube content into short viral clips for social media.

## Capabilities

- Download YouTube videos (using yt-dlp with `--force-ipv4` to bypass bot detection)
- Extract transcripts for content analysis
- Cut clips with ffmpeg (copy codec for speed)
- Deliver clips with audio intact

## Workflow

### 1. Download Video Info
```bash
yt-dlp --force-ipv4 --print "%(title)s [%(duration_string)s]" "URL"
```

### 2. Get Transcript
```bash
yt-dlp --force-ipv4 --write-auto-subs --sub-langs en --skip-download "URL"
```

### 3. Analyze for Viral Moments
Look for:
- Hot takes and bold claims
- Surprising statistics ("1 million tokens", "750,000 words")
- Strong emotions ("insane", "mind blown", "shocked")
- Jokes or funny moments
- Controversial statements
- Clear hooks in first 10 seconds

### 4. Cut Clips
```bash
ffmpeg -i video.mp4 -ss HH:MM:SS -t DURATION -c copy output.mp4 -y
```

**Clip length guidelines:**
- TikTok/Reels: 15-30 seconds optimal
- YouTube Shorts: Under 60 seconds
- Hook viewers in first 3 seconds

### 5. Deliver
Send clips via Telegram or save to workspace.

## Script

Use `scripts/viral-clipper.sh` for one-off clip cutting:
```bash
bash scripts/viral-clipper.sh "URL" "00:01:30" "15" "output.mp4"
```

## Tools Required

- yt-dlp (video downloading)
- ffmpeg (video cutting)
- `--force-ipv4` flag (bypasses YouTube bot detection on datacenter IPs)

## Viral Clip Patterns

**From Podcast Analysis:**
1. **"AGI Moment"** — Bold AI claims that spark debate
2. **"Million Tokens"** — Surprising scale/comparison stats
3. **"Recursive Self-Improvement"** — Technical concepts explained simply
4. **"I've Been Clawd"** — Memorable coined terms
5. **Opening Hooks** — First 30 seconds often contain gold

**Hook Formulas:**
- "This is as important as [big thing]"
- "[Big number] in one go"
- "I was shocked when I learned..."
- "[Famous person] just dropped..."
- "This changes everything"
