-- =====================================================
-- MIGRATION COMPLETA - ORDEM CORRETA
-- Execute este arquivo INTEIRO de uma vez
-- =====================================================

-- =====================================================
-- 1. PROFILES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- 2. SUBSCRIPTIONS
-- =====================================================

CREATE TYPE public.plan_type AS ENUM ('basic', 'pro', 'black');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_type public.plan_type NOT NULL DEFAULT 'basic',
    status public.subscription_status NOT NULL DEFAULT 'trial',
    kiwify_subscription_id TEXT UNIQUE,
    kiwify_customer_id TEXT,
    kiwify_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    max_quizzes INTEGER NOT NULL DEFAULT 3,
    max_monthly_views INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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
    SELECT s.id, s.plan_type, s.status, s.max_quizzes, s.max_monthly_views, s.expires_at
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
        AND s.status IN ('active', 'trial')
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    ORDER BY CASE s.status WHEN 'active' THEN 1 WHEN 'trial' THEN 2 END, s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan_type, status, trial_ends_at, expires_at)
    VALUES (NEW.id, 'basic', 'trial', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_trial
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_trial_subscription();

GRANT SELECT ON public.subscriptions TO authenticated;

-- =====================================================
-- 3. TEMPLATES (ANTES DE QUIZZES!)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_premium BOOLEAN DEFAULT FALSE,
    required_plan public.plan_type,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view free templates"
    ON public.templates FOR SELECT
    USING (is_active = TRUE AND is_premium = FALSE);

CREATE TRIGGER set_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.templates TO anon, authenticated;

-- Inserir templates básicos
INSERT INTO public.templates (name, description, category, is_premium, template_data) VALUES
('Quiz Básico', 'Template simples para começar rapidamente', 'geral', FALSE, 
 '{"id":"template-basic","title":"Meu Quiz","description":"Descubra qual é o melhor produto para você","themeColor":"#0ea5e9","avatar":"🎯","questions":[{"id":"q1","title":"Qual é o seu principal objetivo?","options":[{"id":"opt1","text":"Aumentar vendas","nextQuestionId":"RESULT"},{"id":"opt2","text":"Gerar leads","nextQuestionId":"RESULT"}]}]}'::jsonb
),
('Quiz com Personagem', 'Template com personagem 3D interativo', 'geral', FALSE,
 '{"id":"template-character","title":"Quiz Interativo","description":"Uma experiência única","themeColor":"#8b5cf6","avatar":"👤","questions":[{"id":"q1","title":"Vamos começar?","characters":[{"id":"char1","name":"Assistente","avatar":"🤖","speech":"Olá!"}],"options":[{"id":"opt1","text":"Sim!","nextQuestionId":"RESULT"}]}]}'::jsonb
);

-- =====================================================
-- 4. QUIZZES (AGORA PODE REFERENCIAR TEMPLATES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme_color TEXT DEFAULT '#0ea5e9',
    avatar TEXT DEFAULT '🎯',
    tone TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON public.quizzes(user_id);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes"
    ON public.quizzes FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can insert own quizzes"
    ON public.quizzes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
    ON public.quizzes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TRIGGER set_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;

-- =====================================================
-- 5. PUBLISHED QUIZZES (AGORA PODE REFERENCIAR QUIZZES)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.published_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL UNIQUE REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    custom_domain TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unpublished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.published_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active published quizzes"
    ON public.published_quizzes FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Users can publish own quizzes"
    ON public.published_quizzes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_published_quizzes_updated_at
    BEFORE UPDATE ON public.published_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.generate_unique_slug(p_title TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_base_slug TEXT;
    v_slug TEXT;
    v_counter INTEGER := 0;
BEGIN
    v_base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
    v_base_slug := trim(both '-' from v_base_slug);
    v_slug := v_base_slug;
    
    WHILE EXISTS(SELECT 1 FROM public.published_quizzes WHERE slug = v_slug) LOOP
        v_counter := v_counter + 1;
        v_slug := v_base_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_quizzes TO authenticated;
GRANT SELECT ON public.published_quizzes TO anon;

-- =====================================================
-- 6. QUIZ ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quiz_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_views INTEGER DEFAULT 0,
    total_starts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_time_seconds INTEGER DEFAULT 0,
    step_analytics JSONB DEFAULT '[]'::jsonb,
    device_breakdown JSONB DEFAULT '{}'::jsonb,
    referrer_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_quiz_date UNIQUE (quiz_id, analytics_date)
);

ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz analytics"
    ON public.quiz_analytics FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.quizzes WHERE quizzes.id = quiz_analytics.quiz_id AND quizzes.user_id = auth.uid()));

CREATE TRIGGER set_quiz_analytics_updated_at
    BEFORE UPDATE ON public.quiz_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.increment_quiz_view(p_quiz_id UUID, p_device_type TEXT DEFAULT 'desktop')
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.quiz_analytics (quiz_id, analytics_date, total_views, device_breakdown)
    VALUES (p_quiz_id, CURRENT_DATE, 1, jsonb_build_object(p_device_type, 1))
    ON CONFLICT (quiz_id, analytics_date)
    DO UPDATE SET
        total_views = quiz_analytics.total_views + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT ON public.quiz_analytics TO authenticated;

-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================
