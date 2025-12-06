import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import LandingPage from './components/LandingPage';
import QuizBuilder from './components/QuizBuilder';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import PublicQuiz from './pages/PublicQuiz';
import { useState, useEffect, ReactNode } from 'react';
import { Quiz } from './types';
import { demoQuiz } from './data/demoQuiz';
import { loadQuiz } from './services/quizService';

// Componente para proteger rotas
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente principal do Builder
function BuilderPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizData = async () => {
      const quizId = searchParams.get('id');
      
      if (quizId && user) {
        // Carrega do Supabase se houver um ID
        try {
          const result = await loadQuiz(quizId);
          if (result.success && result.quiz) {
            setCurrentQuiz(result.quiz);
          } else {
            // Fallback se não encontrar
            const saved = localStorage.getItem('quiz_autosave');
            setCurrentQuiz(saved ? JSON.parse(saved) : demoQuiz);
          }
        } catch (error) {
          console.error('Erro ao carregar quiz:', error);
          const saved = localStorage.getItem('quiz_autosave');
          setCurrentQuiz(saved ? JSON.parse(saved) : demoQuiz);
        }
      } else {
        // Se não houver ID, usa localStorage ou demo
        const saved = localStorage.getItem('quiz_autosave');
        setCurrentQuiz(saved ? JSON.parse(saved) : demoQuiz);
      }
      setLoading(false);
    };

    loadQuizData();
  }, [searchParams, user]);

  // Auto-save to localStorage whenever quiz changes
  useEffect(() => {
    if (currentQuiz) {
      localStorage.setItem('quiz_autosave', JSON.stringify(currentQuiz));
    }
  }, [currentQuiz]);

  if (loading || !currentQuiz) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Carregando seu funil...</p>
        </div>
      </div>
    );
  }

  return (
    <QuizBuilder
      quiz={currentQuiz}
      setQuiz={setCurrentQuiz}
      onExit={() => window.location.href = '/'}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/quiz/:slug" element={<PublicQuiz />} />

            {/* Landing page pública */}
            <Route
              path="/landing"
              element={
                <LandingPage
                  onLogin={() => window.location.href = '/login'}
                  onCtaClick={() => window.location.href = '/register'}
                />
              }
            />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder"
              element={
                <ProtectedRoute>
                  <BuilderPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
