import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../services/supabase';
import { BarChart3, Plus, TrendingUp, Users, Eye, Trash2, Edit, Copy, ExternalLink } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    slug?: string;
    views?: number;
    conversions?: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { planType, quizCount, limits, quizzesRemaining, isTrialActive, trialDaysRemaining } = useSubscription();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalViews, setTotalViews] = useState(0);
    const [totalConversions, setTotalConversions] = useState(0);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    async function loadDashboardData() {
        if (!user) return;

        try {
            // Carregar funis do usuário
            const { data: quizzesData, error: quizzesError } = await supabase
                .from('quizzes')
                .select(`
          id,
          title,
          created_at,
          updated_at,
          published_quizzes (
            slug,
            is_active
          )
        `)
                .eq('user_id', user.id)
                .eq('deleted', false)
                .order('updated_at', { ascending: false });

            if (quizzesError) throw quizzesError;

            // Buscar analytics para cada funil publicado
            const quizzesWithStats = await Promise.all(
                (quizzesData || []).map(async (quiz: any) => {
                    const publishedQuiz = quiz.published_quizzes?.[0];

                    if (publishedQuiz?.slug) {
                        const { data: analytics } = await supabase
                            .from('quiz_analytics')
                            .select('views, conversions')
                            .eq('quiz_id', quiz.id)
                            .single();

                        return {
                            id: quiz.id,
                            title: quiz.title,
                            created_at: quiz.created_at,
                            updated_at: quiz.updated_at,
                            is_published: publishedQuiz?.is_active || false,
                            slug: publishedQuiz?.slug,
                            views: analytics?.views || 0,
                            conversions: analytics?.conversions || 0,
                        };
                    }

                    return {
                        id: quiz.id,
                        title: quiz.title,
                        created_at: quiz.created_at,
                        updated_at: quiz.updated_at,
                        is_published: false,
                        views: 0,
                        conversions: 0,
                    };
                })
            );

            setQuizzes(quizzesWithStats);

            // Calcular totais
            const views = quizzesWithStats.reduce((sum, q) => sum + (q.views || 0), 0);
            const conversions = quizzesWithStats.reduce((sum, q) => sum + (q.conversions || 0), 0);

            setTotalViews(views);
            setTotalConversions(conversions);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteQuiz(quizId: string) {
        if (!confirm('Tem certeza que deseja excluir este funil?')) return;

        try {
            const { error } = await supabase
                .from('quizzes')
                .update({ deleted: true })
                .eq('id', quizId);

            if (error) throw error;

            setQuizzes(quizzes.filter(q => q.id !== quizId));
        } catch (error) {
            console.error('Erro ao excluir funil:', error);
            alert('Erro ao excluir funil. Tente novamente.');
        }
    }

    async function handleDuplicateQuiz(quizId: string) {
        try {
            // Buscar dados do funil original
            const { data: originalQuiz, error: fetchError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single();

            if (fetchError) throw fetchError;

            // Criar cópia
            const { data: newQuiz, error: createError } = await supabase
                .from('quizzes')
                .insert({
                    user_id: user?.id,
                    title: `${originalQuiz.title} (Cópia)`,
                    quiz_data: originalQuiz.quiz_data,
                })
                .select()
                .single();

            if (createError) throw createError;

            // Recarregar lista
            loadDashboardData();
            alert('Funil duplicado com sucesso!');
        } catch (error) {
            console.error('Erro ao duplicar funil:', error);
            alert('Erro ao duplicar funil. Tente novamente.');
        }
    }

    const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Bem-vindo de volta, {user?.email}
                    </p>
                </div>

                {/* Trial Alert */}
                {isTrialActive && (
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-yellow-800">
                            ⏰ Seu trial gratuito expira em <strong>{trialDaysRemaining} dias</strong>.{' '}
                            <a href="/pricing" className="underline font-bold">
                                Assine agora
                            </a>{' '}
                            para continuar usando o XQuiz!
                        </p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Funis Criados</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {quizCount}
                                    <span className="text-lg text-gray-500">/{limits.maxQuizzes === Infinity ? '∞' : limits.maxQuizzes}</span>
                                </p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-purple-500" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {quizzesRemaining} funis restantes
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total de Visualizações</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalViews}</p>
                            </div>
                            <Eye className="w-10 h-10 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Todos os funis
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Conversões</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalConversions}</p>
                            </div>
                            <Users className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Total de leads
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Taxa de Conversão</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Média geral
                        </p>
                    </div>
                </div>

                {/* Plan Info */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Plano {planType.toUpperCase()}</h3>
                            <p className="mt-1 opacity-90">
                                {limits.maxQuizzes === Infinity ? 'Funis ilimitados' : `Até ${limits.maxQuizzes} funis`}
                                {limits.hasPremiumTemplates && ' • Templates Premium'}
                                {limits.hasAdvancedAnalytics && ' • Analytics Avançado'}
                            </p>
                        </div>
                        {planType !== 'black' && (
                            <a
                                href="/pricing"
                                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
                            >
                                Fazer Upgrade
                            </a>
                        )}
                    </div>
                </div>

                {/* Quizzes List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Meus Funis</h2>
                        <button
                            onClick={() => navigate('/builder')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Novo Funil
                        </button>
                    </div>

                    {quizzes.length === 0 ? (
                        <div className="p-12 text-center">
                            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhum funil criado ainda
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Comece criando seu primeiro funil de vendas!
                            </p>
                            <button
                                onClick={() => navigate('/builder')}
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
                            >
                                Criar Primeiro Funil
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {quizzes.map((quiz) => (
                                <div key={quiz.id} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {quiz.title}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                <span>Criado em {new Date(quiz.created_at).toLocaleDateString('pt-BR')}</span>
                                                {quiz.is_published && (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        Publicado
                                                    </span>
                                                )}
                                            </div>
                                            {quiz.is_published && (
                                                <div className="flex items-center gap-6 mt-3 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {quiz.views} visualizações
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {quiz.conversions} conversões
                                                    </span>
                                                    <span className="text-gray-500">
                                                        Taxa: {quiz.views > 0 ? ((quiz.conversions / quiz.views) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {quiz.is_published && quiz.slug && (
                                                <a
                                                    href={`/quiz/${quiz.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Ver funil público"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => navigate(`/builder?id=${quiz.id}`)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateQuiz(quiz.id)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                title="Duplicar"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
