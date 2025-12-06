import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export interface Subscription {
    id: string;
    user_id: string;
    plan_type: 'free' | 'basic' | 'pro' | 'black';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    trial_ends_at: string | null;
    expires_at: string | null;
    created_at: string;
    kiwify_subscription_id?: string;
}

interface PlanLimits {
    maxQuizzes: number;
    hasPremiumTemplates: boolean;
    hasAdvancedAnalytics: boolean;
    hasWhiteLabel: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
    free: {
        maxQuizzes: 3,
        hasPremiumTemplates: false,
        hasAdvancedAnalytics: false,
        hasWhiteLabel: false,
    },
    basic: {
        maxQuizzes: 10,
        hasPremiumTemplates: false,
        hasAdvancedAnalytics: false,
        hasWhiteLabel: false,
    },
    pro: {
        maxQuizzes: 25,
        hasPremiumTemplates: true,
        hasAdvancedAnalytics: true,
        hasWhiteLabel: false,
    },
    black: {
        maxQuizzes: Infinity,
        hasPremiumTemplates: true,
        hasAdvancedAnalytics: true,
        hasWhiteLabel: true,
    },
};

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [quizCount, setQuizCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        loadSubscription();
    }, [user]);

    async function loadSubscription() {
        if (!user) return;

        try {
            // Buscar assinatura ativa do usuário
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'trial'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subError && subError.code !== 'PGRST116') {
                console.error('Erro ao buscar assinatura:', subError);
            }

            setSubscription(subData || null);

            // Contar funis do usuário
            const { count, error: countError } = await supabase
                .from('quizzes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('deleted', false);

            if (countError) {
                console.error('Erro ao contar funis:', countError);
            }

            setQuizCount(count || 0);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    }

    // Determinar plano atual
    const planType = subscription?.plan_type || 'free';
    const limits = PLAN_LIMITS[planType];

    // Verificar se pode criar mais funis
    const canCreateQuiz = quizCount < limits.maxQuizzes;
    const quizzesRemaining = Math.max(0, limits.maxQuizzes - quizCount);

    // Verificar se está em trial
    const isTrialActive = subscription?.status === 'trial' &&
        subscription?.trial_ends_at &&
        new Date(subscription.trial_ends_at) > new Date();

    // Calcular dias restantes do trial
    const trialDaysRemaining = subscription?.trial_ends_at
        ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    // URL de upgrade (você pode personalizar com seu link de afiliado)
    const upgradeUrl = planType === 'free' || planType === 'basic'
        ? '/pricing'
        : planType === 'pro'
            ? '/pricing?plan=black'
            : null;

    return {
        subscription,
        planType,
        limits,
        quizCount,
        canCreateQuiz,
        quizzesRemaining,
        isTrialActive,
        trialDaysRemaining,
        upgradeUrl,
        loading,
        refresh: loadSubscription,
    };
}
