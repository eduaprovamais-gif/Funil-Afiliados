import { supabase } from './supabase';
import type { Profile, Quiz, Template, PublishedQuiz } from '../types/database.types';

export const databaseService = {
    // --- Profiles ---
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    // --- Quizzes ---
    async getQuizzes(userId: string) {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Quiz[];
    },

    async getQuiz(quizId: string) {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    async createQuiz(quiz: Partial<Quiz>) {
        const { data, error } = await supabase
            .from('quizzes')
            .insert(quiz)
            .select()
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    async updateQuiz(quizId: string, updates: Partial<Quiz>) {
        const { data, error } = await supabase
            .from('quizzes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', quizId)
            .select()
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    async deleteQuiz(quizId: string) {
        // Soft delete
        const { error } = await supabase
            .from('quizzes')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', quizId);

        if (error) throw error;
        return true;
    },

    // --- Templates ---
    async getTemplates() {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('is_active', true)
            .order('usage_count', { ascending: false });

        if (error) throw error;
        return data as Template[];
    },

    // --- Published Quizzes ---
    async getPublishedQuiz(slug: string) {
        const { data, error } = await supabase
            .from('published_quizzes')
            .select('*, quiz:quizzes(*)')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data as (PublishedQuiz & { quiz: Quiz });
    },

    async publishQuiz(quizId: string, userId: string, slug: string) {
        const { data, error } = await supabase
            .from('published_quizzes')
            .upsert({
                quiz_id: quizId,
                user_id: userId,
                slug: slug,
                is_active: true,
                published_at: new Date().toISOString()
            }, { onConflict: 'quiz_id' })
            .select()
            .single();

        if (error) throw error;

        // Atualizar status no quiz
        await supabase.from('quizzes').update({ is_published: true }).eq('id', quizId);

        return data as PublishedQuiz;
    }
};
