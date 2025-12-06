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
    avatar TEXT DEFAULT '🎯',
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
