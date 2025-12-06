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
