'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getCurrentUser, getUserSubscription } from '../../lib/supabase';
import { Brain, LogOut, TrendingUp, Calendar, Package } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadUserData();
    }, []);

    async function loadUserData() {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        const sub = await getUserSubscription(currentUser.id);
        setSubscription(sub);
        setLoading(false);
    }

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        );
    }

    const planNames = {
        basico: 'Básico',
        pro: 'Pro',
        premium: 'Premium'
    };

    const percentUsed = subscription
        ? (subscription.quota_used / subscription.quota_limit) * 100
        : 0;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            {/* Header */}
            <header className="bg-white/5 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Brain className="w-8 h-8 text-cyan-400" />
                            <span className="text-xl font-bold">O Licitador</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-slate-400 mb-8">Bem-vindo, {user?.email}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Plan Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Package className="w-6 h-6 text-cyan-400" />
                            <h3 className="font-semibold">Plano Atual</h3>
                        </div>
                        <p className="text-2xl font-bold text-cyan-400">
                            {subscription ? planNames[subscription.plan as keyof typeof planNames] : 'N/A'}
                        </p>
                    </div>

                    {/* Usage Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            <h3 className="font-semibold">Uso do Mês</h3>
                        </div>
                        <p className="text-2xl font-bold">
                            {subscription?.quota_used || 0} / {subscription?.quota_limit || 0}
                        </p>
                        <div className="mt-3 bg-white/10 rounded-full h-2">
                            <div
                                className="bg-cyan-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                            />
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                            {subscription ? subscription.quota_limit - subscription.quota_used : 0} análises restantes
                        </p>
                    </div>

                    {/* Period Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="w-6 h-6 text-purple-400" />
                            <h3 className="font-semibold">Próximo Reset</h3>
                        </div>
                        <p className="text-2xl font-bold">
                            {subscription
                                ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                                : 'N/A'
                            }
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/analise"
                            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        >
                            Nova Análise
                        </Link>
                    </div>
                </div>

                {/* Info Box */}
                {subscription && subscription.quota_used >= subscription.quota_limit * 0.8 && (
                    <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
                        <h3 className="font-bold text-yellow-400 mb-2">⚠️ Atenção: Quota quase esgotada</h3>
                        <p className="text-slate-300">
                            Você já usou {Math.round(percentUsed)}% da sua quota mensal.
                            Considere fazer upgrade para continuar usando sem interrupções.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
