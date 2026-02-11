// ============================================
// ENGAGE - AI Community Manager for Creators
// Manages comments, DMs, and audience engagement
// ============================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================
// ENGAGE AGENT CLASS
// ============================================
class EngageAgent {
  constructor(creatorId) {
    this.creatorId = creatorId;
    this.creatorProfile = null;
    this.voiceStyle = null;
  }

  // Initialize agent with creator profile
  async initialize() {
    const { data: profile, error } = await supabase
      .from('engage_profiles')
      .select('*')
      .eq('creator_id', this.creatorId)
      .single();

    if (error) throw new Error(`Profile not found: ${error.message}`);
    
    this.creatorProfile = profile;
    this.voiceStyle = profile.voice_style || this.getDefaultVoiceStyle();
    
    console.log(`✅ Engage initialized for ${profile.platform} creator: ${profile.handle}`);
    return this;
  }

  // ============================================
  // COMMENT MANAGEMENT
  // ============================================

  // Process new comments from YouTube/TikTok/IG
  async processComments(platform, videoId, comments) {
    const replies = [];
    
    for (const comment of comments) {
      // Skip spam/toxic comments
      if (this.isSpam(comment.text)) {
        await this.markAsSpam(comment.id);
        continue;
      }

      // Check if needs human attention
      if (this.needsHumanAttention(comment)) {
        await this.notifyCreator(comment);
        continue;
      }

      // Generate reply
      const reply = await this.generateReply(comment, 'comment');
      
      // Store and queue for posting
      await this.storeReply({
        original_comment_id: comment.id,
        platform: platform,
        video_id: videoId,
        reply_text: reply,
        status: 'pending_approval',
        created_at: new Date().toISOString()
      });

      replies.push({
        commentId: comment.id,
        reply: reply,
        autoPost: this.shouldAutoPost(comment)
      });
    }

    return replies;
  }

  // Generate contextual reply
  async generateReply(comment, type = 'comment') {
    const systemPrompt = `You are ${this.creatorProfile.name}, a content creator on ${this.creatorProfile.platform}.
    
Your voice style:
${this.voiceStyle}

Guidelines:
- Keep replies under 150 characters for TikTok/IG, under 500 for YouTube
- Use emojis naturally (1-2 per reply max)
- Be authentic and personal
- Ask questions to drive engagement
- Never be defensive or argumentative
- Match the energy of the comment
- Don't use hashtags in replies
- Sign off naturally (no "- [name]" signatures)

Comment to reply to: "${comment.text}"
Commenter: @${comment.author}
Your video context: ${comment.videoContext || 'General content'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a reply to this ${type}:` }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();
  }

  // ============================================
  // DM MANAGEMENT
  // ============================================

  // Process DMs and identify opportunities
  async processDMs(dms) {
    const results = [];

    for (const dm of dms) {
      // Check if it's a brand deal inquiry
      if (this.isBrandDealInquiry(dm)) {
        await this.handleBrandDealInquiry(dm);
        results.push({ type: 'brand_deal_alert', dm });
        continue;
      }

      // Check if it's collaboration request
      if (this.isCollabRequest(dm)) {
        await this.handleCollabRequest(dm);
        results.push({ type: 'collab_alert', dm });
        continue;
      }

      // Generate reply for general DMs
      const reply = await this.generateReply(dm, 'dm');
      
      await this.storeDMReply({
        dm_id: dm.id,
        sender: dm.sender,
        platform: dm.platform,
        original_message: dm.text,
        reply_text: reply,
        status: 'pending_approval'
      });

      results.push({ type: 'general_reply', dm, reply });
    }

    return results;
  }

  // Detect brand deal inquiries
  isBrandDealInquiry(dm) {
    const keywords = [
      'brand deal', 'sponsored', 'collaboration', 'partnership',
      'promote', 'endorsement', 'affiliate', 'brand ambassador',
      'paid promotion', 'ad', 'marketing', 'promote our',
      'interested in working', 'feature our', 'review our'
    ];
    
    const text = dm.text.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  }

  // Handle brand deal inquiry
  async handleBrandDealInquiry(dm) {
    // Extract brand info
    const brandInfo = this.extractBrandInfo(dm);
    
    // Store in opportunities table
    await supabase.from('engage_opportunities').insert({
      creator_id: this.creatorId,
      type: 'brand_deal',
      platform: dm.platform,
      sender: dm.sender,
      message: dm.text,
      brand_name: brandInfo.name,
      estimated_value: this.estimateDealValue(dm),
      status: 'new',
      created_at: new Date().toISOString()
    });

    // Alert creator immediately
    await this.notifyCreator({
      type: 'brand_deal',
      urgency: 'high',
      message: `🚨 Brand deal inquiry from ${brandInfo.name || dm.sender}!`,
      dm: dm
    });
  }

  // ============================================
  // ENGAGEMENT STRATEGY
  // ============================================

  // Find and engage with target audience
  async findEngagementTargets() {
    const strategy = this.creatorProfile.engagement_strategy;
    
    // Find similar creators' followers
    const targets = await this.findSimilarAccountsFollowers(strategy.target_accounts);
    
    // Engage strategically
    for (const target of targets.slice(0, strategy.daily_engagement_limit)) {
      const shouldEngage = await this.shouldEngageWith(target);
      
      if (shouldEngage) {
        const engagement = await this.generateEngagement(target);
        await this.queueEngagement(target, engagement);
      }
    }
  }

  // Generate strategic engagement (comment on others' content)
  async generateEngagement(targetAccount) {
    const systemPrompt = `You are ${this.creatorProfile.name} engaging with @${targetAccount.handle}'s content.
    
Voice: ${this.voiceStyle}

Generate a thoughtful comment that:
- Shows genuine interest in their content
- Adds value to the conversation
- Could lead to a connection/collaboration
- Is NOT spammy or self-promotional
- Matches their content vibe`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate an engaging comment for this content: ${targetAccount.recentContent}` }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  }

  // ============================================
  // SMART FILTERS
  // ============================================

  isSpam(text) {
    const spamPatterns = [
      /check my (bio|profile|link)/i,
      /follow (me|back)/i,
      /\$\$\$|\b\d{4,}\b.*\b\d{4,}\b/, // Money scams
      /(click here|link in bio).*\b(?:crypto|bitcoin|nft)\b/i,
      /(free|win).*(iphone|macbook|gift card)/i
    ];
    return spamPatterns.some(pattern => pattern.test(text));
  }

  needsHumanAttention(comment) {
    const triggers = [
      'lawyer', 'lawsuit', 'legal', 'copyright', 'cease and desist',
      'death threat', 'suicide', 'self harm', 'urgent', 'emergency',
      'manager', 'agent', 'publicist'
    ];
    
    const text = comment.text.toLowerCase();
    return triggers.some(t => text.includes(t));
  }

  shouldAutoPost(comment) {
    // Auto-post if:
    // - Comment is positive
    // - No controversial topics
    // - Creator has enabled auto-reply
    return this.creatorProfile.auto_reply_enabled && 
           this.isPositiveComment(comment) &&
           !this.containsControversy(comment.text);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  getDefaultVoiceStyle() {
    return `Friendly and approachable
Uses casual language but stays professional
Responds with enthusiasm and gratitude
Asks follow-up questions to keep conversation going
Uses humor when appropriate
Shows appreciation for fans`;
  }

  async storeReply(replyData) {
    await supabase.from('engage_replies').insert(replyData);
  }

  async storeDMReply(dmData) {
    await supabase.from('engage_dm_replies').insert(dmData);
  }

  async notifyCreator(notification) {
    // Send to creator's notification channel (Telegram, email, etc.)
    console.log(`📧 Notifying creator: ${notification.message}`);
    // Implementation depends on notification preferences
  }

  async markAsSpam(commentId) {
    await supabase.from('engage_comments').update({
      is_spam: true,
      processed_at: new Date().toISOString()
    }).eq('id', commentId);
  }

  extractBrandInfo(dm) {
    // Extract brand name from DM
    const lines = dm.text.split('\n');
    const firstLine = lines[0];
    
    // Look for company indicators
    const companyMatch = firstLine.match(/from\s+([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
    return {
      name: companyMatch ? companyMatch[1].trim() : null
    };
  }

  estimateDealValue(dm) {
    const text = dm.text.toLowerCase();
    
    if (text.includes('long term') || text.includes('ambassador')) return '$5000+';
    if (text.includes('campaign') || text.includes('series')) return '$2000-5000';
    if (text.includes('video') || text.includes('post')) return '$500-2000';
    return '$100-500';
  }

  isCollabRequest(dm) {
    const keywords = ['collab', 'collaborate', 'feature together', 'duet', 'stitch', 'guest'];
    const text = dm.text.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  }

  async handleCollabRequest(dm) {
    await supabase.from('engage_opportunities').insert({
      creator_id: this.creatorId,
      type: 'collaboration',
      platform: dm.platform,
      sender: dm.sender,
      message: dm.text,
      status: 'new'
    });

    await this.notifyCreator({
      type: 'collaboration',
      urgency: 'medium',
      message: `🤝 Collaboration request from ${dm.sender}!`,
      dm: dm
    });
  }

  isPositiveComment(comment) {
    // Simple sentiment check
    const positiveWords = ['love', 'great', 'awesome', 'amazing', 'best', 'perfect', 'thank'];
    const text = comment.text.toLowerCase();
    return positiveWords.some(w => text.includes(w));
  }

  containsControversy(text) {
    const controversial = ['politics', 'religion', 'controversial', 'drama', 'beef', 'cancel'];
    const lowerText = text.toLowerCase();
    return controversial.some(c => lowerText.includes(c));
  }

  async findSimilarAccountsFollowers(targetAccounts) {
    // This would integrate with platform APIs
    // Placeholder for actual implementation
    return [];
  }

  async shouldEngageWith(target) {
    // Check engagement history to avoid over-engaging
    const { data } = await supabase
      .from('engage_history')
      .select('*')
      .eq('target_handle', target.handle)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return !data || data.length === 0;
  }

  async queueEngagement(target, engagement) {
    await supabase.from('engage_queue').insert({
      creator_id: this.creatorId,
      target_handle: target.handle,
      target_content: target.recentContent,
      engagement_text: engagement,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }
}

// ============================================
// API ENDPOINTS (for integration)
// ============================================

// Webhook handler for new comments
async function handleCommentWebhook(req, res) {
  const { platform, videoId, comments, creatorId } = req.body;
  
  try {
    const engage = new EngageAgent(creatorId);
    await engage.initialize();
    
    const replies = await engage.processComments(platform, videoId, comments);
    
    res.json({
      success: true,
      processed: comments.length,
      replies: replies
    });
  } catch (error) {
    console.error('Engage error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Webhook handler for DMs
async function handleDMWebhook(req, res) {
  const { dms, creatorId } = req.body;
  
  try {
    const engage = new EngageAgent(creatorId);
    await engage.initialize();
    
    const results = await engage.processDMs(dms);
    
    res.json({
      success: true,
      processed: dms.length,
      results: results
    });
  } catch (error) {
    console.error('DM processing error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// TESTING
// ============================================

async function testEngage() {
  console.log('🧪 Testing Engage Agent...\n');
  
  // Test comment processing
  const testComments = [
    {
      id: '1',
      author: 'fan123',
      text: 'This video was amazing! How long did it take to edit? 🔥',
      videoContext: 'Tutorial video about video editing'
    },
    {
      id: '2',
      author: 'brand_marketing',
      text: 'Hi! We love your content. Would you be interested in a brand partnership? Please check your DMs!',
      videoContext: 'General content'
    },
    {
      id: '3',
      author: 'spammer',
      text: 'Check my bio for free crypto! Make $$$ fast! 💰💰💰',
      videoContext: 'General content'
    }
  ];
  
  console.log('Test comments:', testComments);
  
  // Test DM processing
  const testDMs = [
    {
      id: 'dm1',
      sender: 'nike_marketing',
      platform: 'instagram',
      text: 'Hey! Love your fitness content. We\'re interested in a long-term brand ambassador partnership. Budget is $10K/month. Let us know!'
    },
    {
      id: 'dm2',
      sender: 'cool_creator',
      platform: 'tiktok',
      text: 'Your videos are dope! Want to collab on a duet? I think our audiences would love it!'
    }
  ];
  
  console.log('\nTest DMs:', testDMs);
  console.log('\n✅ Engage Agent structure ready!');
  console.log('📋 Next: Set up database tables and API endpoints');
}

// Run test if called directly
if (require.main === module) {
  testEngage();
}

module.exports = { EngageAgent, handleCommentWebhook, handleDMWebhook };
