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
