-- =====================================================
-- Migration: 01_profiles
-- Description: Create profiles table and setup user profile triggers
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with additional information';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'User email address (synced from auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';
-- =====================================================
-- Migration: 02_subscriptions
-- Description: Create subscriptions table for managing user plans
-- =====================================================

-- Create ENUM types for subscriptions
CREATE TYPE public.plan_type AS ENUM ('basic', 'pro', 'black');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Plan information
    plan_type public.plan_type NOT NULL DEFAULT 'basic',
    status public.subscription_status NOT NULL DEFAULT 'trial',
    
    -- Kiwify integration
    kiwify_subscription_id TEXT UNIQUE,
    kiwify_customer_id TEXT,
    kiwify_data JSONB DEFAULT '{}'::jsonb,
    
    -- Dates
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Plan limits (denormalized for performance)
    max_quizzes INTEGER NOT NULL DEFAULT 3,
    max_monthly_views INTEGER NOT NULL DEFAULT 10000,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_kiwify_subscription_id_idx ON public.subscriptions(kiwify_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx ON public.subscriptions(expires_at);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions (via Kiwify webhook)
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to get active subscription for a user
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    plan_type public.plan_type,
    status public.subscription_status,
    max_quizzes INTEGER,
    max_monthly_views INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_type,
        s.status,
        s.max_quizzes,
        s.max_monthly_views,
        s.expires_at
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
        AND s.status IN ('active', 'trial')
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    ORDER BY 
        CASE s.status 
            WHEN 'active' THEN 1 
            WHEN 'trial' THEN 2 
        END,
        s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set plan limits based on plan type
CREATE OR REPLACE FUNCTION public.set_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Set limits based on plan type
    CASE NEW.plan_type
        WHEN 'basic' THEN
            NEW.max_quizzes := 3;
            NEW.max_monthly_views := 10000;
        WHEN 'pro' THEN
            NEW.max_quizzes := 10;
            NEW.max_monthly_views := 50000;
        WHEN 'black' THEN
            NEW.max_quizzes := 25;
            NEW.max_monthly_views := 100000;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set plan limits automatically
CREATE TRIGGER set_subscription_plan_limits
    BEFORE INSERT OR UPDATE OF plan_type ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_plan_limits();

-- Function to create trial subscription for new users
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (
        user_id,
        plan_type,
        status,
        trial_ends_at,
        expires_at
    ) VALUES (
        NEW.id,
        'basic',
        'trial',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '7 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create trial subscription on user signup
CREATE TRIGGER on_user_created_trial
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_trial_subscription();

-- Grant permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.subscriptions IS 'User subscription and plan management';
COMMENT ON COLUMN public.subscriptions.kiwify_data IS 'Complete webhook data from Kiwify for debugging';
COMMENT ON COLUMN public.subscriptions.max_quizzes IS 'Maximum number of quizzes user can create';
COMMENT ON COLUMN public.subscriptions.max_monthly_views IS 'Maximum monthly views across all quizzes';
-- =====================================================
-- Migration: 06_templates
-- Description: Create templates table for premium and free quiz templates
-- =====================================================

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    
    -- Visual
    thumbnail_url TEXT,
    
    -- Template data (complete Quiz structure)
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Premium settings
    is_premium BOOLEAN DEFAULT FALSE,
    required_plan public.plan_type,
    
    -- Visibility
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_name CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT valid_category CHECK (char_length(category) >= 1 AND char_length(category) <= 50)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS templates_category_idx ON public.templates(category);
CREATE INDEX IF NOT EXISTS templates_is_premium_idx ON public.templates(is_premium);
CREATE INDEX IF NOT EXISTS templates_is_active_idx ON public.templates(is_active);
CREATE INDEX IF NOT EXISTS templates_required_plan_idx ON public.templates(required_plan);
CREATE INDEX IF NOT EXISTS templates_usage_count_idx ON public.templates(usage_count DESC);

-- GIN index for template_data
CREATE INDEX IF NOT EXISTS templates_template_data_gin_idx ON public.templates USING GIN (template_data);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view free active templates
CREATE POLICY "Anyone can view free templates"
    ON public.templates
    FOR SELECT
    USING (is_active = TRUE AND is_premium = FALSE);

-- Authenticated users can view templates based on their plan
CREATE POLICY "Users can view templates for their plan"
    ON public.templates
    FOR SELECT
    USING (
        is_active = TRUE
        AND (
            is_premium = FALSE
            OR EXISTS (
                SELECT 1 FROM public.get_user_subscription(auth.uid()) sub
                WHERE 
                    CASE templates.required_plan
                        WHEN 'basic' THEN sub.plan_type IN ('basic', 'pro', 'black')
                        WHEN 'pro' THEN sub.plan_type IN ('pro', 'black')
                        WHEN 'black' THEN sub.plan_type = 'black'
                        ELSE TRUE
                    END
            )
        )
    );

-- Only service role can manage templates
CREATE POLICY "Service role can manage templates"
    ON public.templates
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER set_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment template usage
CREATE OR REPLACE FUNCTION public.increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE public.templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track template usage
CREATE TRIGGER track_template_usage
    AFTER INSERT ON public.quizzes
    FOR EACH ROW
    WHEN (NEW.template_id IS NOT NULL)
    EXECUTE FUNCTION public.increment_template_usage();

-- Function to get available templates for user
CREATE OR REPLACE FUNCTION public.get_available_templates(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN,
    required_plan public.plan_type,
    usage_count INTEGER,
    can_use BOOLEAN
) AS $$
DECLARE
    v_user_plan public.plan_type;
BEGIN
    -- Get user's plan if authenticated
    IF p_user_id IS NOT NULL THEN
        SELECT sub.plan_type INTO v_user_plan
        FROM public.get_user_subscription(p_user_id) sub;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.description,
        t.category,
        t.thumbnail_url,
        t.is_premium,
        t.required_plan,
        t.usage_count,
        CASE
            WHEN t.is_premium = FALSE THEN TRUE
            WHEN p_user_id IS NULL THEN FALSE
            WHEN v_user_plan IS NULL THEN FALSE
            WHEN t.required_plan = 'basic' AND v_user_plan IN ('basic', 'pro', 'black') THEN TRUE
            WHEN t.required_plan = 'pro' AND v_user_plan IN ('pro', 'black') THEN TRUE
            WHEN t.required_plan = 'black' AND v_user_plan = 'black' THEN TRUE
            ELSE FALSE
        END AS can_use
    FROM public.templates t
    WHERE t.is_active = TRUE
    ORDER BY t.is_premium ASC, t.usage_count DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.templates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_templates(UUID) TO anon, authenticated;

-- Comments
COMMENT ON TABLE public.templates IS 'Quiz templates (free and premium)';
COMMENT ON COLUMN public.templates.template_data IS 'Complete quiz structure to be cloned';
COMMENT ON COLUMN public.templates.required_plan IS 'Minimum plan required to use this template';
COMMENT ON COLUMN public.templates.usage_count IS 'Number of times this template has been used';

-- Insert default free templates
INSERT INTO public.templates (name, description, category, is_premium, template_data) VALUES
(
    'Quiz BÃ¡sico',
    'Template simples para comeÃ§ar rapidamente',
    'geral',
    FALSE,
    '{
        "id": "template-basic",
        "title": "Meu Quiz",
        "description": "Descubra qual Ã© o melhor produto para vocÃª",
        "themeColor": "#0ea5e9",
        "avatar": "ðŸŽ¯",
        "questions": [
            {
                "id": "q1",
                "title": "Qual Ã© o seu principal objetivo?",
                "options": [
                    {"id": "opt1", "text": "Aumentar vendas", "nextQuestionId": "RESULT"},
                    {"id": "opt2", "text": "Gerar leads", "nextQuestionId": "RESULT"},
                    {"id": "opt3", "text": "Engajar audiÃªncia", "nextQuestionId": "RESULT"}
                ]
            }
        ]
    }'::jsonb
),
(
    'Quiz com Personagem',
    'Template com personagem 3D interativo',
    'geral',
    FALSE,
    '{
        "id": "template-character",
        "title": "Quiz Interativo",
        "description": "Uma experiÃªncia Ãºnica com personagem 3D",
        "themeColor": "#8b5cf6",
        "avatar": "ðŸ‘¤",
        "questions": [
            {
                "id": "q1",
                "title": "Vamos comeÃ§ar?",
                "characters": [
                    {
                        "id": "char1",
                        "name": "Assistente",
                        "avatar": "ðŸ¤–",
                        "speech": "OlÃ¡! Vou te ajudar a encontrar a melhor soluÃ§Ã£o."
                    }
                ],
                "options": [
                    {"id": "opt1", "text": "Sim, vamos!", "nextQuestionId": "RESULT"}
                ]
            }
        ]
    }'::jsonb
);
-- =====================================================
-- Migration: 03_quizzes
-- Description: Create quizzes table for storing user-created funnels
-- =====================================================

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    
    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Quiz structure (complete Quiz object from types.ts)
    quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Styling
    theme_color TEXT DEFAULT '#0ea5e9',
    avatar TEXT DEFAULT 'ðŸŽ¯',
    tone TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Publishing status
    is_published BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_title CHECK (char_length(title) >= 1 AND char_length(title) <= 200)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS quizzes_template_id_idx ON public.quizzes(template_id);
CREATE INDEX IF NOT EXISTS quizzes_is_published_idx ON public.quizzes(is_published);
CREATE INDEX IF NOT EXISTS quizzes_is_deleted_idx ON public.quizzes(is_deleted);
CREATE INDEX IF NOT EXISTS quizzes_created_at_idx ON public.quizzes(created_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS quizzes_quiz_data_gin_idx ON public.quizzes USING GIN (quiz_data);
CREATE INDEX IF NOT EXISTS quizzes_settings_gin_idx ON public.quizzes USING GIN (settings);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own non-deleted quizzes
CREATE POLICY "Users can view own quizzes"
    ON public.quizzes
    FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Users can insert their own quizzes (with limit check)
CREATE POLICY "Users can insert own quizzes"
    ON public.quizzes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own quizzes
CREATE POLICY "Users can update own quizzes"
    ON public.quizzes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own quizzes
CREATE POLICY "Users can delete own quizzes"
    ON public.quizzes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user can create more quizzes
CREATE OR REPLACE FUNCTION public.check_quiz_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_max_quizzes INTEGER;
    v_subscription RECORD;
BEGIN
    -- Get user's subscription
    SELECT * INTO v_subscription
    FROM public.get_user_subscription(p_user_id);
    
    -- If no active subscription, deny
    IF v_subscription IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Count non-deleted quizzes
    SELECT COUNT(*) INTO v_current_count
    FROM public.quizzes
    WHERE user_id = p_user_id AND is_deleted = FALSE;
    
    -- Check if under limit
    RETURN v_current_count < v_subscription.max_quizzes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce quiz limit on insert
CREATE OR REPLACE FUNCTION public.enforce_quiz_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.check_quiz_limit(NEW.user_id) THEN
        RAISE EXCEPTION 'Quiz limit reached for your plan. Please upgrade or delete existing quizzes.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce quiz limit
CREATE TRIGGER enforce_quiz_limit_trigger
    BEFORE INSERT ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_quiz_limit();

-- Function to soft delete quiz
CREATE OR REPLACE FUNCTION public.soft_delete_quiz()
RETURNS TRIGGER AS $$
BEGIN
    -- Instead of actually deleting, mark as deleted
    UPDATE public.quizzes
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        is_published = FALSE
    WHERE id = OLD.id;
    
    -- Prevent actual deletion
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for soft delete
CREATE TRIGGER soft_delete_quiz_trigger
    BEFORE DELETE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.soft_delete_quiz();

-- Function to get user's quizzes count
CREATE OR REPLACE FUNCTION public.get_user_quiz_count(p_user_id UUID)
RETURNS TABLE (
    total_quizzes INTEGER,
    published_quizzes INTEGER,
    max_allowed INTEGER
) AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    -- Get subscription
    SELECT * INTO v_subscription
    FROM public.get_user_subscription(p_user_id);
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_quizzes,
        COUNT(*) FILTER (WHERE is_published = TRUE)::INTEGER AS published_quizzes,
        COALESCE(v_subscription.max_quizzes, 0)::INTEGER AS max_allowed
    FROM public.quizzes
    WHERE user_id = p_user_id AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_quiz_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_quiz_count(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.quizzes IS 'User-created quiz funnels';
COMMENT ON COLUMN public.quizzes.quiz_data IS 'Complete quiz structure (questions, options, characters, etc.)';
COMMENT ON COLUMN public.quizzes.settings IS 'Quiz settings (webhooks, pixels, custom domain, etc.)';
COMMENT ON COLUMN public.quizzes.is_deleted IS 'Soft delete flag - deleted quizzes are hidden but not removed';
-- =====================================================
-- Migration: 04_published_quizzes
-- Description: Create published_quizzes table for managing public quiz URLs
-- =====================================================

-- Create published_quizzes table
CREATE TABLE IF NOT EXISTS public.published_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL UNIQUE REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- URL configuration
    slug TEXT NOT NULL UNIQUE,
    custom_domain TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unpublished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 100),
    CONSTRAINT valid_custom_domain CHECK (custom_domain IS NULL OR custom_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS published_quizzes_quiz_id_idx ON public.published_quizzes(quiz_id);
CREATE INDEX IF NOT EXISTS published_quizzes_user_id_idx ON public.published_quizzes(user_id);
CREATE INDEX IF NOT EXISTS published_quizzes_slug_idx ON public.published_quizzes(slug);
CREATE INDEX IF NOT EXISTS published_quizzes_custom_domain_idx ON public.published_quizzes(custom_domain);
CREATE INDEX IF NOT EXISTS published_quizzes_is_active_idx ON public.published_quizzes(is_active);

-- Enable Row Level Security
ALTER TABLE public.published_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active published quizzes (for public access)
CREATE POLICY "Anyone can view active published quizzes"
    ON public.published_quizzes
    FOR SELECT
    USING (is_active = TRUE);

-- Users can view their own published quizzes (even inactive)
CREATE POLICY "Users can view own published quizzes"
    ON public.published_quizzes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can publish their own quizzes
CREATE POLICY "Users can publish own quizzes"
    ON public.published_quizzes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own published quizzes
CREATE POLICY "Users can update own published quizzes"
    ON public.published_quizzes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own published quizzes
CREATE POLICY "Users can delete own published quizzes"
    ON public.published_quizzes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_published_quizzes_updated_at
    BEFORE UPDATE ON public.published_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_base_slug TEXT;
    v_slug TEXT;
    v_counter INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    -- Convert title to slug format
    v_base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
    v_base_slug := trim(both '-' from v_base_slug);
    v_base_slug := substring(v_base_slug, 1, 80);
    
    -- Try base slug first
    v_slug := v_base_slug;
    
    -- Keep trying until we find a unique slug
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM public.published_quizzes WHERE slug = v_slug
        ) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        
        v_counter := v_counter + 1;
        v_slug := v_base_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to sync quiz published status
CREATE OR REPLACE FUNCTION public.sync_quiz_published_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mark quiz as published
        UPDATE public.quizzes
        SET is_published = TRUE
        WHERE id = NEW.quiz_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Mark quiz as unpublished
        UPDATE public.quizzes
        SET is_published = FALSE
        WHERE id = OLD.quiz_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Sync is_active with is_published
        UPDATE public.quizzes
        SET is_published = NEW.is_active
        WHERE id = NEW.quiz_id;
        
        -- Set unpublished_at if deactivated
        IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
            NEW.unpublished_at := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync published status
CREATE TRIGGER sync_quiz_published_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.published_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_quiz_published_status();

-- Function to get published quiz by slug
CREATE OR REPLACE FUNCTION public.get_published_quiz(p_slug TEXT)
RETURNS TABLE (
    quiz_id UUID,
    quiz_data JSONB,
    title TEXT,
    theme_color TEXT,
    avatar TEXT,
    settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.quiz_data,
        q.title,
        q.theme_color,
        q.avatar,
        q.settings
    FROM public.quizzes q
    INNER JOIN public.published_quizzes pq ON pq.quiz_id = q.id
    WHERE pq.slug = p_slug
        AND pq.is_active = TRUE
        AND q.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_quizzes TO authenticated;
GRANT SELECT ON public.published_quizzes TO anon;
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_quiz(TEXT) TO anon, authenticated;

-- Comments
COMMENT ON TABLE public.published_quizzes IS 'Published quizzes with public URLs';
COMMENT ON COLUMN public.published_quizzes.slug IS 'URL-friendly unique identifier (e.g., meu-quiz-123)';
COMMENT ON COLUMN public.published_quizzes.custom_domain IS 'Optional custom domain for white-label';
COMMENT ON COLUMN public.published_quizzes.is_active IS 'Whether the quiz is currently accessible publicly';
-- =====================================================
-- Migration: 05_quiz_analytics
-- Description: Create quiz_analytics table for tracking quiz performance
-- =====================================================

-- Create quiz_analytics table
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    
    -- Date for daily aggregation
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Basic metrics
    total_views INTEGER DEFAULT 0,
    total_starts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    
    -- Calculated metrics
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_time_seconds INTEGER DEFAULT 0,
    
    -- Detailed analytics (JSONB for flexibility)
    step_analytics JSONB DEFAULT '[]'::jsonb,
    device_breakdown JSONB DEFAULT '{}'::jsonb,
    referrer_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one record per quiz per day
    CONSTRAINT unique_quiz_date UNIQUE (quiz_id, analytics_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS quiz_analytics_quiz_id_idx ON public.quiz_analytics(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_analytics_date_idx ON public.quiz_analytics(analytics_date DESC);
CREATE INDEX IF NOT EXISTS quiz_analytics_quiz_date_idx ON public.quiz_analytics(quiz_id, analytics_date DESC);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS quiz_analytics_step_analytics_gin_idx ON public.quiz_analytics USING GIN (step_analytics);
CREATE INDEX IF NOT EXISTS quiz_analytics_device_breakdown_gin_idx ON public.quiz_analytics USING GIN (device_breakdown);

-- Enable Row Level Security
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view analytics for their own quizzes
CREATE POLICY "Users can view own quiz analytics"
    ON public.quiz_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = quiz_analytics.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

-- Only system can insert/update analytics (via service role or functions)
CREATE POLICY "Service role can manage analytics"
    ON public.quiz_analytics
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER set_quiz_analytics_updated_at
    BEFORE UPDATE ON public.quiz_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment quiz view
CREATE OR REPLACE FUNCTION public.increment_quiz_view(
    p_quiz_id UUID,
    p_device_type TEXT DEFAULT 'desktop',
    p_referrer TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_device_data JSONB;
BEGIN
    -- Insert or update analytics for today
    INSERT INTO public.quiz_analytics (
        quiz_id,
        analytics_date,
        total_views,
        device_breakdown
    ) VALUES (
        p_quiz_id,
        v_today,
        1,
        jsonb_build_object(p_device_type, 1)
    )
    ON CONFLICT (quiz_id, analytics_date)
    DO UPDATE SET
        total_views = quiz_analytics.total_views + 1,
        device_breakdown = jsonb_set(
            quiz_analytics.device_breakdown,
            ARRAY[p_device_type],
            to_jsonb(COALESCE((quiz_analytics.device_breakdown->>p_device_type)::integer, 0) + 1)
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track quiz start
CREATE OR REPLACE FUNCTION public.track_quiz_start(p_quiz_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.quiz_analytics
    SET 
        total_starts = total_starts + 1,
        updated_at = NOW()
    WHERE quiz_id = p_quiz_id
        AND analytics_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track quiz completion
CREATE OR REPLACE FUNCTION public.track_quiz_completion(
    p_quiz_id UUID,
    p_time_seconds INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_current_avg INTEGER;
    v_current_completions INTEGER;
    v_new_avg INTEGER;
BEGIN
    -- Get current values
    SELECT average_time_seconds, total_completions
    INTO v_current_avg, v_current_completions
    FROM public.quiz_analytics
    WHERE quiz_id = p_quiz_id AND analytics_date = CURRENT_DATE;
    
    -- Calculate new average if time provided
    IF p_time_seconds IS NOT NULL AND v_current_completions > 0 THEN
        v_new_avg := ((v_current_avg * v_current_completions) + p_time_seconds) / (v_current_completions + 1);
    ELSIF p_time_seconds IS NOT NULL THEN
        v_new_avg := p_time_seconds;
    ELSE
        v_new_avg := v_current_avg;
    END IF;
    
    -- Update analytics
    UPDATE public.quiz_analytics
    SET 
        total_completions = total_completions + 1,
        average_time_seconds = v_new_avg,
        completion_rate = CASE 
            WHEN total_starts > 0 THEN 
                ROUND(((total_completions + 1)::DECIMAL / total_starts::DECIMAL) * 100, 2)
            ELSE 0
        END,
        conversion_rate = CASE 
            WHEN total_views > 0 THEN 
                ROUND(((total_completions + 1)::DECIMAL / total_views::DECIMAL) * 100, 2)
            ELSE 0
        END,
        updated_at = NOW()
    WHERE quiz_id = p_quiz_id
        AND analytics_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quiz analytics summary
CREATE OR REPLACE FUNCTION public.get_quiz_analytics_summary(
    p_quiz_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_views BIGINT,
    total_starts BIGINT,
    total_completions BIGINT,
    avg_conversion_rate DECIMAL,
    avg_completion_rate DECIMAL,
    avg_time_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(qa.total_views)::BIGINT,
        SUM(qa.total_starts)::BIGINT,
        SUM(qa.total_completions)::BIGINT,
        ROUND(AVG(qa.conversion_rate), 2),
        ROUND(AVG(qa.completion_rate), 2),
        ROUND(AVG(qa.average_time_seconds))::INTEGER
    FROM public.quiz_analytics qa
    WHERE qa.quiz_id = p_quiz_id
        AND qa.analytics_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check monthly views limit
CREATE OR REPLACE FUNCTION public.check_monthly_views_limit(p_user_id UUID)
RETURNS TABLE (
    current_views BIGINT,
    max_views INTEGER,
    limit_reached BOOLEAN
) AS $$
DECLARE
    v_subscription RECORD;
    v_current_views BIGINT;
BEGIN
    -- Get user's subscription
    SELECT * INTO v_subscription
    FROM public.get_user_subscription(p_user_id);
    
    -- If no active subscription, return limit reached
    IF v_subscription IS NULL THEN
        RETURN QUERY SELECT 0::BIGINT, 0::INTEGER, TRUE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Calculate current month's views
    SELECT COALESCE(SUM(qa.total_views), 0) INTO v_current_views
    FROM public.quiz_analytics qa
    INNER JOIN public.quizzes q ON q.id = qa.quiz_id
    WHERE q.user_id = p_user_id
        AND qa.analytics_date >= DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Return results
    RETURN QUERY
    SELECT 
        v_current_views,
        v_subscription.max_monthly_views,
        v_current_views >= v_subscription.max_monthly_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.quiz_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_quiz_view(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_quiz_start(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_quiz_completion(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_analytics_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_monthly_views_limit(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.quiz_analytics IS 'Daily aggregated analytics for quiz performance';
COMMENT ON COLUMN public.quiz_analytics.step_analytics IS 'Per-step analytics (drop-off rates, time spent, etc.)';
COMMENT ON COLUMN public.quiz_analytics.device_breakdown IS 'Views by device type (mobile, desktop, tablet)';
COMMENT ON COLUMN public.quiz_analytics.referrer_data IS 'Traffic sources and referrers';
