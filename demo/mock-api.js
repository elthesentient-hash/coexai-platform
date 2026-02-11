// ============================================
// COEXAI DEMO API - Simulated Backend
// No real auth/payments needed - just for demo!
// ============================================

// Demo user data
const demoUser = {
  id: 'demo-user-123',
  email: 'demo@coexai.com',
  full_name: 'Demo Creator',
  plan: 'growth',
  status: 'active',
  trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString()
};

// Demo session
let demoSession = null;

// Demo platforms
let demoPlatforms = {
  youtube: {
    connected: false,
    channel_name: null,
    subscriber_count: 0,
    loading: false
  },
  tiktok: {
    connected: false,
    channel_name: null,
    follower_count: 0,
    loading: false
  },
  instagram: {
    connected: false,
    channel_name: null,
    follower_count: 0,
    loading: false
  },
  twitter: {
    connected: false,
    channel_name: null,
    follower_count: 0,
    loading: false
  }
};

// Mock API responses
const mockAPI = {
  
  // Auth endpoints
  async register(email, password, name, plan) {
    console.log('📝 [DEMO] Registering:', { email, name, plan });
    
    // Simulate network delay
    await delay(1500);
    
    // Create demo session
    demoSession = {
      access_token: 'demo-token-' + Date.now(),
      user: {
        ...demoUser,
        email,
        full_name: name,
        plan
      }
    };
    
    // Store in localStorage
    localStorage.setItem('coexai_demo_session', JSON.stringify(demoSession));
    
    return {
      success: true,
      user: demoSession.user,
      session: demoSession,
      message: 'Account created! (Demo mode - no email sent)'
    };
  },
  
  async login(email, password) {
    console.log('🔑 [DEMO] Logging in:', email);
    
    await delay(1000);
    
    demoSession = {
      access_token: 'demo-token-' + Date.now(),
      user: demoUser
    };
    
    localStorage.setItem('coexai_demo_session', JSON.stringify(demoSession));
    
    return {
      success: true,
      user: demoUser,
      session: demoSession
    };
  },
  
  async getMe() {
    const session = JSON.parse(localStorage.getItem('coexai_demo_session'));
    if (!session) {
      throw new Error('Not authenticated');
    }
    return {
      success: true,
      user: session.user
    };
  },
  
  // Platform connections
  async connectPlatform(platform) {
    console.log('🔗 [DEMO] Connecting', platform);
    
    await delay(2000);
    
    // Simulate OAuth popup (in real app this opens OAuth window)
    const mockChannels = {
      youtube: { name: 'Demo Creator', subscribers: 450000 },
      tiktok: { name: '@democreator', followers: 320000 },
      instagram: { name: '@democreator', followers: 280000 },
      twitter: { name: '@democreator', followers: 190000 }
    };
    
    demoPlatforms[platform] = {
      connected: true,
      channel_name: mockChannels[platform].name,
      subscriber_count: mockChannels[platform].subscribers || mockChannels[platform].followers,
      loading: false
    };
    
    return {
      success: true,
      platform: demoPlatforms[platform]
    };
  },
  
  async getPlatforms() {
    await delay(500);
    return {
      connections: Object.entries(demoPlatforms)
        .filter(([_, data]) => data.connected)
        .map(([platform, data]) => ({
          platform,
          channel_name: data.channel_name,
          subscriber_count: data.subscriber_count
        }))
    };
  },
  
  // Payments
  async createCheckout(priceId) {
    console.log('💳 [DEMO] Creating checkout for:', priceId);
    
    await delay(1500);
    
    // Simulate Stripe checkout
    return {
      success: true,
      url: '#demo-checkout',
      message: 'Demo: In real app, this would redirect to Stripe checkout'
    };
  },
  
  // AI Agent actions
  async processVideo(videoUrl) {
    console.log('🎥 [DEMO] Processing video:', videoUrl);
    
    await delay(3000);
    
    return {
      success: true,
      videoId: 'demo-' + Date.now(),
      contentPieces: [
        { type: 'tiktok', title: 'Viral hook #1', script: 'You won\'t believe what happened when...' },
        { type: 'tiktok', title: 'Viral hook #2', script: 'POV: You discovered the secret to...' },
        { type: 'youtube_shorts', title: 'Shorts version', script: 'Quick summary of the main points...' },
        { type: 'instagram', title: 'Reels caption', script: 'Double tap if you agree! 👇' },
        { type: 'twitter', title: 'Thread starter', script: 'Here\'s a breakdown of what I learned...' }
      ],
      trendingSounds: ['Original Sound - Creator', 'Trending Audio 2025', 'Viral Beat']
    };
  },
  
  async getComments(platform) {
    await delay(800);
    
    const mockComments = [
      { id: 1, author: 'fan1', text: 'This is amazing! 🔥', likes: 45 },
      { id: 2, author: 'user2', text: 'How long did this take to make?', likes: 12 },
      { id: 3, author: 'brand_marketing', text: 'Love your content! Interested in collab?', likes: 3 },
      { id: 4, author: 'viewer3', text: 'First time seeing your content, instant sub!', likes: 28 },
      { id: 5, author: 'fan2', text: 'Can you make a part 2?', likes: 67 }
    ];
    
    return { comments: mockComments };
  },
  
  async replyToComment(commentId, reply) {
    console.log('💬 [DEMO] Replying to comment:', commentId, reply);
    await delay(500);
    return { success: true, replyId: 'reply-' + Date.now() };
  },
  
  async findBrandDeals() {
    await delay(1500);
    
    return {
      deals: [
        {
          id: 'deal-1',
          brand: 'Nike',
          budget: '$5,000',
          description: 'Looking for fitness creators for new campaign',
          match: 95,
          deadline: '2025-03-01'
        },
        {
          id: 'deal-2',
          brand: 'HelloFresh',
          budget: '$3,500',
          description: 'Cooking/Lifestyle content partnership',
          match: 88,
          deadline: '2025-02-28'
        },
        {
          id: 'deal-3',
          brand: 'Skillshare',
          budget: '$2,000',
          description: 'Online learning platform promotion',
          match: 82,
          deadline: '2025-03-15'
        }
      ]
    };
  },
  
  // Dashboard stats
  async getDashboardStats() {
    await delay(600);
    
    return {
      timeSaved: 28.5,
      contentCreated: 147,
      commentsReplied: 1284,
      brandDealsFound: 12500,
      followersGained: 12400,
      engagementRate: 23,
      
      recentActivity: [
        {
          id: 1,
          type: 'content',
          title: 'Maya processed new video',
          description: 'Generated 20 content pieces',
          time: '2 min ago'
        },
        {
          id: 2,
          type: 'engagement',
          title: 'Engage replied to 47 comments',
          description: 'On your latest TikTok video',
          time: '15 min ago'
        },
        {
          id: 3,
          type: 'brand_deal',
          title: '🚨 Brand deal opportunity',
          description: 'Nike interested in collaboration ($5K budget)',
          time: '1 hour ago'
        },
        {
          id: 4,
          type: 'growth',
          title: 'Engagement rate increased',
          description: '+23% this week vs last week',
          time: '3 hours ago'
        },
        {
          id: 5,
          type: 'growth',
          title: 'Gained 1,247 new followers',
          description: 'Across all platforms today',
          time: '5 hours ago'
        }
      ]
    };
  }
};

// Utility function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in other files
window.mockAPI = mockAPI;
window.DEMO_MODE = true;

console.log('🎮 [DEMO MODE] Mock API loaded! All functions will work without real backend.');
console.log('Try: mockAPI.register("you@example.com", "password", "Your Name", "growth")');
