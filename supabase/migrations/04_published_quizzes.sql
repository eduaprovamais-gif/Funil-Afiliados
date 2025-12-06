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
