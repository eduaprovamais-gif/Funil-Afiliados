import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  // Initialize from localStorage if available, otherwise use demoQuiz
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(() => {
    const saved = localStorage.getItem('quiz_autosave');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved quiz', e);
      }
    }
    return demoQuiz;
  });

  // Auto-save to localStorage whenever quiz changes
  useEffect(() => {
    localStorage.setItem('quiz_autosave', JSON.stringify(currentQuiz));
  }, [currentQuiz]);

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
