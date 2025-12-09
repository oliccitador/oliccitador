'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import { Brain, Lock, Eye, EyeOff } from 'lucide-react';

function SetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isPasswordLocked, setIsPasswordLocked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handlePasswordRecovery = async () => {
            const supabase = createClient();

            // 1. Listen for auth state changes (best for catching the URL session)
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (process.env.NODE_ENV !== 'production') console.log('Auth event:', event);
                if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                    if (session?.user?.email) {
                        setUserEmail(session.user.email);

                        // Verificar se é usuário de feedback com senha bloqueada
                        const passwordLocked = session.user.user_metadata?.password_locked === true;
                        setIsPasswordLocked(passwordLocked);

                        setIsReady(true);
                    }
                }
            });

            // 2. Check current session immediately
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setUserEmail(session.user.email);

                // Verificar se é usuário de feedback
                const passwordLocked = session.user.user_metadata?.password_locked === true;
                setIsPasswordLocked(passwordLocked);

                setIsReady(true);
                return;
            }

            // 3. Fallback: Manually parse hash if getSession failed but hash exists
            // This handles cases where the client might not have picked up the hash yet
            if (window.location.hash && window.location.hash.includes('access_token')) {
                if (process.env.NODE_ENV !== 'production') console.log('Manual hash parsing triggered');
                try {
                    // Extract tokens from hash
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (!error && data.session?.user?.email) {
                            setUserEmail(data.session.user.email);
                            setIsReady(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Manual parsing error:', e);
                }
            }

            // If we're still here after a short delay, assume failure
            // But give onAuthStateChange a moment to fire
            setTimeout(() => {
                if (!userEmail) { // Check state, not local var, but we can't access state in timeout easily without ref
                    // We'll rely on the UI showing "Verificando..." until isReady is true
                    // If after 3 seconds isReady is still false, we show error
                    // But here we just set error if we are sure. 
                    // Let's just set a timeout to show error if nothing happened
                    setIsReady((prev) => {
                        if (!prev) {
                            setError('Link inválido ou expirado (timeout)');
                            return true;
                        }
                        return prev;
                    });
                }
            }, 3000);
        };

        handlePasswordRecovery();
    }, []);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();

            // Update user password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login?password_set=true');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao definir senha');
        } finally {
            setLoading(false);
        }
    };

    if (!isReady) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Verificando link...</p>
                </div>
            </div>
        );
    }

    if (!userEmail) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Link Inválido</h2>
                    <p className="text-slate-400 mb-6">Este link de ativação é inválido ou expirou.</p>
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                        Ir para Login
                    </Link>
                </div>
            </div>
        );
    }

    // BLOQUEIO: Usuários de feedback não podem alterar senha
    if (isPasswordLocked) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <Brain className="w-12 h-12 text-cyan-400" />
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                O Licitador
                            </span>
                        </Link>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)]">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Senha Bloqueada</h2>
                            <p className="text-slate-300 mb-6">
                                📧 <strong>{userEmail}</strong>
                            </p>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-200 mb-6 text-left">
                                <p className="mb-2">
                                    🔒 <strong>Conta de Teste/Feedback</strong>
                                </p>
                                <p className="mb-2">
                                    Esta conta possui uma senha <strong>pré-estabelecida</strong> pelo time de desenvolvimento e não pode ser alterada por questões de segurança e controle de acesso.
                                </p>
                                <p>
                                    Se você esqueceu a senha, entre em contato com o administrador.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-block py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                Voltar ao Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <Brain className="w-12 h-12 text-cyan-400" />
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            O Licitador
                        </span>
                    </Link>
                    <p className="text-slate-400">Defina sua senha para acessar</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)]">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Senha definida!</h2>
                            <p className="text-slate-400">Redirecionando para login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSetPassword} className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center mb-6">Defina sua Senha</h2>

                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-sm text-cyan-200">
                                📧 Conta: <strong>{userEmail}</strong>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Digite a senha novamente"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Definindo senha...' : 'Definir Senha e Acessar'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        }>
            <SetPasswordForm />
        </Suspense>
    );
}
