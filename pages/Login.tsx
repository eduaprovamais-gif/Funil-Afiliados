import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const { signIn, signInWithGoogle, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            if (error.message === 'Invalid login credentials') {
                setError('Email ou senha incorretos');
            } else if (error.message.includes('Email not confirmed')) {
                setError('Por favor, confirme seu email antes de entrar.');
            } else {
                setError('Erro ao fazer login. Tente novamente.');
            }
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            setError('Erro ao conectar com Google');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setResetMessage('');

        const { error } = await resetPassword(resetEmail);

        if (error) {
            setResetMessage('Erro ao enviar email. Tente novamente.');
        } else {
            setResetMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
            setTimeout(() => setShowResetPassword(false), 3000);
        }
        setResetLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px'
                    }}>
                        XQuiz
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Entre na sua conta
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            background: '#fee',
                            color: '#c33',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                transition: 'border-color 0.2s',
                                outline: 'none',
                                color: '#333',
                                backgroundColor: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                transition: 'border-color 0.2s',
                                outline: 'none',
                                color: '#333',
                                backgroundColor: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                        <button
                            type="button"
                            onClick={() => setShowResetPassword(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#667eea',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            marginBottom: '16px'
                        }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                        <span style={{ padding: '0 10px', color: '#999', fontSize: '12px' }}>OU</span>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'white',
                            color: '#333',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px' }} />
                        Entrar com Google
                    </button>
                </form>

                {/* Link para registro */}
                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    Não tem uma conta?{' '}
                    <a
                        href="/register"
                        style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Criar conta grátis
                    </a>
                </div>

                {/* Trial info */}
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: '#f0f4ff',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#667eea'
                }}>
                    🎉 7 dias de teste grátis ao criar sua conta
                </div>
            </div>

            {/* Modal Reset Senha */}
            {showResetPassword && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowResetPassword(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#999'
                            }}
                        >
                            ×
                        </button>

                        <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Recuperar Senha</h3>
                        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                            Digite seu email para receber o link de redefinição de senha.
                        </p>

                        {resetMessage && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '15px',
                                fontSize: '14px',
                                background: resetMessage.includes('Erro') ? '#fee' : '#e6fffa',
                                color: resetMessage.includes('Erro') ? '#c33' : '#2c7a7b'
                            }}>
                                {resetMessage}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword}>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="Seu email cadastrado"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={resetLoading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: resetLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {resetLoading ? 'Enviando...' : 'Enviar Link'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
