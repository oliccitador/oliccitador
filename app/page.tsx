'use client';

import Link from 'next/link';
import { Brain, Search, ShieldCheck, ShoppingCart, FileText, Zap, CheckCircle, TrendingUp, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100 selection:bg-cyan-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Brain className="w-8 h-8 text-cyan-400" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                O Licitador
                            </span>
                        </div>

                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                <Link href="#features" className="hover:text-cyan-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Funcionalidades</Link>
                                <Link href="#benefits" className="hover:text-cyan-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Vantagens</Link>
                                <Link href="/sicx" className="hover:text-cyan-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">SICX Express</Link>
                                <Link href="/pricing" className="hover:text-cyan-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Planos</Link>
                                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-2 rounded-md text-sm font-medium">Login</Link>
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
                            <Link href="#features" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Funcionalidades</Link>
                            <Link href="#benefits" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Vantagens</Link>
                            <Link href="/sicx" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">SICX Express</Link>
                            <Link href="/pricing" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Planos</Link>
                            <Link href="/login" className="text-cyan-400 block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                        </div>
                    </div>
                )}
            </nav>




            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-50" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-400">
                        O Cérebro Lógico das<br />Compras Públicas
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 mb-10">
                        Transforme editais complexos em decisões estratégicas em segundos.
                        Valide códigos, encontre preços e gere justificativas com Inteligência Artificial.
                    </p>
                    <div className="flex justify-center">
                        <Link href="/pricing" className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(8,145,178,0.6)] hover:shadow-[0_0_30px_rgba(8,145,178,0.8)] hover:-translate-y-1 flex items-center justify-center gap-2">
                            Ver Planos <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* SICX Announcement Banner */}
            <section className="py-4 bg-gradient-to-r from-purple-900 via-orange-800 to-purple-900 border-y border-orange-500/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">EM BREVE</span>
                        <p className="text-white font-medium">
                            <span className="font-bold text-orange-400">SICX Express:</span> Prepare-se para vender no mercado digital oficial do governo.
                        </p>
                    </div>
                    <Link href="/sicx" className="group flex items-center gap-1 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
                        Saiba mais <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* Highlighted Statement */}
            <section className="py-12 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 animate-pulse">
                        A FERRAMENTA DE LICITAÇÃO COM MAIS DE 6000 USUÁRIOS SATISFEITOS.
                    </h2>
                    <p className="text-lg md:text-xl opacity-90">
                        Junte‑se a milhares de profissionais que já transformaram suas análises de licitações.
                    </p>
                </div>
            </section>


            {/* Benefits Section */}
            <section id="benefits" className="py-20 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-6">Chega de quebrar a cabeça com descrições absurdas de editais.</h2>
                        <div className="text-slate-300 max-w-3xl mx-auto space-y-4 text-lg leading-relaxed">
                            <p>
                                Nossa ferramenta identifica automaticamente o produto correto mesmo quando o edital está mal escrito, confuso ou técnico demais.
                            </p>
                            <p>
                                Você envia a descrição literal do item → o sistema lê linha a linha → traduz cada descrição para termos comerciais claros → encontra o item exato que você deve cotar → e ainda aponta riscos, equivalências e exigências ocultas.
                            </p>
                            <p className="font-semibold text-cyan-400">
                                Pare de perder tempo e oportunidades.<br />
                                Descubra o que realmente o edital está pedindo — com precisão, velocidade e zero margem para erro.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Brain, title: "Precisão", desc: "IA treinada especificamente para interpretar linguagem técnica de editais." },
                            { icon: Zap, title: "Velocidade", desc: "Análise completa e busca de mercado em menos de 5 segundos." },
                            { icon: CheckCircle, title: "Conformidade", desc: "Justificativas alinhadas rigorosamente à Lei 14.133/21." },
                            { icon: TrendingUp, title: "Economia", desc: "Encontre os melhores preços validados e elimine sobrepreço." }
                        ].map((item, index) => (
                            <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                <item.icon className="w-10 h-10 text-cyan-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section (4 Rules) */}
            <section id="features" className="py-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">As 4 Regras de Ouro</h2>
                        <p className="text-slate-400">Nossa metodologia exclusiva de análise.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div className="group p-8 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl hover:border-amber-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">1. Edital Gêmeo</h3>
                            </div>
                            <p className="text-slate-300">Extrai o snippet exato para busca no PNCP, permitindo encontrar editais similares instantaneamente.</p>
                        </div>

                        {/* Card 2 */}
                        <div className="group p-8 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl hover:border-purple-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">2. Detetive de Códigos</h3>
                            </div>
                            <p className="text-slate-300">Identifica automaticamente CA e CATMAT/BR, prevenindo erros de catalogação e certificação.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="group p-8 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-3xl hover:border-green-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">3. Busca de Mercado</h3>
                            </div>
                            <p className="text-slate-300">Gera query semântica e retorna os Top 3 candidatos validados, filtrando acessórios e ruídos.</p>
                        </div>

                        {/* Card 4 */}
                        <div className="group p-8 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl hover:border-blue-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">4. Justificativa Técnica</h3>
                            </div>
                            <p className="text-slate-300">Redige a defesa técnica completa com embasamento legal, pronta para copiar e colar no processo.</p>
                        </div>
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
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="/terms" className="hover:text-cyan-400 transition-colors">Termos de Uso</Link>
                        <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacidade</Link>
                        <a href="mailto:suporte.olicitador@gmail.com" className="hover:text-cyan-400 transition-colors">Contato</a>
                    </div>
                    <p className="text-slate-600 text-sm">© 2024 O Licitador. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div >
    );
}
