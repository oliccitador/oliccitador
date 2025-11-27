'use client';

import Link from 'next/link';
import { Check, Brain, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PricingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubscribe = (plan: string) => {
        setSelectedPlan(plan);
        setShowEmailModal(true);
        setError('');
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (email !== confirmEmail) {
            setError('Os emails não coincidem');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/checkout/mercadopago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: selectedPlan }),
            });

            const data = await response.json();

            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                setError(data.error || 'Erro ao processar pagamento');
                setLoading(false);
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100 selection:bg-cyan-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Brain className="w-8 h-8 text-cyan-400" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                O Licitador
                            </span>
                        </Link>

                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                <Link href="/" className="hover:text-cyan-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                                <Link href="/analise" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(8,145,178,0.7)]">
                                    Começar Análise
                                </Link>
                            </div>
                        </div>

                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-[#0f172a] border-b border-white/10">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <Link href="/" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Home</Link>
                            <Link href="/login" className="text-cyan-400 block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                            <Link href="/analise" className="bg-cyan-600 text-white block px-3 py-2 rounded-md text-base font-bold mt-4 text-center">
                                Começar Análise
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-400">
                    Planos O Licitador
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Escolha o plano que melhor se adapta à sua necessidade e comece a vencer licitações hoje mesmo.
                </p>
            </section>

            {/* Black Friday Banner */}
            <section className="pb-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-1">
                        <div className="bg-slate-900 rounded-xl p-6 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <span className="text-4xl">🔥</span>
                                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                                    BLACK FRIDAY
                                </h2>
                                <span className="text-4xl">🔥</span>
                            </div>
                            <p className="text-lg md:text-xl text-white font-bold">
                                Até <span className="text-yellow-400 text-2xl">75% OFF</span> + Bônus Exclusivos!
                            </p>
                            <p className="text-sm text-slate-300 mt-2">
                                Valores válidos para assinaturas realizadas até o dia <strong className="text-yellow-400">10/12/2025</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-24 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Básico Tier */}
                    <div className="relative p-8 bg-white/5 border border-yellow-500/30 rounded-3xl hover:bg-white/10 transition-all flex flex-col">
                        <div className="absolute -top-3 -right-3 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            50% OFF
                        </div>
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-white">Básico Black Friday</h3>
                            <p className="text-slate-400 text-sm">Para quem está começando</p>
                        </div>
                        <div className="mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-500 line-through">R$ 39</span>
                            </div>
                            <span className="text-4xl font-bold text-yellow-400">R$ 19,90</span>
                            <span className="text-slate-500">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-cyan-400" /> <strong>50 análises/mês</strong>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-cyan-400" /> Todas as 4 Regras de Ouro
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-cyan-400" /> Busca de Mercado
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-cyan-400" /> Justificativa Técnica
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-cyan-400" /> Suporte por email
                            </li>
                        </ul>
                        <button onClick={() => handleSubscribe('basico')} className="w-full py-3 rounded-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                            Assinar Agora
                        </button>
                    </div>

                    {/* Pro Tier (Highlighted) */}
                    <div className="relative p-8 bg-gradient-to-b from-cyan-900/20 to-slate-900/40 border border-cyan-500/50 rounded-3xl shadow-[0_0_30px_rgba(8,145,178,0.15)] transform md:-translate-y-4 flex flex-col">
                        <div className="absolute top-0 right-0 bg-cyan-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                            MAIS POPULAR
                        </div>
                        <div className="absolute -top-3 -left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            55% OFF
                        </div>
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-white">Pro Black Friday</h3>
                            <p className="text-cyan-200/70 text-sm">Ideal para profissionais</p>
                        </div>
                        <div className="mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-500 line-through">R$ 89</span>
                            </div>
                            <span className="text-4xl font-bold text-white">R$ 39,90</span>
                            <span className="text-slate-500">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> <strong>150 análises/mês</strong>
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> Todas as 4 Regras de Ouro
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> Busca de Mercado Avançada
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> Justificativa Técnica Jurídica
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> Exportação em PDF
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-cyan-400" /> Suporte prioritário
                            </li>
                        </ul>
                        <button onClick={() => handleSubscribe('pro')} className="w-full py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105">
                            Assinar Pro
                        </button>
                    </div>

                    {/* Premium Tier - BLACK FRIDAY SPECIAL */}
                    <div className="relative p-8 bg-gradient-to-b from-green-900/20 to-slate-900/40 border border-green-500/50 rounded-3xl hover:bg-white/10 transition-all flex flex-col">
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            75% OFF
                        </div>
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-white">Premium Black Friday</h3>
                            <p className="text-green-200/70 text-sm">Oferta exclusiva</p>
                        </div>
                        <div className="mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-500 line-through">R$ 199</span>
                            </div>
                            <span className="text-4xl font-bold text-green-400">R$ 99,90</span>
                            <span className="text-slate-500">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" />
                                <div>
                                    <strong className="line-through text-slate-500">500</strong> <strong className="text-green-400">1000 análises/mês</strong>
                                    <p className="text-xs text-green-300">Só para assinantes da Black Friday!</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" /> Tudo do plano Pro
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" /> API dedicada
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" /> Gestão de múltiplos usuários
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" /> Suporte prioritário 24/7
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-green-400" /> Treinamento personalizado
                            </li>
                        </ul>
                        <button onClick={() => handleSubscribe('premium')} className="w-full py-3 rounded-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                            Assinar Premium
                        </button>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0b1120] py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-slate-500" />
                        <span className="text-slate-400 font-semibold">O Licitador</span>
                    </div>
                    <p className="text-slate-600 text-sm">© 2024 O Licitador. Todos os direitos reservados.</p>
                </div>
            </footer>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(8,145,178,0.3)]">
                        <h3 className="text-2xl font-bold text-white mb-4">Quase lá! 🚀</h3>
                        <p className="text-slate-300 mb-6">
                            Digite seu email para prosseguir com a assinatura do plano <strong className="text-cyan-400">{selectedPlan === 'basico' ? 'Básico' : selectedPlan === 'pro' ? 'Pro' : 'Premium'}</strong>.
                        </p>

                        <form onSubmit={handleCheckout} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="seu@email.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Email</label>
                                <input
                                    type="email"
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Confirme seu email"
                                    required
                                    onPaste={(e) => e.preventDefault()} // Prevent pasting to force typing
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        setEmail('');
                                        setError('');
                                    }}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Processando...' : 'Continuar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
