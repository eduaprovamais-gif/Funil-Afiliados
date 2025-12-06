import { useState, useCallback } from 'react';
import { databaseService } from '../services/database.service';
import type { Profile, Quiz, Template } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext'; // Assumindo que existe ou será criado

export function useDatabase() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Profiles ---
    const getProfile = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            return await databaseService.getProfile(userId);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Quizzes ---
    const getQuizzes = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            return await databaseService.getQuizzes(userId);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createQuiz = useCallback(async (quizData: Partial<Quiz>) => {
        setLoading(true);
        try {
            return await databaseService.createQuiz(quizData);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateQuiz = useCallback(async (quizId: string, updates: Partial<Quiz>) => {
        setLoading(true);
        try {
            return await databaseService.updateQuiz(quizId, updates);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteQuiz = useCallback(async (quizId: string) => {
        setLoading(true);
        try {
            return await databaseService.deleteQuiz(quizId);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Templates ---
    const getTemplates = useCallback(async () => {
        setLoading(true);
        try {
            return await databaseService.getTemplates();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getProfile,
        getQuizzes,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        getTemplates
    };
}
