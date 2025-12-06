import { supabase } from './supabase';
import { Quiz } from '../types';

export interface SaveQuizParams {
    userId: string;
    quiz: Quiz;
    quizId?: string; // Se fornecido, atualiza; senão, cria novo
}

export interface PublishQuizParams {
    quizId: string;
    slug?: string; // Se não fornecido, gera automaticamente
}

/**
 * Salva ou atualiza um funil no Supabase
 */
export async function saveQuiz({ userId, quiz, quizId }: SaveQuizParams) {
    try {
        const quizData = {
            user_id: userId,
            title: quiz.title,
            description: quiz.description,
            quiz_data: quiz, // Salva o objeto completo como JSONB
        };

        if (quizId) {
            // Atualizar funil existente
            const { data, error } = await supabase
                .from('quizzes')
                .update(quizData)
                .eq('id', quizId)
                .eq('user_id', userId) // Segurança: só atualiza se for do usuário
                .select()
                .single();

            if (error) throw error;
            return { success: true, quiz: data };
        } else {
            // Criar novo funil
            const { data, error } = await supabase
                .from('quizzes')
                .insert(quizData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, quiz: data };
        }
    } catch (error) {
        console.error('Erro ao salvar funil:', error);
        return { success: false, error };
    }
}

/**
 * Carrega um funil específico
 */
export async function loadQuiz(quizId: string) {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .eq('deleted', false)
            .single();

        if (error) throw error;

        // Retorna o quiz_data que contém o objeto Quiz completo
        return { success: true, quiz: data.quiz_data as Quiz, dbQuiz: data };
    } catch (error) {
        console.error('Erro ao carregar funil:', error);
        return { success: false, error };
    }
}

/**
 * Carrega todos os funis do usuário
 */
export async function loadUserQuizzes(userId: string) {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', userId)
            .eq('deleted', false)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return { success: true, quizzes: data };
    } catch (error) {
        console.error('Erro ao carregar funis:', error);
        return { success: false, error };
    }
}

/**
 * Gera um slug único para o funil
 */
function generateSlug(title: string): string {
    const baseSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por -
        .replace(/^-+|-+$/g, ''); // Remove - do início e fim

    // Adiciona timestamp para garantir unicidade
    return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Publica um funil (torna-o acessível publicamente)
 */
export async function publishQuiz({ quizId, slug }: PublishQuizParams) {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar o funil
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        if (quizError) throw quizError;

        // Gerar slug se não fornecido
        const finalSlug = slug || generateSlug(quiz.title);

        // Verificar se slug já existe
        const { data: existing } = await supabase
            .from('published_quizzes')
            .select('slug')
            .eq('slug', finalSlug)
            .single();

        if (existing) {
            throw new Error('Este slug já está em uso. Tente outro título.');
        }

        // Criar ou atualizar publicação
        const { data: published, error: publishError } = await supabase
            .from('published_quizzes')
            .upsert({
                quiz_id: quizId,
                user_id: user.id,
                slug: finalSlug,
                is_active: true
            }, {
                onConflict: 'quiz_id'
            })
            .select()
            .single();

        if (publishError) {
            console.error('Erro ao publicar:', publishError);
            throw publishError;
        }

        // Criar registro de analytics se não existir
        const { error: analyticsError } = await supabase
            .from('quiz_analytics')
            .upsert({
                quiz_id: quizId,
                views: 0,
                conversions: 0,
            }, {
                onConflict: 'quiz_id'
            });

        if (analyticsError) {
            console.error('Erro ao criar analytics:', analyticsError);
            // Não falha a publicação por causa disso
        }

        return {
            success: true,
            slug: finalSlug,
            url: `${window.location.origin}/quiz/${finalSlug}`,
            published,
        };
    } catch (error) {
        console.error('Erro ao publicar funil:', error);
        return { success: false, error };
    }
}

/**
 * Despublica um funil
 */
export async function unpublishQuiz(quizId: string) {
    try {
        const { error } = await supabase
            .from('published_quizzes')
            .update({ is_active: false })
            .eq('quiz_id', quizId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao despublicar funil:', error);
        return { success: false, error };
    }
}

/**
 * Deleta um funil (soft delete)
 */
export async function deleteQuiz(quizId: string, userId: string) {
    try {
        const { error } = await supabase
            .from('quizzes')
            .update({ deleted: true })
            .eq('id', quizId)
            .eq('user_id', userId); // Segurança

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar funil:', error);
        return { success: false, error };
    }
}

/**
 * Duplica um funil
 */
export async function duplicateQuiz(quizId: string, userId: string) {
    try {
        // Buscar funil original
        const { data: original, error: fetchError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        // Criar cópia
        const quizData = original.quiz_data as Quiz;
        const { data: duplicate, error: createError } = await supabase
            .from('quizzes')
            .insert({
                user_id: userId,
                title: `${original.title} (Cópia)`,
                description: original.description,
                quiz_data: {
                    ...quizData,
                    id: `quiz-${Date.now()}`,
                    title: `${quizData.title} (Cópia)`,
                },
            })
            .select()
            .single();

        if (createError) throw createError;
        return { success: true, quiz: duplicate };
    } catch (error) {
        console.error('Erro ao duplicar funil:', error);
        return { success: false, error };
    }
}

/**
 * Incrementa visualizações do funil
 */
export async function trackQuizView(quizId: string) {
    try {
        const { error } = await supabase.rpc('increment_quiz_views', {
            p_quiz_id: quizId,
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao rastrear visualização:', error);
        return { success: false, error };
    }
}

/**
 * Incrementa conversões do funil
 */
export async function trackQuizConversion(quizId: string) {
    try {
        const { error } = await supabase.rpc('track_quiz_completion', {
            p_quiz_id: quizId,
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao rastrear conversão:', error);
        return { success: false, error };
    }
}
