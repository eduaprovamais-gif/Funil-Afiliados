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
    'Quiz Básico',
    'Template simples para começar rapidamente',
    'geral',
    FALSE,
    '{
        "id": "template-basic",
        "title": "Meu Quiz",
        "description": "Descubra qual é o melhor produto para você",
        "themeColor": "#0ea5e9",
        "avatar": "🎯",
        "questions": [
            {
                "id": "q1",
                "title": "Qual é o seu principal objetivo?",
                "options": [
                    {"id": "opt1", "text": "Aumentar vendas", "nextQuestionId": "RESULT"},
                    {"id": "opt2", "text": "Gerar leads", "nextQuestionId": "RESULT"},
                    {"id": "opt3", "text": "Engajar audiência", "nextQuestionId": "RESULT"}
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
        "description": "Uma experiência única com personagem 3D",
        "themeColor": "#8b5cf6",
        "avatar": "👤",
        "questions": [
            {
                "id": "q1",
                "title": "Vamos começar?",
                "characters": [
                    {
                        "id": "char1",
                        "name": "Assistente",
                        "avatar": "🤖",
                        "speech": "Olá! Vou te ajudar a encontrar a melhor solução."
                    }
                ],
                "options": [
                    {"id": "opt1", "text": "Sim, vamos!", "nextQuestionId": "RESULT"}
                ]
            }
        ]
    }'::jsonb
);
