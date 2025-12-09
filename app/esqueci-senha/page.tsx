'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao enviar email de recuperação');
            }

            setSuccess(true);
            setEmail('');

        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="text-slate-400">Recupere o acesso à sua conta</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(8,145,178,0.1)]">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao login
                    </Link>

                    <h2 className="text-2xl font-bold text-white mb-2">Esqueci minha senha</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Digite seu email cadastrado e enviaremos instruções para redefinir sua senha.
                    </p>

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6">
                            <p className="text-green-400 text-sm font-medium">
                                ✅ Email enviado com sucesso!
                            </p>
                            <p className="text-green-400/80 text-xs mt-1">
                                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    placeholder="seu@email.com"
                                    required
                                    disabled={loading || success}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : success ? 'Email Enviado!' : 'Enviar email de recuperação'}
                        </button>

                        <p className="text-center text-slate-400 text-sm">
                            Lembrou a senha?{' '}
                            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                Fazer login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
