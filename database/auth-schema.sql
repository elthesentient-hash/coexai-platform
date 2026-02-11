-- ============================================
-- COEXAI - Real Auth & Payments Schema
-- Supabase Auth + Stripe + Platform OAuth
-- ============================================

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Plan & Subscription
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro', 'empire')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled')),
  
  -- Stripe Integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Trial/Subscription Dates
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Creator Info
  bio TEXT,
  website TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Settings
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ============================================
-- PLATFORM CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'twitter')),
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  channel_username TEXT,
  channel_avatar TEXT,
  
  -- Stats
  subscriber_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  
  -- OAuth Tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Permissions
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

-- ============================================
-- OAUTH STATES (for OAuth flow verification)
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- API KEYS (for programmatic access)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL, -- last 4 chars
  
  permissions JSONB DEFAULT '["read"]'::jsonb,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  old_data JSONB,
  new_data JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_status ON profiles(status);

CREATE INDEX idx_platform_connections_user ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);

CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX idx_oauth_states_user ON oauth_states(user_id);

CREATE INDEX idx_payment_history_user ON payment_history(user_id);
CREATE INDEX idx_payment_history_stripe ON payment_history(stripe_payment_intent_id);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Platform Connections: Users can only see their own
CREATE POLICY "Users can view own connections"
  ON platform_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own connections"
  ON platform_connections FOR ALL
  USING (user_id = auth.uid());

-- OAuth States: System only
CREATE POLICY "System manages oauth states"
  ON oauth_states FOR ALL
  USING (false);

-- Payment History: Users can only see their own
CREATE POLICY "Users can view own payments"
  ON payment_history FOR SELECT
  USING (user_id = auth.uid());

-- API Keys: Users can manage their own
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());

-- Audit Log: Users can only see their own
CREATE POLICY "Users can view own audit log"
  ON audit_log FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_data,
    new_data
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_data,
    p_new_data
  );
END;
$$ language 'plpgsql';

-- ============================================
-- STRIPE PRICE IDS (for reference)
-- ============================================
-- These should be set in your environment variables
-- and used when creating checkout sessions

-- CREATE TABLE stripe_config (
--   key TEXT PRIMARY KEY,
--   value TEXT NOT NULL
-- );

-- INSERT INTO stripe_config VALUES
--   ('price_starter', 'price_1234567890_starter'),
--   ('price_growth', 'price_1234567890_growth'),
--   ('price_pro', 'price_1234567890_pro'),
--   ('price_empire', 'price_1234567890_empire');

-- ============================================
-- SEED DATA (optional - for testing)
-- ============================================
-- Uncomment and modify for initial testing

-- INSERT INTO profiles (id, email, full_name, plan, status)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'test@example.com',
--   'Test User',
--   'growth',
--   'trial'
-- );
