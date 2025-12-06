import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { trackQuizView, trackQuizConversion } from '../services/quizService';
import { Quiz } from '../types';
import QuizPreview from '../components/QuizPreview';

export default function PublicQuiz() {
    const { slug } = useParams<{ slug: string }>();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadPublicQuiz(slug);
        }
    }, [slug]);

    async function loadPublicQuiz(slug: string) {
        try {
            // Buscar funil publicado pelo slug
            const { data: published, error: publishedError } = await supabase
                .from('published_quizzes')
                .select(`
          quiz_id,
          is_active,
          quizzes (
            id,
            title,
            description,
            quiz_data
          )
        `)
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (publishedError) throw publishedError;

            if (!published || !published.quizzes) {
                setError('Funil não encontrado ou não está mais ativo.');
                setLoading(false);
                return;
            }

            const quizData = (published.quizzes as any).quiz_data as Quiz;
            setQuiz(quizData);

            // Rastrear visualização
            await trackQuizView((published.quizzes as any).id);
        } catch (err) {
            console.error('Erro ao carregar funil público:', err);
            setError('Erro ao carregar funil. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    }

    async function handleQuizComplete() {
        if (quiz) {
            // Rastrear conversão
            const { data: published } = await supabase
                .from('published_quizzes')
                .select('quiz_id')
                .eq('slug', slug)
                .single();

            if (published) {
                await trackQuizConversion(published.quiz_id);
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                    <p className="mt-6 text-gray-600 text-lg">Carregando funil...</p>
                </div>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">😕</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Funil não encontrado
                    </h1>
                    <p className="text-gray-600 mb-8">
                        {error || 'Este funil não existe ou não está mais disponível.'}
                    </p>
                    <a
                        href="/"
                        className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                        Voltar para Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <QuizPreview
                quiz={quiz}
                onClose={() => window.location.href = '/'}
                onComplete={handleQuizComplete}
                isPublicView={true}
            />
        </div>
    );
}
