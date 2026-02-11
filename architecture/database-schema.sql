-- =====================================================
-- CoExAI Database Schema
-- PostgreSQL 16
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =====================================================
-- ENUMERATIONS
-- =====================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE job_status AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE agent_type AS ENUM ('maya', 'jordan', 'sam', 'taylor');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'maintenance', 'deprecated');
CREATE TYPE file_type AS ENUM ('document', 'image', 'video', 'audio', 'spreadsheet', 'archive', 'other');
CREATE TYPE output_format AS ENUM ('json', 'markdown', 'html', 'docx', 'pdf', 'csv', 'txt');
CREATE ROLE role_type AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE webhook_event AS ENUM ('job.completed', 'job.failed', 'subscription.created', 'subscription.updated', 'subscription.cancelled', 'payment.succeeded', 'payment.failed');
CREATE TYPE audit_action AS ENUM ('user.login', 'user.logout', 'user.created', 'user.updated', 'user.deleted', 'api_key.created', 'api_key.revoked', 'job.created', 'job.cancelled', 'subscription.changed', 'billing.updated');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (multi-tenant root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status user_status DEFAULT 'active',
    tier subscription_tier DEFAULT 'free',
    
    -- Billing
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    
    -- Usage limits (cached for quick checks)
    monthly_job_quota INTEGER DEFAULT 10,
    monthly_jobs_used INTEGER DEFAULT 0,
    quota_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW()),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_quota CHECK (monthly_job_quota >= 0),
    CONSTRAINT valid_usage CHECK (monthly_jobs_used >= 0)
);

CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_tier ON organizations(tier);
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Profile
    email CITEXT UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    
    -- Profile info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Status
    status user_status DEFAULT 'pending',
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret_encrypted TEXT,
    mfa_backup_codes TEXT[], -- hashed
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Organization Members (roles within org)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role role_type DEFAULT 'member',
    
    -- Agent permissions (bitmask or specific grants)
    allowed_agents agent_type[] DEFAULT ARRAY['maya', 'jordan', 'sam', 'taylor']::agent_type[],
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Key (hashed for storage, prefix for identification)
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    
    -- Metadata
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Scopes and limits
    scopes VARCHAR(50)[] DEFAULT ARRAY['read', 'write']::VARCHAR[],
    allowed_ips INET[],
    rate_limit_override INTEGER, -- NULL = use tier default
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revoked_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(key_prefix)
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(organization_id) 
    WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session info
    token_hash VARCHAR(255) NOT NULL, -- For refresh token validation
    ip_address INET,
    user_agent TEXT,
    
    -- MFA state
    mfa_verified BOOLEAN DEFAULT FALSE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_token ON sessions(token_hash);

-- OAuth Connections
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    provider VARCHAR(50) NOT NULL, -- google, microsoft, github, etc.
    provider_user_id VARCHAR(255) NOT NULL,
    
    -- Tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Profile data from provider
    provider_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider, provider_user_id);

-- =====================================================
-- BILLING TABLES
-- =====================================================

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    
    -- Plan details
    tier subscription_tier NOT NULL,
    status subscription_status DEFAULT 'trialing',
    
    -- Pricing
    amount_cents INTEGER NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) DEFAULT 'month', -- month, year
    
    -- Trial
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Current period
    current_period_starts_at TIMESTAMP WITH TIME ZONE,
    current_period_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    usage_limits JSONB DEFAULT '{}', -- agent-specific limits
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_amount CHECK (amount_cents >= 0)
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Stripe data
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    
    -- Amounts
    amount_due_cents INTEGER NOT NULL,
    amount_paid_cents INTEGER DEFAULT 0,
    amount_remaining_cents INTEGER,
    currency CHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, uncollectible, void
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    -- PDF URL
    invoice_pdf_url TEXT,
    
    -- Line items (denormalized for quick access)
    line_items JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_payment_method_id VARCHAR(255) UNIQUE,
    
    -- Card info (last 4 only, for display)
    type VARCHAR(50) DEFAULT 'card',
    brand VARCHAR(50), -- visa, mastercard, etc.
    last4 CHAR(4),
    exp_month INTEGER,
    exp_year INTEGER,
    
    -- Billing details
    billing_name VARCHAR(255),
    billing_email CITEXT,
    billing_address JSONB,
    
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_org ON payment_methods(organization_id);

-- Usage Records (for metered billing)
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Usage details
    agent_type agent_type,
    quantity INTEGER NOT NULL,
    
    -- Stripe meter event ID
    stripe_meter_event_id VARCHAR(255),
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX idx_usage_records_recorded ON usage_records(recorded_at);

-- =====================================================
-- AGENT TABLES
-- =====================================================

-- Agent Definitions
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type agent_type NOT NULL,
    
    -- Status
    status agent_status DEFAULT 'active',
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Configuration
    config_schema JSONB NOT NULL, -- JSON Schema for agent config
    default_config JSONB DEFAULT '{}',
    
    -- Capabilities
    input_types file_type[] DEFAULT '{}',
    output_formats output_format[] DEFAULT '{json}',
    max_file_size_mb INTEGER DEFAULT 10,
    estimated_duration_seconds INTEGER, -- for UI estimates
    
    -- Documentation
    documentation_url TEXT,
    example_inputs JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);

-- Organization Agent Settings (custom config per org)
CREATE TABLE organization_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Custom configuration
    config JSONB DEFAULT '{}',
    
    -- Enabled/disabled
    is_enabled BOOLEAN DEFAULT TRUE,
    disabled_reason TEXT,
    disabled_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage limits (override defaults)
    monthly_limit INTEGER,
    monthly_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, agent_id)
);

CREATE INDEX idx_org_agents_org ON organization_agents(organization_id);
CREATE INDEX idx_org_agents_agent ON organization_agents(agent_id);

-- =====================================================
-- JOB TABLES
-- =====================================================

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    
    -- Status
    status job_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    
    -- Input
    input_data JSONB NOT NULL,
    input_files UUID[], -- References files table
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- Processing
    worker_id VARCHAR(100), -- Which worker picked it up
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    output_data JSONB,
    output_files UUID[],
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Performance metrics
    queue_time_ms INTEGER, -- Time spent waiting
    processing_time_ms INTEGER, -- Time spent processing
    
    -- API/Webhook
    callback_url TEXT,
    webhook_delivered_at TIMESTAMP WITH TIME ZONE,
    webhook_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Partitioning by created_at recommended for high volume
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_agent ON jobs(agent_id);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_pending ON jobs(status, priority, created_at) 
    WHERE status IN ('pending', 'queued');
CREATE INDEX idx_jobs_processing ON jobs(status, started_at) 
    WHERE status = 'processing';

-- Job History (state transitions for audit)
CREATE TABLE job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    from_status job_status,
    to_status job_status NOT NULL,
    
    changed_by UUID REFERENCES users(id), -- NULL for system
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_history_job ON job_history(job_id);
CREATE INDEX idx_job_history_created ON job_history(created_at);

-- Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- File info
    original_name VARCHAR(500) NOT NULL,
    storage_key TEXT NOT NULL, -- S3/minio key
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'coexai-uploads',
    
    type file_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64), -- SHA-256
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- extracted metadata (dimensions, pages, etc.)
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_size CHECK (size_bytes > 0)
);

CREATE INDEX idx_files_org ON files(organization_id);
CREATE INDEX idx_files_job ON files(job_id);
CREATE INDEX idx_files_type ON files(type);
CREATE INDEX idx_files_expires ON files(expires_at) WHERE expires_at IS NOT NULL;

-- Job Outputs (cached results)
CREATE TABLE job_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Output data
    format output_format NOT NULL,
    content JSONB NOT NULL,
    
    -- File outputs
    output_files UUID[],
    
    -- Metrics
    tokens_used INTEGER, -- For LLM-based agents
    processing_cost_cents INTEGER, -- Estimated cost
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outputs_org ON job_outputs(organization_id);
CREATE INDEX idx_outputs_expires ON job_outputs(expires_at);

-- =====================================================
-- WEBHOOK TABLES
-- =====================================================

-- Webhook Endpoints
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Configuration
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL, -- For HMAC signature
    
    -- Events
    events webhook_event[] NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_reason TEXT,
    
    -- Metadata
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhook_endpoints(organization_id);
CREATE INDEX idx_webhooks_active ON webhook_endpoints(organization_id, is_active) 
    WHERE is_active = TRUE;

-- Webhook Deliveries
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    
    -- Event details
    event_type webhook_event NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery details
    request_body TEXT,
    response_status INTEGER,
    response_body TEXT,
    
    -- Metrics
    request_duration_ms INTEGER,
    
    -- Retry state
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, failed
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) 
    WHERE status = 'pending';

-- =====================================================
-- AUDIT & ANALYTICS TABLES
-- =====================================================

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- user, job, subscription, etc.
    resource_id UUID,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audit_logs
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Add more partitions as needed

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Rate Limit Tracking
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL, -- api_key_id or user_id or ip_address
    key_type VARCHAR(50) NOT NULL, -- 'api_key', 'user', 'ip'
    
    -- Window tracking
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_duration_seconds INTEGER NOT NULL,
    
    -- Usage
    request_count INTEGER DEFAULT 0,
    
    UNIQUE(key, window_start)
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key, window_start);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_agents_updated_at BEFORE UPDATE ON organization_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Job status history trigger
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO job_history (job_id, from_status, to_status, changed_by, reason)
        VALUES (NEW.id, OLD.status, NEW.status, NULL, COALESCE(NEW.error_message, 'Status changed'));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER job_status_history AFTER UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION log_job_status_change();

-- Quota reset function (run at start of each month)
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    UPDATE organizations
    SET monthly_jobs_used = 0,
        quota_reset_at = DATE_TRUNC('month', NOW())
    WHERE quota_reset_at < DATE_TRUNC('month', NOW());
    
    UPDATE organization_agents
    SET monthly_used = 0
    WHERE monthly_limit IS NOT NULL;
END;
$$ language 'plpgsql';

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Anonymize user data
    UPDATE users
    SET email = 'deleted_' || id || '@deleted.coexai.com',
        first_name = 'Deleted',
        last_name = 'User',
        avatar_url = NULL,
        password_hash = NULL,
        status = 'inactive',
        deleted_at = NOW()
    WHERE id = target_user_id;
    
    -- Revoke all API keys
    UPDATE api_keys
    SET revoked_at = NOW(),
        revoked_reason = 'User deleted'
    WHERE created_by = target_user_id AND revoked_at IS NULL;
    
    -- Invalidate sessions
    DELETE FROM sessions WHERE user_id = target_user_id;
END;
$$ language 'plpgsql';

-- =====================================================
-- VIEWS
-- =====================================================

-- Organization usage summary
CREATE VIEW organization_usage_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.tier,
    o.monthly_job_quota,
    o.monthly_jobs_used,
    o.monthly_job_quota - o.monthly_jobs_used as remaining_quota,
    COUNT(DISTINCT j.id) FILTER (WHERE j.created_at >= DATE_TRUNC('month', NOW())) as jobs_this_month,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'processing') as active_jobs,
    COUNT(DISTINCT u.id) FILTER (WHERE u.deleted_at IS NULL) as active_users,
    s.status as subscription_status,
    s.current_period_ends_at
FROM organizations o
LEFT JOIN jobs j ON j.organization_id = o.id
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.tier, o.monthly_job_quota, o.monthly_jobs_used, s.status, s.current_period_ends_at;

-- Job queue status
CREATE VIEW job_queue_status AS
SELECT 
    agent_id,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_job,
    MAX(EXTRACT(EPOCH FROM (NOW() - created_at))/60)::INTEGER as oldest_minutes
FROM jobs
WHERE status IN ('pending', 'queued', 'processing')
GROUP BY agent_id, status;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default agents
INSERT INTO agents (name, slug, description, type, config_schema, default_config, input_types, output_formats, max_file_size_mb, estimated_duration_seconds, documentation_url) VALUES
(
    'Maya - Content Repurposing',
    'maya',
    'Transform content across formats and platforms. Convert blog posts to social media, create content calendars, and repurpose existing content.',
    'maya',
    '{
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "source_type": {"type": "string", "enum": ["url", "text", "file"]},
            "target_formats": {"type": "array", "items": {"type": "string", "enum": ["twitter", "linkedin", "newsletter", "blog_summary", "thread"]}},
            "tone": {"type": "string", "enum": ["professional", "casual", "witty", "formal"]},
            "include_hashtags": {"type": "boolean"},
            "max_length": {"type": "integer", "minimum": 50, "maximum": 5000}
        },
        "required": ["source_type", "target_formats"]
    }'::jsonb,
    '{"tone": "professional", "include_hashtags": true}'::jsonb,
    ARRAY['document', 'text']::file_type[],
    ARRAY['json', 'markdown', 'txt']::output_format[],
    50,
    120,
    'https://docs.coexai.com/agents/maya'
),
(
    'Jordan - LinkedIn Growth',
    'jordan',
    'Optimize your LinkedIn presence with AI-powered content suggestions, engagement strategies, and growth analytics.',
    'jordan',
    '{
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "profile_url": {"type": "string", "format": "uri"},
            "action": {"type": "string", "enum": ["profile_optimization", "content_creation", "engagement_suggestions", "analytics_report"]},
            "content_topic": {"type": "string"},
            "target_audience": {"type": "string"},
            "post_schedule": {"type": "array", "items": {"type": "string", "format": "date-time"}}
        },
        "required": ["action"]
    }'::jsonb,
    '{"action": "content_creation"}'::jsonb,
    ARRAY['text']::file_type[],
    ARRAY['json', 'markdown']::output_format[],
    10,
    180,
    'https://docs.coexai.com/agents/jordan'
),
(
    'Sam - Local SEO',
    'sam',
    'Improve your local search visibility with GMB optimization, citation building, and local keyword research.',
    'sam',
    '{
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "business_name": {"type": "string"},
            "location": {"type": "string"},
            "website": {"type": "string", "format": "uri"},
            "gmb_url": {"type": "string", "format": "uri"},
            "primary_keywords": {"type": "array", "items": {"type": "string"}},
            "competitors": {"type": "array", "items": {"type": "string"}},
            "service_area": {"type": "string"}
        },
        "required": ["business_name", "location"]
    }'::jsonb,
    '{}'::jsonb,
    ARRAY['text', 'document']::file_type[],
    ARRAY['json', 'pdf', 'html']::output_format[],
    25,
    300,
    'https://docs.coexai.com/agents/sam'
),
(
    'Taylor - Document Processor',
    'taylor',
    'Intelligent document processing with OCR, data extraction, classification, and validation.',
    'taylor',
    '{
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "extraction_type": {"type": "string", "enum": ["ocr", "form_data", "table_extraction", "classification", "summarization"]},
            "language": {"type": "string", "default": "auto"},
            "output_structure": {"type": "object"},
            "validation_rules": {"type": "array"},
            "confidence_threshold": {"type": "number", "minimum": 0, "maximum": 1}
        },
        "required": ["extraction_type"]
    }'::jsonb,
    '{"extraction_type": "ocr", "confidence_threshold": 0.85}'::jsonb,
    ARRAY['document', 'image']::file_type[],
    ARRAY['json', 'csv', 'txt', 'docx']::output_format[],
    100,
    240,
    'https://docs.coexai.com/agents/taylor'
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant root entity. All data is scoped to an organization.';
COMMENT ON TABLE users IS 'User accounts with email/password or OAuth authentication.';
COMMENT ON TABLE jobs IS 'Agent job executions. Partition by created_at for high volume.';
COMMENT ON TABLE subscriptions IS 'Stripe subscription records synced via webhooks.';
COMMENT ON TABLE api_keys IS 'API authentication keys with scoped permissions.';
COMMENT ON TABLE webhook_endpoints IS 'User-configured webhook endpoints for event notifications.';
COMMENT ON TABLE audit_logs IS 'Security audit trail. Partitioned by month for retention management.';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on main tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY org_isolation ON organizations
    FOR ALL
    USING (id = current_setting('app.current_org_id')::UUID);

-- Users: Users can only see users in their org
CREATE POLICY user_isolation ON users
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Jobs: Users can only see jobs in their org
CREATE POLICY job_isolation ON jobs
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Files: Users can only see files in their org
CREATE POLICY file_isolation ON files
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- API Keys: Users can only see keys in their org
CREATE POLICY api_key_isolation ON api_keys
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Subscriptions: Users can only see subscriptions in their org
CREATE POLICY subscription_isolation ON subscriptions
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Webhook Endpoints: Users can only see webhooks in their org
CREATE POLICY webhook_isolation ON webhook_endpoints
    FOR ALL
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- =====================================================
-- GRANTS
-- =====================================================

-- Create application roles
CREATE ROLE coexai_app NOLOGIN;
CREATE ROLE coexai_worker NOLOGIN;
CREATE ROLE coexai_readonly NOLOGIN;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO coexai_app, coexai_worker, coexai_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO coexai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO coexai_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_history TO coexai_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON files TO coexai_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_outputs TO coexai_worker;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO coexai_readonly;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO coexai_app, coexai_worker;
