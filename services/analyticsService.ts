import { supabase } from './supabase';
import { QuizAnalytics } from '../types/database.types';

export const analyticsService = {
    async getQuizAnalytics(quizId: string) {
        const { data, error } = await supabase
            .from('quiz_analytics')
            .select('*')
            .eq('quiz_id', quizId)
            .order('analytics_date', { ascending: false });

        if (error) throw error;
        return data as QuizAnalytics[];
    },

    async getAnalyticsSummary(quizId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .rpc('get_quiz_analytics_summary', {
                p_quiz_id: quizId,
                p_start_date: startDate,
                p_end_date: endDate
            });

        if (error) throw error;
        return data;
    },

    async trackView(quizId: string, deviceType: string = 'desktop', referrer: string = '') {
        const { error } = await supabase
            .rpc('increment_quiz_view', {
                p_quiz_id: quizId,
                p_device_type: deviceType,
                p_referrer: referrer
            });

        if (error) console.error('Error tracking view:', error);
    },

    async trackStart(quizId: string) {
        const { error } = await supabase
            .rpc('track_quiz_start', {
                p_quiz_id: quizId
            });

        if (error) console.error('Error tracking start:', error);
    },

    async trackCompletion(quizId: string) {
        const { error } = await supabase
            .rpc('track_quiz_completion', {
                p_quiz_id: quizId
            });

        if (error) console.error('Error tracking completion:', error);
    }
};
