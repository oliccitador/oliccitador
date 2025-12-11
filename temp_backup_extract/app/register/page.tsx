'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import { Brain, Mail, Lock, User, CheckCircle } from 'lucide-react';

function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');

    const planNames = {
        basico: 'Básico',
        pro: 'Pro',
        premium: 'Premium'
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const supabase = createClient();

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        intended_plan: plan // Save intended plan in metadata
                    }
                }
            });

            if (signUpError) throw signUpError;

            // If a plan was selected, redirect to checkout
            if (plan && ['basico', 'pro', 'premium'].includes(plan)) {
                setSuccess(true); // Show success briefly

                try {
                    // We need to sign in immediately to create the checkout session linked to the user
                    // But signUp with email confirmation usually doesn't sign in immediately unless auto-confirm is on.
                    // If email confirmation is required, we can't create the checkout session yet because we don't have a session.
                    // However, Supabase usually returns a session if email confirm is disabled or if it's the first time.
                    // Let's check if we have a session.

                    if (data.session) {
                        const response = await fetch('/api/checkout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ plan }),
                        });

                        const checkoutData = await response.json();
                        if (checkoutData.url) {
                            window.location.href = checkoutData.url;
                            return;
                        }
                    } else {
                        // Email confirmation required
                        setTimeout(() => {
                            router.push(`/login?registered=true&plan=${plan}`);
                        }, 2000);
                        return;
                    }

                } catch (checkoutError) {
                    console.error('Checkout redirect error:', checkoutError);
                    // Fallback to login
                }
            }

            setSuccess(true);

            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="text-slate-400">Crie sua conta e comece a analisar</p>
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
                            <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
                            <p className="text-slate-400">Redirecionando para login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center mb-6">Criar Conta</h2>

                            {plan && planNames[plan as keyof typeof planNames] && (
                                <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-cyan-200 font-medium">Você escolheu o plano {planNames[plan as keyof typeof planNames]}</p>
                                        <p className="text-cyan-200/70 text-sm mt-1">Crie sua conta para finalizar a assinatura.</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
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
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Mínimo 6 caracteres"
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
                                {loading ? 'Criando conta...' : 'Criar Conta'}
                            </button>

                            {/* Login Link */}
                            <p className="text-center text-slate-400 text-sm">
                                Já tem uma conta?{' '}
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                    Fazer login
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
