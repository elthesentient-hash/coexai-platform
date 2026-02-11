---
name: large-context-handler
description: Handle and process large amounts of content efficiently without overwhelming context windows. Use when working with long transcripts, large files, or extensive datasets that exceed comfortable context limits.
---

# Large Context Handler

Process massive content efficiently by chunking, summarizing, and selective loading.

## Philosophy

> "750,000 words in one go" — But you don't need to process them all at once.

## Techniques

### 1. Chunking

Break large content into manageable pieces:

```bash
# Split transcript by time segments
sed -n '1,500p' transcript.vtt    # First 500 lines
grep -A 5 "00:15:" transcript.vtt # Around 15-minute mark
```

### 2. Progressive Disclosure

Don't load everything at once:

1. **Scan first** — grep for keywords, get overview
2. **Drill down** — Load relevant sections
3. **Summarize** — Extract key points before proceeding

### 3. Selective Analysis

**For video transcripts:**
- Check opening (00:00-05:00) — Usually contains best hooks
- Search for viral keywords: "insane", "shocked", "million", "billion"
- Look for emotional peaks and strong reactions

**For documents:**
- Read headers/sections first
- Identify relevant sections
- Skip boilerplate

## Workflow

### Video Analysis (2+ hour podcast)

1. **Download transcript** (fast, small)
2. **Keyword scan** — Find interesting moments
   ```bash
   grep -n "insane\|shocked\|million\|billion" transcript.vtt
   ```
3. **Sample sections** — Read 50 lines around each hit
4. **Identify clips** — Note timestamps
5. **Cut selectively** — Only download relevant video segments

### Benefits

- **Speed:** Don't download 2-hour video just to find 3 clips
- **Cost:** Minimize token usage
- **Focus:** Zero in on what matters

## Tools

- `grep` — Fast keyword scanning
- `sed` — Line-based extraction
- `head/tail` — Beginning/end sampling
- `wc -l` — Size estimation

## Quote Applied

> "This thing handles 1 million tokens now."

**Reality:** Even with large context, be selective. Quality over quantity.

## Example

**2-hour podcast analyzed in minutes:**
1. ✅ Downloaded transcript (1MB text)
2. ✅ Grepped for viral keywords (found 20 hits)
3. ✅ Sampled 5 promising sections
4. ✅ Identified 3 clip-worthy moments
5. ✅ Downloaded only needed video segments
6. ✅ Cut and delivered clips

**Not done:** Downloaded entire 201MB video upfront.
