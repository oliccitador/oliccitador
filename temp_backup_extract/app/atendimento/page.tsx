import Link from 'next/link';
import { Brain, Mail, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Atendimento ao Cliente - O Licitador',
    description: 'Entre em contato com nossa equipe de suporte.',
};

export default function AtendimentoPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                            <Brain className="w-8 h-8 text-cyan-400" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            O Licitador
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Início
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Como podemos ajudar?
                    </h1>
                    <p className="text-lg text-slate-400">
                        Nossa equipe está pronta para tirar suas dúvidas sobre a plataforma, pagamentos ou suporte técnico.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Email Support Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all group">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                                <Mail className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">E-mail de Suporte</h3>
                                <p className="text-slate-400 mb-6">
                                    Para dúvidas gerais, problemas técnicos ou questões financeiras. Respondemos em até 24 horas úteis.
                                </p>
                                <a
                                    href="mailto:suporte.olicitador@gmail.com"
                                    className="inline-flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all"
                                >
                                    suporte.olicitador@gmail.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* FAQ / Info Adicional (Opcional, mantendo simples por enquanto) */}
                    <div className="mt-8 text-center p-6 bg-slate-900/50 rounded-xl border border-white/5">
                        <p className="text-sm text-slate-500">
                            Horário de Atendimento: Segunda a Sexta, das 09:00 às 18:00.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer Simple */}
            <footer className="border-t border-white/5 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm">
                    <p>© 2024 O Licitador. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
