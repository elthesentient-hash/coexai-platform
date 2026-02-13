// ============================================
// MAYA v2.0 - AI Content Multiplier for Creators
// 1 Video → 20+ Platform-Optimized Pieces
// ============================================

require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

class MayaAgentV2 {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.creatorId = config.creatorId;
    this.creatorVoice = config.creatorVoice || null;
  }

  // ============================================
  // CORE: 1 VIDEO → 20+ PIECES
  // ============================================

  async multiplyContent(videoData) {
    console.log('[Maya] Starting content multiplication...');
    
    const contentPackage = {
      original: videoData,
      generated: {
        shorts: [],
        clips: [],
        tweets: [],
        threads: [],
        carousels: [],
        blogPosts: [],
        newsletters: [],
        quotes: [],
        thumbnails: [],
        scripts: []
      },
      metadata: {
        totalPieces: 0,
        platforms: [],
        timeSaved: 0
      }
    };

    // Step 1: Analyze video content
    const analysis = await this.analyzeVideo(videoData);
    
    // Step 2: Generate short-form videos
    contentPackage.generated.shorts = await this.generateShorts(analysis, 5);
    contentPackage.generated.clips = await this.generateClips(analysis, 5);
    
    // Step 3: Generate text content
    contentPackage.generated.tweets = await this.generateTweets(analysis, 5);
    contentPackage.generated.threads = await this.generateThreads(analysis, 2);
    
    // Step 4: Generate visual content
    contentPackage.generated.carousels = await this.generateCarousels(analysis, 3);
    contentPackage.generated.quotes = await this.generateQuoteGraphics(analysis, 5);
    
    // Step 5: Generate long-form
    contentPackage.generated.blogPosts = await this.generateBlogPosts(analysis, 2);
    contentPackage.generated.newsletters = await this.generateNewsletters(analysis, 1);
    
    // Step 6: Generate thumbnails/scripts
    contentPackage.generated.thumbnails = await this.generateThumbnailIdeas(analysis, 5);
    contentPackage.generated.scripts = await this.generateHookScripts(analysis, 5);

    // Calculate totals
    contentPackage.metadata.totalPieces = this.countPieces(contentPackage.generated);
    contentPackage.metadata.platforms = this.identifyPlatforms(contentPackage.generated);
    contentPackage.metadata.timeSaved = contentPackage.metadata.totalPieces * 0.5; // 30 min per piece saved

    return contentPackage;
  }

  // ============================================
  // VIDEO ANALYSIS
  // ============================================

  async analyzeVideo(videoData) {
    console.log('[Maya] Analyzing video content...');
    
    // Get transcript
    const transcript = videoData.transcript || await this.transcribeVideo(videoData.url);
    
    // Extract key moments
    const keyMoments = await this.extractKeyMoments(transcript);
    
    // Identify topics
    const topics = await this.identifyTopics(transcript);
    
    // Extract quotes
    const quotes = await this.extractQuotes(transcript);
    
    // Generate summary
    const summary = await this.generateSummary(transcript);
    
    return {
      transcript,
      keyMoments,
      topics,
      quotes,
      summary,
      videoLength: videoData.duration,
      title: videoData.title,
      hooks: this.extractHooks(transcript)
    };
  }

  // Transcribe video (placeholder - would use Whisper API)
  async transcribeVideo(videoUrl) {
    // Would use OpenAI Whisper
    return "Transcript placeholder";
  }

  // Extract key moments with timestamps
  async extractKeyMoments(transcript) {
    const prompt = `Analyze this video transcript and identify 5-7 key moments.

TRANSCRIPT:
${transcript}

For each moment provide:
1. Timestamp (estimate based on content flow)
2. What happens (brief description)
3. Why it's valuable (hook/reveal/emotional moment)
4. Best quote from that section
5. Platform best suited for (TikTok/Shorts/Reel)

Format as structured data.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return this.parseKeyMoments(completion.choices[0].message.content);
  }

  // Identify main topics
  async identifyTopics(transcript) {
    const prompt = `Extract the main topics and subtopics from this video.

TRANSCRIPT:
${transcript}

Provide:
1. Main topic (1)
2. Subtopics (3-5)
3. Related topics for SEO
4. Trending angles`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return completion.choices[0].message.content;
  }

  // Extract quotable moments
  async extractQuotes(transcript) {
    const prompt = `Extract 10 powerful quotes from this transcript.

TRANSCRIPT:
${transcript}

Select quotes that are:
- Tweetable (under 280 chars)
- Shareable (emotional/insightful)
- Controversial (spark discussion)
- Educational (provide value)

Format: "Quote" - Context`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return completion.choices[0].message.content.split('\n').filter(q => q.trim());
  }

  // Generate video summary
  async generateSummary(transcript) {
    const prompt = `Create a comprehensive summary of this video.

TRANSCRIPT:
${transcript}

Provide:
1. One-sentence hook
2. 3-paragraph summary
3. Key takeaways (5 bullet points)
4. Who should watch this
5. Why it matters now`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return completion.choices[0].message.content;
  }

  // Extract hooks from content
  extractHooks(transcript) {
    // Identify patterns that grab attention
    const hookPatterns = [
      /^(Here's|This is|Let me|I'm going to|Stop)/i,
      /\b(secret|truth|mistake|hack|tip)\b/gi,
      /\d+/g
    ];
    
    return [];
  }

  // ============================================
  // SHORT-FORM VIDEO GENERATION
  // ============================================

  // Generate YouTube Shorts / TikToks / Reels
  async generateShorts(analysis, count = 5) {
    console.log(`[Maya] Generating ${count} shorts...`);
    
    const shorts = [];
    
    for (let i = 0; i < Math.min(count, analysis.keyMoments.length); i++) {
      const moment = analysis.keyMoments[i];
      
      const short = {
        platform: 'multi',
        duration: '15-60s',
        sourceTimestamp: moment.timestamp,
        hook: await this.generateShortHook(moment),
        script: await this.generateShortScript(moment),
        caption: await this.generateShortCaption(moment, analysis.topics),
        hashtags: this.generateHashtags(analysis.topics),
        textOverlay: await this.generateTextOverlay(moment),
        callToAction: this.generateCTA('short')
      };
      
      shorts.push(short);
    }
    
    return shorts;
  }

  // Generate clip ideas (longer than shorts)
  async generateClips(analysis, count = 5) {
    console.log(`[Maya] Generating ${count} clips...`);
    
    const clips = [];
    const combinedMoments = this.combineMoments(analysis.keyMoments, count);
    
    for (const moments of combinedMoments) {
      const clip = {
        platform: 'youtube',
        duration: '2-5min',
        sourceTimestamps: moments.map(m => m.timestamp),
        title: await this.generateClipTitle(moments),
        description: await this.generateClipDescription(moments, analysis),
        thumbnailText: await this.generateThumbnailText(moments)
      };
      
      clips.push(clip);
    }
    
    return clips;
  }

  // Generate hook for short
  async generateShortHook(moment) {
    const hooks = [
      `POV: ${moment.description}`,
      `This changed everything...`,
      `Wait for it...`,
      `${moment.timestamp.split(':')[0]} seconds that will change your mind`,
      `I can't believe I'm sharing this`
    ];
    
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  // Generate short script
  async generateShortScript(moment) {
    return {
      hook: moment.description,
      value: moment.value,
      quote: moment.quote,
      cta: 'Follow for more'
    };
  }

  // Generate short caption
  async generateShortCaption(moment, topics) {
    const prompt = `Write a TikTok/Short caption for this clip.

MOMENT: ${moment.description}
QUOTE: "${moment.quote}"
TOPICS: ${topics}

Requirements:
1. Hook in first line
2. Add value/context
3. 3-5 relevant hashtags
4. Call-to-action
5. Under 150 characters total`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  }

  // ============================================
  // TEXT CONTENT GENERATION
  // ============================================

  // Generate standalone tweets
  async generateTweets(analysis, count = 5) {
    console.log(`[Maya] Generating ${count} tweets...`);
    
    const tweets = [];
    
    // Tweet types
    const types = ['insight', 'controversial', 'tip', 'story', 'question'];
    
    for (let i = 0; i < count; i++) {
      const tweet = await this.generateTweetByType(analysis, types[i]);
      tweets.push(tweet);
    }
    
    return tweets;
  }

  // Generate tweet by type
  async generateTweetByType(analysis, type) {
    const prompts = {
      insight: `Create an insightful tweet from this video content.

SUMMARY: ${analysis.summary}
QUOTE: "${analysis.quotes[0]}"

Make it thought-provoking. Add 2-3 relevant hashtags.`,

      controversial: `Create a slightly controversial/opinionated tweet from this video.

TOPICS: ${analysis.topics}

Take a stance. Spark discussion. Add 2-3 relevant hashtags.`,

      tip: `Create a "quick tip" tweet from this video content.

KEY MOMENTS: ${JSON.stringify(analysis.keyMoments.slice(0, 2))}

Make it actionable and valuable. Add 2-3 relevant hashtags.`,

      story: `Create a mini-story tweet from this video.

SUMMARY: ${analysis.summary}

Hook → Challenge → Insight. Under 280 chars.`,

      question: `Create a question tweet to engage the audience.

TOPICS: ${analysis.topics}

Ask something that makes people think or share their experience.`
    };

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompts[type] }],
      temperature: 0.7
    });

    return {
      type,
      text: completion.choices[0].message.content,
      characterCount: completion.choices[0].message.content.length
    };
  }

  // Generate Twitter threads
  async generateThreads(analysis, count = 2) {
    console.log(`[Maya] Generating ${count} threads...`);
    
    const threads = [];
    
    for (let i = 0; i < count; i++) {
      const thread = await this.generateThread(analysis, i);
      threads.push(thread);
    }
    
    return threads;
  }

  // Generate single thread
  async generateThread(analysis, index) {
    const prompt = `Create a Twitter thread from this video content.

SUMMARY: ${analysis.summary}
KEY POINTS: ${JSON.stringify(analysis.keyMoments.slice(0, 5))}

Requirements:
1. Hook tweet (must stop the scroll)
2. 5-7 value tweets (each under 280 chars)
3. Final tweet with CTA
4. Number the tweets (1/7, 2/7, etc.)
5. Make it educational and shareable`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return {
      tweets: completion.choices[0].message.content.split('\n\n').filter(t => t.trim()),
      estimatedEngagement: 'high'
    };
  }

  // ============================================
  // VISUAL CONTENT GENERATION
  // ============================================

  // Generate carousel posts (Instagram/LinkedIn)
  async generateCarousels(analysis, count = 3) {
    console.log(`[Maya] Generating ${count} carousels...`);
    
    const carousels = [];
    
    const types = ['tips', 'mistakes', 'steps', 'myths', 'lessons'];
    
    for (let i = 0; i < count; i++) {
      const carousel = await this.generateCarousel(analysis, types[i]);
      carousels.push(carousel);
    }
    
    return carousels;
  }

  // Generate single carousel
  async generateCarousel(analysis, type) {
    const templates = {
      tips: {
        title: '5 Tips from this video',
        slides: analysis.keyMoments.slice(0, 5).map(m => m.value)
      },
      mistakes: {
        title: '5 Mistakes to Avoid',
        slides: ['Mistake 1', 'Mistake 2', 'Mistake 3', 'Mistake 4', 'Solution']
      },
      steps: {
        title: 'Step-by-Step Guide',
        slides: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Results']
      }
    };

    const template = templates[type] || templates.tips;
    
    return {
      type,
      title: template.title,
      slideCount: template.slides.length,
      slides: template.slides,
      caption: await this.generateCarouselCaption(analysis, type),
      hashtags: this.generateHashtags(analysis.topics)
    };
  }

  // Generate quote graphics
  async generateQuoteGraphics(analysis, count = 5) {
    console.log(`[Maya] Generating ${count} quote graphics...`);
    
    return analysis.quotes.slice(0, count).map((quote, i) => ({
      quote,
      style: i % 2 === 0 ? 'minimal' : 'bold',
      background: i % 3 === 0 ? 'gradient' : 'image',
      platform: i % 2 === 0 ? 'instagram' : 'twitter',
      caption: `💭 ${quote.substring(0, 50)}...`,
      hashtags: ['#quotes', '#motivation', '#wisdom']
    }));
  }

  // ============================================
  // LONG-FORM CONTENT GENERATION
  // ============================================

  // Generate blog posts
  async generateBlogPosts(analysis, count = 2) {
    console.log(`[Maya] Generating ${count} blog posts...`);
    
    const posts = [];
    
    const angles = ['how-to', 'listicle', 'opinion', 'case-study'];
    
    for (let i = 0; i < count; i++) {
      const post = await this.generateBlogPost(analysis, angles[i]);
      posts.push(post);
    }
    
    return posts;
  }

  // Generate single blog post
  async generateBlogPost(analysis, angle) {
    const prompt = `Write a blog post based on this video content.

ANGLE: ${angle}
SUMMARY: ${analysis.summary}
KEY POINTS: ${JSON.stringify(analysis.keyMoments)}

Requirements:
1. SEO-optimized title (under 60 chars)
2. Hook intro (first 100 words)
3. Structured body with H2s
4. Key takeaways summary
5. Call-to-action
6. 800-1200 words
7. Include keywords naturally`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return {
      angle,
      title: this.extractTitle(completion.choices[0].message.content),
      content: completion.choices[0].message.content,
      wordCount: completion.choices[0].message.content.split(' ').length,
      estimatedReadTime: Math.ceil(completion.choices[0].message.content.split(' ').length / 200)
    };
  }

  // Generate newsletter
  async generateNewsletters(analysis, count = 1) {
    console.log(`[Maya] Generating newsletter...`);
    
    const prompt = `Create a newsletter based on this video content.

SUMMARY: ${analysis.summary}
KEY INSIGHTS: ${JSON.stringify(analysis.keyMoments.slice(0, 3))}

Requirements:
1. Subject line (high open rate)
2. Personal greeting
3. Brief personal intro
4. Main content (key insight from video)
5. Additional resources/links
6. P.S. with question/CTA
7. Conversational, friendly tone`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return [{
      subject: this.extractSubject(completion.choices[0].message.content),
      content: completion.choices[0].message.content,
      sections: ['intro', 'main', 'resources', 'cta']
    }];
  }

  // ============================================
  // THUMBNAILS & SCRIPTS
  // ============================================

  // Generate thumbnail ideas
  async generateThumbnailIdeas(analysis, count = 5) {
    console.log(`[Maya] Generating thumbnail ideas...`);
    
    const ideas = [];
    const styles = ['reaction', 'comparison', 'list', 'question', 'controversial'];
    
    for (let i = 0; i < count; i++) {
      const idea = await this.generateThumbnailIdea(analysis, styles[i]);
      ideas.push(idea);
    }
    
    return ideas;
  }

  // Generate single thumbnail idea
  async generateThumbnailIdea(analysis, style) {
    const prompts = {
      reaction: `Create a reaction-style thumbnail concept.

MAIN POINT: ${analysis.keyMoments[0]?.description}

Concept: Face + shocking element + text overlay`,

      comparison: `Create a before/after comparison thumbnail concept.

TOPIC: ${analysis.topics}

Concept: Split screen + contrasting elements`,

      list: `Create a listicle thumbnail concept.

KEY POINTS: ${JSON.stringify(analysis.keyMoments.slice(0, 3))}

Concept: Number + text + visual element`,

      question: `Create a question-based thumbnail concept.

HOOK: ${analysis.hooks[0]}

Concept: Question text + curious expression`,

      controversial: `Create a controversial thumbnail concept.

TOPIC: ${analysis.topics}

Concept: Bold statement + red accents`
    };

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompts[style]] }],
      temperature: 0.8
    });

    return {
      style,
      concept: completion.choices[0].message.content,
      textOverlay: this.extractTextOverlay(completion.choices[0].message.content),
      colors: this.suggestColors(style)
    };
  }

  // Generate hook scripts
  async generateHookScripts(analysis, count = 5) {
    console.log(`[Maya] Generating hook scripts...`);
    
    const hooks = [];
    const types = ['curiosity', 'problem', 'story', 'shock', 'value'];
    
    for (let i = 0; i < count; i++) {
      const hook = await this.generateHookScript(analysis, types[i]);
      hooks.push(hook);
    }
    
    return hooks;
  }

  // Generate single hook script
  async generateHookScript(analysis, type) {
    const templates = {
      curiosity: 'I discovered something that changed everything...',
      problem: 'Stop doing this immediately...',
      story: 'Three years ago, I made a mistake that...',
      shock: 'Nobody is talking about this...',
      value: 'Here\'s how to [achieve result] in [timeframe]...'
    };

    return {
      type,
      script: templates[type],
      duration: '0-3 seconds',
      tone: type === 'shock' ? 'urgent' : 'intriguing'
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  combineMoments(moments, count) {
    const combined = [];
    const groupSize = Math.ceil(moments.length / count);
    
    for (let i = 0; i < count; i++) {
      combined.push(moments.slice(i * groupSize, (i + 1) * groupSize));
    }
    
    return combined;
  }

  countPieces(generated) {
    return Object.values(generated).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  }

  identifyPlatforms(generated) {
    const platforms = new Set(['youtube', 'tiktok', 'instagram', 'twitter', 'blog', 'newsletter']);
    return Array.from(platforms);
  }

  generateHashtags(topics) {
    return ['#contentcreator', '#growth', '#creatorlife'];
  }

  generateCTA(platform) {
    const ctas = {
      short: 'Follow for Part 2',
      video: 'Subscribe for more',
      text: 'What do you think? Comment below'
    };
    return ctas[platform] || ctas.video;
  }

  generateTextOverlay(moment) {
    return moment.description.substring(0, 30) + '...';
  }

  async generateClipTitle(moments) {
    return `The Truth About ${moments[0]?.description?.substring(0, 30)}`;
  }

  async generateClipDescription(moments, analysis) {
    return `This clip from our latest video covers ${moments.length} key insights about ${analysis.topics}`;
  }

  async generateThumbnailText(moments) {
    return moments[0]?.description?.substring(0, 10);
  }

  async generateCarouselCaption(analysis, type) {
    return `Save this! Which tip was most helpful? 👇`;
  }

  extractTitle(content) {
    const lines = content.split('\n');
    return lines.find(l => l.trim() && !l.includes('#')) || 'Untitled';
  }

  extractSubject(content) {
    const lines = content.split('\n');
    return lines[0].replace('Subject:', '').trim();
  }

  extractTextOverlay(concept) {
    return concept.substring(0, 50);
  }

  suggestColors(style) {
    const colors = {
      reaction: ['red', 'yellow', 'black'],
      comparison: ['blue', 'green', 'white'],
      list: ['purple', 'orange', 'white'],
      question: ['teal', 'coral', 'navy'],
      controversial: ['red', 'black', 'white']
    };
    return colors[style] || colors.reaction;
  }

  parseKeyMoments(content) {
    // Parse structured key moments
    return [];
  }
}

module.exports = MayaAgentV2;
