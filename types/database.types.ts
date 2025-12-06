export type PlanType = 'basic' | 'pro' | 'black';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_type: PlanType;
    status: SubscriptionStatus;
    kiwify_subscription_id?: string;
    kiwify_customer_id?: string;
    kiwify_data?: any;
    expires_at?: string;
    trial_ends_at?: string;
    max_quizzes: number;
    max_monthly_views: number;
}

export interface Quiz {
    id: string;
    user_id: string;
    template_id?: string;
    title: string;
    description?: string;
    quiz_data: any; // Consider defining a more specific type for quiz structure
    theme_color?: string;
    avatar?: string;
    settings?: any;
    is_published: boolean;
    is_deleted: boolean;
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PublishedQuiz {
    id: string;
    quiz_id: string;
    user_id: string;
    slug: string;
    custom_domain?: string;
    is_active: boolean;
    published_at: string;
}

export interface QuizAnalytics {
    id: string;
    quiz_id: string;
    analytics_date: string;
    total_views: number;
    total_starts: number;
    total_completions: number;
    unique_visitors: number;
    conversion_rate: number;
    completion_rate: number;
    average_time_seconds: number;
    step_analytics?: any;
    device_breakdown?: any;
}

export interface Template {
    id: string;
    name: string;
    description?: string;
    category?: string;
    thumbnail_url?: string;
    template_data: any;
    is_premium: boolean;
    required_plan?: PlanType;
    is_active: boolean;
    usage_count: number;
}
