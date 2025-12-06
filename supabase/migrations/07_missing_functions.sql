
-- =====================================================
-- Migration: 07_missing_functions
-- Description: Add missing functions for quiz publishing and security
-- =====================================================

-- Function to publish quiz securely (fixing RLS issue)
CREATE OR REPLACE FUNCTION public.publish_quiz_secure(
    p_quiz_id UUID,
    p_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_published_quiz JSONB;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check if quiz belongs to user
    IF NOT EXISTS (
        SELECT 1 FROM public.quizzes 
        WHERE id = p_quiz_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Quiz not found or permission denied';
    END IF;

    -- Insert or Update published_quizzes
    INSERT INTO public.published_quizzes (quiz_id, user_id, slug, is_active)
    VALUES (p_quiz_id, v_user_id, p_slug, TRUE)
    ON CONFLICT (quiz_id) 
    DO UPDATE SET 
        slug = p_slug,
        is_active = TRUE,
        updated_at = NOW()
    RETURNING to_jsonb(published_quizzes.*) INTO v_published_quiz;

    -- Update quiz status
    UPDATE public.quizzes
    SET is_published = TRUE
    WHERE id = p_quiz_id;

    RETURN v_published_quiz;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.publish_quiz_secure(UUID, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.publish_quiz_secure IS 'Securely publishes a quiz, verifying ownership';
