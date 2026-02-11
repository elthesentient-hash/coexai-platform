-- CoExAI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('alex', 'maya', 'jordan', 'sam', 'taylor')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_type)
);

-- Usage tracking
CREATE TABLE public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    credits_used INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- ALEX - Appointment Setter
-- ============================
CREATE TABLE public.alex_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    script_template TEXT,
    calendar_link TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    calls_made INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.alex_prospects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.alex_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'called', 'booked', 'rejected', 'voicemail')),
    call_recording_url TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- MAYA - Content Creator
-- ============================
CREATE TABLE public.maya_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_title TEXT,
    transcript TEXT,
    status TEXT DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.maya_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.maya_projects(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('short', 'carousel', 'thread', 'blog', 'linkedin')),
    title TEXT,
    content TEXT NOT NULL,
    hashtags TEXT[],
    image_prompt TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted')),
    platform_posted TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- JORDAN - LinkedIn Growth
-- ============================
CREATE TABLE public.jordan_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    linkedin_connected BOOLEAN DEFAULT FALSE,
    voice_samples TEXT[],
    content_pillars TEXT[],
    posting_schedule JSONB DEFAULT '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true}'::JSONB,
    target_audience TEXT,
    tone_of_voice TEXT DEFAULT 'professional',
    auto_post BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.jordan_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    hook TEXT,
    cta TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'rejected')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    impressions INTEGER,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- SAM - Local SEO
-- ============================
CREATE TABLE public.sam_businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    category TEXT,
    google_business_connected BOOLEAN DEFAULT FALSE,
    target_keywords TEXT[],
    service_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sam_rankings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.sam_businesses(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    position INTEGER,
    previous_position INTEGER,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sam_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.sam_businesses(id) ON DELETE CASCADE,
    reviewer_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    platform TEXT CHECK (platform IN ('google', 'yelp', 'facebook')),
    responded BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TAYLOR - Document Processor
-- ============================
CREATE TABLE public.taylor_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    extraction_fields JSONB NOT NULL,
    output_destination TEXT CHECK (output_destination IN ('email', 'webhook', 'google_sheets', 'crm')),
    destination_config JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.taylor_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.taylor_workflows(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    extracted_data JSONB,
    confidence_score DECIMAL(4,3),
    status TEXT DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- ROW LEVEL SECURITY POLICIES
-- ============================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maya_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maya_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jordan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jordan_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taylor_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taylor_documents ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage logs: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Alex campaigns
CREATE POLICY "Users can manage own campaigns" ON public.alex_campaigns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prospects" ON public.alex_prospects
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM public.alex_campaigns WHERE user_id = auth.uid()
        )
    );

-- Maya projects
CREATE POLICY "Users can manage own projects" ON public.maya_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content" ON public.maya_content
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.maya_projects WHERE user_id = auth.uid()
        )
    );

-- Jordan posts
CREATE POLICY "Users can manage own settings" ON public.jordan_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own posts" ON public.jordan_posts
    FOR ALL USING (auth.uid() = user_id);

-- Sam businesses
CREATE POLICY "Users can manage own businesses" ON public.sam_businesses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own rankings" ON public.sam_rankings
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.sam_businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own reviews" ON public.sam_reviews
    FOR ALL USING (
        business_id IN (
            SELECT id FROM public.sam_businesses WHERE user_id = auth.uid()
        )
    );

-- Taylor documents
CREATE POLICY "Users can manage own workflows" ON public.taylor_workflows
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON public.taylor_documents
    FOR ALL USING (auth.uid() = user_id);

-- ============================
-- FUNCTIONS
-- ============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_agent ON public.subscriptions(agent_type);
CREATE INDEX idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created ON public.usage_logs(created_at);
CREATE INDEX idx_maya_projects_user ON public.maya_projects(user_id);
CREATE INDEX idx_maya_projects_status ON public.maya_projects(status);
CREATE INDEX idx_jordan_posts_user ON public.jordan_posts(user_id);
CREATE INDEX idx_jordan_posts_status ON public.jordan_posts(status);
CREATE INDEX idx_alex_prospects_campaign ON public.alex_prospects(campaign_id);
CREATE INDEX idx_alex_prospects_status ON public.alex_prospects(status);
CREATE INDEX idx_taylor_documents_user ON public.taylor_documents(user_id);
CREATE INDEX idx_taylor_documents_status ON public.taylor_documents(status);
