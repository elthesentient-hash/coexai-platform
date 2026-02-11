-- ============================================
-- ENGAGE AGENT - Database Schema
-- Community Manager for Content Creators
-- ============================================

-- Creator profile for Engage
CREATE TABLE IF NOT EXISTS engage_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'twitter')),
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  voice_style TEXT,
  auto_reply_enabled BOOLEAN DEFAULT false,
  daily_engagement_limit INTEGER DEFAULT 20,
  engagement_strategy JSONB DEFAULT '{
    "target_accounts": [],
    "keywords": [],
    "engagement_style": "friendly"
  }'::jsonb,
  notification_preferences JSONB DEFAULT '{
    "brand_deals": true,
    "collabs": true,
    "controversial": true,
    "daily_digest": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments from all platforms
CREATE TABLE IF NOT EXISTS engage_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  video_id TEXT NOT NULL,
  comment_id TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  author_id TEXT,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_spam BOOLEAN DEFAULT false,
  needs_attention BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated replies
CREATE TABLE IF NOT EXISTS engage_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_comment_id UUID REFERENCES engage_comments(id),
  platform TEXT NOT NULL,
  video_id TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'posted', 'rejected')),
  posted_at TIMESTAMPTZ,
  engagement_score INTEGER, -- Track how well the reply performed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DMs from all platforms
CREATE TABLE IF NOT EXISTS engage_dms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  dm_id TEXT NOT NULL UNIQUE,
  sender TEXT NOT NULL,
  sender_id TEXT,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  category TEXT CHECK (category IN ('brand_deal', 'collab', 'fan', 'spam', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated DM replies
CREATE TABLE IF NOT EXISTS engage_dm_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES engage_dms(id),
  original_message TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'sent', 'rejected')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand deals and collaboration opportunities
CREATE TABLE IF NOT EXISTS engage_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('brand_deal', 'collaboration', 'event', 'other')),
  platform TEXT NOT NULL,
  sender TEXT NOT NULL,
  brand_name TEXT,
  message TEXT NOT NULL,
  estimated_value TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'negotiating', 'closed_won', 'closed_lost', 'declined')),
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement history (tracking who we've engaged with)
CREATE TABLE IF NOT EXISTS engage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_handle TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  target_content_id TEXT,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('comment', 'like', 'follow', 'dm')),
  engagement_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue for scheduled engagements
CREATE TABLE IF NOT EXISTS engage_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_handle TEXT NOT NULL,
  target_content_id TEXT,
  target_content TEXT,
  engagement_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'posted', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics for engagement performance
CREATE TABLE IF NOT EXISTS engage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  comments_replied INTEGER DEFAULT 0,
  dms_replied INTEGER DEFAULT 0,
  brand_deals_identified INTEGER DEFAULT 0,
  collabs_identified INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  engagement_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_engage_profiles_creator ON engage_profiles(creator_id);
CREATE INDEX idx_engage_comments_creator ON engage_comments(creator_id);
CREATE INDEX idx_engage_comments_video ON engage_comments(video_id);
CREATE INDEX idx_engage_replies_status ON engage_replies(status);
CREATE INDEX idx_engage_dms_creator ON engage_dms(creator_id);
CREATE INDEX idx_engage_dms_category ON engage_dms(category);
CREATE INDEX idx_engage_opportunities_creator ON engage_opportunities(creator_id);
CREATE INDEX idx_engage_opportunities_status ON engage_opportunities(status);
CREATE INDEX idx_engage_history_creator ON engage_history(creator_id);
CREATE INDEX idx_engage_queue_creator ON engage_queue(creator_id);
CREATE INDEX idx_engage_analytics_creator_date ON engage_analytics(creator_id, date);

-- RLS Policies
ALTER TABLE engage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_dms ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_dm_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE engage_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own engage profiles"
  ON engage_profiles FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own comments"
  ON engage_comments FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can manage their own replies"
  ON engage_replies FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own DMs"
  ON engage_dms FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can manage their own DM replies"
  ON engage_dm_replies FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Users can manage their own opportunities"
  ON engage_opportunities FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own history"
  ON engage_history FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can manage their own queue"
  ON engage_queue FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own analytics"
  ON engage_analytics FOR SELECT
  USING (creator_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_engage_profiles_updated_at
  BEFORE UPDATE ON engage_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engage_opportunities_updated_at
  BEFORE UPDATE ON engage_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
