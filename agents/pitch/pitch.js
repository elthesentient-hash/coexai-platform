// ============================================
// PITCH - AI Brand Deal Hunter for Creators
// Finds, pitches, and negotiates sponsorships automatically
// ============================================

require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

class PitchAgent {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.creatorId = config.creatorId;
    this.creatorProfile = null;
    this.brandDatabase = [];
    this.outreachHistory = [];
  }

  // Initialize with creator profile
  async initialize(creatorProfile) {
    this.creatorProfile = {
      niche: creatorProfile.niche,
      platforms: creatorProfile.platforms, // YouTube, TikTok, IG, etc.
      followers: creatorProfile.followers,
      engagementRate: creatorProfile.engagementRate,
      avgViews: creatorProfile.avgViews,
      audienceDemo: creatorProfile.audienceDemo,
      pastBrands: creatorProfile.pastBrands || [],
      contentStyle: creatorProfile.contentStyle,
      rateCard: creatorProfile.rateCard || {},
      email: creatorProfile.email,
      portfolio: creatorProfile.portfolio
    };
    
    console.log(`✅ Pitch initialized for ${creatorProfile.niche} creator`);
    return this;
  }

  // ============================================
  // BRAND DISCOVERY
  // ============================================

  // Find brands looking for creators
  async discoverBrands() {
    console.log('[Pitch] Discovering brand opportunities...');
    
    const opportunities = [];
    
    // 1. Scrape influencer marketing platforms
    const platformBrands = await this.scrapeInfluencerPlatforms();
    opportunities.push(...platformBrands);
    
    // 2. Find brands actively spending on creator ads
    const adSpenders = await this.findAdSpendingBrands();
    opportunities.push(...adSpenders);
    
    // 3. Find brands in creator's niche
    const nicheBrands = await this.findNicheBrands();
    opportunities.push(...nicheBrands);
    
    // 4. Find brands working with similar creators
    const competitorBrands = await this.findCompetitorBrands();
    opportunities.push(...competitorBrands);
    
    // Score and rank opportunities
    const scoredOpportunities = opportunities.map(opp => ({
      ...opp,
      matchScore: this.calculateBrandMatch(opp),
      estimatedDealSize: this.estimateDealSize(opp),
      priority: this.calculatePriority(opp)
    })).sort((a, b) => b.priority - a.priority);
    
    return scoredOpportunities.slice(0, 20); // Top 20 opportunities
  }

  // Scrape influencer marketing platforms
  async scrapeInfluencerPlatforms() {
    const platforms = [
      'grin.co', 'upfluence.com', 'creator.co', 'aspire.io',
      'impact.com', 'traackr.com', 'klear.com'
    ];
    
    // Placeholder - would scrape actual platforms
    return [
      {
        brand: 'Example Fitness Brand',
        platform: 'grin.co',
        budget: '$50K-100K',
        lookingFor: 'Fitness creators 100K-500K followers',
        campaignType: 'Sponsored content',
        match: 'high'
      }
    ];
  }

  // Find brands spending on creator ads
  async findAdSpendingBrands() {
    // Analyze social media for #ad posts in creator's niche
    // Find brands running ongoing campaigns
    return [];
  }

  // Find brands in creator's niche
  async findNicheBrands() {
    const niche = this.creatorProfile.niche;
    
    // Query brand databases, industry reports
    const nicheKeywords = {
      'fitness': ['supplements', 'activewear', 'fitness apps', 'gym equipment'],
      'beauty': ['skincare', 'makeup', 'hair care', 'beauty tools'],
      'tech': ['software', 'apps', 'gadgets', 'productivity tools'],
      'finance': ['fintech', 'trading apps', 'banking', 'crypto'],
      'food': ['meal kits', 'snacks', 'kitchen gadgets', 'restaurants'],
      'fashion': ['clothing', 'accessories', 'shoes', 'jewelry'],
      'gaming': ['game publishers', 'hardware', 'peripherals', 'energy drinks'],
      'travel': ['hotels', 'airlines', 'travel apps', 'luggage']
    };
    
    return [];
  }

  // Find brands working with similar creators
  async findCompetitorBrands() {
    // Look at brands sponsoring similar-sized creators in same niche
    return [];
  }

  // ============================================
  // OUTREACH & PITCHING
  // ============================================

  // Generate personalized pitch
  async generatePitch(brand) {
    console.log(`[Pitch] Generating pitch for ${brand.name}...`);
    
    const prompt = `Create a compelling brand partnership pitch email.

CREATOR PROFILE:
- Niche: ${this.creatorProfile.niche}
- Platforms: ${this.creatorProfile.platforms.join(', ')}
- Followers: ${JSON.stringify(this.creatorProfile.followers)}
- Engagement: ${this.creatorProfile.engagementRate}%
- Avg Views: ${JSON.stringify(this.creatorProfile.avgViews)}
- Audience: ${this.creatorProfile.audienceDemo}
- Past Brands: ${this.creatorProfile.pastBrands.join(', ')}
- Content Style: ${this.creatorProfile.contentStyle}

BRAND TO PITCH:
- Name: ${brand.name}
- Industry: ${brand.industry}
- Recent Campaigns: ${brand.recentCampaigns}
- Target Audience: ${brand.targetAudience}
- Budget Range: ${brand.budget}

Create:
1. Subject line (catchy, not spammy)
2. Opening hook (personalized, researched)
3. Value proposition (why this creator fits)
4. Social proof (metrics, past results)
5. Proposal (content ideas, deliverables)
6. Rate card reference
7. Clear CTA

Tone: Professional but authentic to creator's voice.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return {
      subject: this.extractSubject(completion.choices[0].message.content),
      body: completion.choices[0].message.content,
      brand: brand.name,
      generatedAt: new Date().toISOString()
    };
  }

  // Send pitch email
  async sendPitch(brand, pitchEmail) {
    console.log(`[Pitch] Sending pitch to ${brand.contactEmail}...`);
    
    // Integration with email service (SendGrid, etc.)
    const emailData = {
      to: brand.contactEmail,
      from: this.creatorProfile.email,
      subject: pitchEmail.subject,
      html: pitchEmail.body,
      replyTo: this.creatorProfile.email
    };
    
    // Log outreach
    this.outreachHistory.push({
      brand: brand.name,
      sentAt: new Date().toISOString(),
      status: 'sent',
      followUpCount: 0
    });
    
    return { success: true, messageId: Date.now().toString() };
  }

  // ============================================
  // NEGOTIATION
  // ============================================

  // Analyze incoming offer
  async analyzeOffer(offerDetails) {
    console.log('[Pitch] Analyzing brand offer...');
    
    const analysis = {
      brand: offerDetails.brand,
      deliverables: offerDetails.deliverables,
      offeredRate: offerDetails.compensation,
      marketRate: this.calculateMarketRate(offerDetails.deliverables),
      isFair: false,
      negotiationStrategy: null,
      counterOffer: null
    };
    
    // Compare to creator's rate card
    const expectedRate = this.getRateForDeliverables(offerDetails.deliverables);
    
    if (offerDetails.compensation >= expectedRate * 0.9) {
      analysis.isFair = true;
      analysis.recommendation = 'Accept - rate is fair';
    } else {
      analysis.isFair = false;
      analysis.recommendation = 'Negotiate - offer below market rate';
      analysis.counterOffer = expectedRate;
      analysis.negotiationStrategy = await this.generateNegotiationStrategy(offerDetails);
    }
    
    return analysis;
  }

  // Generate negotiation response
  async generateNegotiationStrategy(offerDetails) {
    const prompt = `Create a professional negotiation response.

CURRENT OFFER:
- Brand: ${offerDetails.brand}
- Deliverables: ${JSON.stringify(offerDetails.deliverables)}
- Offered: $${offerDetails.compensation}
- Expected: $${this.getRateForDeliverables(offerDetails.deliverables)}

CREATOR VALUE:
- Engagement Rate: ${this.creatorProfile.engagementRate}%
- Past Results: ${JSON.stringify(this.creatorProfile.pastResults)}
- Unique Value: ${this.creatorProfile.uniqueValue}

Write a polite but firm negotiation email that:
1. Thanks them for the opportunity
2. Explains why the rate doesn't match the value
3. Provides data/supporting evidence
4. Makes a counter-offer with justification
5. Leaves room for compromise
6. Maintains positive relationship`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return completion.choices[0].message.content;
  }

  // ============================================
  // DEAL MANAGEMENT
  // ============================================

  // Track all active deals
  async getActiveDeals() {
    return this.outreachHistory.filter(d => 
      d.status === 'negotiating' || d.status === 'contract_sent'
    );
  }

  // Follow up on pending pitches
  async sendFollowUps() {
    const pendingPitches = this.outreachHistory.filter(d => 
      d.status === 'sent' && 
      d.followUpCount < 3 &&
      this.daysSince(d.sentAt) > 3
    );
    
    for (const pitch of pendingPitches) {
      await this.sendFollowUpEmail(pitch);
      pitch.followUpCount++;
      pitch.lastFollowUp = new Date().toISOString();
    }
    
    return pendingPitches.length;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  calculateBrandMatch(brand) {
    let score = 0;
    
    // Niche alignment
    if (brand.industry.toLowerCase().includes(this.creatorProfile.niche.toLowerCase())) {
      score += 30;
    }
    
    // Budget fit
    if (brand.budget && this.isBudgetCompatible(brand.budget)) {
      score += 25;
    }
    
    // Past brand similarity
    if (this.creatorProfile.pastBrands.some(pb => 
      brand.name.toLowerCase().includes(pb.toLowerCase())
    )) {
      score += 20;
    }
    
    // Audience alignment
    if (brand.targetAudience && this.audienceMatches(brand.targetAudience)) {
      score += 25;
    }
    
    return score;
  }

  estimateDealSize(brand) {
    const baseRate = this.creatorProfile.followers['instagram'] > 100000 ? 1000 : 500;
    const engagementMultiplier = this.creatorProfile.engagementRate / 2;
    
    return Math.round(baseRate * engagementMultiplier);
  }

  calculatePriority(brand) {
    return this.calculateBrandMatch(brand) * this.estimateDealSize(brand);
  }

  getRateForDeliverables(deliverables) {
    const rates = {
      'instagram_post': 500,
      'instagram_story': 200,
      'instagram_reel': 800,
      'youtube_video': 2000,
      'youtube_short': 500,
      'tiktok_video': 600,
      'twitter_post': 100,
      'blog_post': 1000,
      'newsletter': 800
    };
    
    let total = 0;
    for (const [type, count] of Object.entries(deliverables)) {
      total += (rates[type] || 300) * count;
    }
    
    // Adjust for follower size
    const multiplier = Math.max(1, this.creatorProfile.followers['instagram'] / 100000);
    return Math.round(total * multiplier);
  }

  calculateMarketRate(deliverables) {
    // Industry benchmark data
    return this.getRateForDeliverables(deliverables) * 1.1; // 10% premium
  }

  extractSubject(emailBody) {
    const lines = emailBody.split('\n');
    return lines[0].replace('Subject:', '').trim();
  }

  isBudgetCompatible(budget) {
    // Parse budget ranges like "$10K-50K"
    return true; // Simplified
  }

  audienceMatches(targetAudience) {
    // Compare audience demographics
    return true; // Simplified
  }

  daysSince(date) {
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  }
}

module.exports = PitchAgent;
