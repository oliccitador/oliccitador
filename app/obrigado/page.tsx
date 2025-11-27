import Link from 'next/link';
import { CheckCircle, Mail, Clock } from 'lucide-react';

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(8,145,178,0.1)] text-center">

                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>

                    {/* Main Message */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Pagamento Confirmado! 🎉
                    </h1>
                    <p className="text-lg text-slate-400 mb-8">
                        Obrigado por assinar o <span className="text-cyan-400 font-semibold">O Licitador</span>
                    </p>

                    {/* Access Info Box */}
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-8 text-left">
                        <div className="flex items-start gap-3 mb-4">
                            <Mail className="w-6 h-6 text-cyan-400 mt-1 shrink-0" />
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Como você receberá o acesso:</h2>
                                <p className="text-slate-300 leading-relaxed">
                                    Enviaremos um <strong className="text-cyan-400">email de boas-vindas</strong> com suas credenciais de acesso e instruções para começar a usar a plataforma.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="w-6 h-6 text-yellow-400 mt-1 shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Prazo de entrega:</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    O acesso será liberado <strong className="text-yellow-400">imediatamente</strong> ou em até <strong className="text-yellow-400">2 horas</strong>, conforme o fluxo de compradores.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                        <p className="text-sm text-slate-400">
                            📧 Verifique sua caixa de entrada e também a pasta de <strong>spam/lixo eletrônico</strong>.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        Voltar para a Home
                    </Link>

                    {/* Support */}
                    <p className="text-sm text-slate-500 mt-6">
                        Problemas? Entre em contato: <a href="mailto:suporte.olicitador@gmail.com" className="text-cyan-400 hover:text-cyan-300">suporte.olicitador@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
