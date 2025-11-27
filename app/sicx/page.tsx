'use client';

import Link from 'next/link';
import { Check, BookOpen, Zap, ClipboardCheck, BarChart2, Bell, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function SicxInfo() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/notify-sicx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('Você será avisado em breve!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Erro ao salvar email.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-cyan-900 to-slate-900 text-white py-16">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center animate-pulse">
                    SICX Express – Em Breve
                </h1>
                <p className="text-lg md:text-xl text-center mb-12">
                    O mercado digital oficial do governo, exclusivo para compras públicas.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <Topic
                        icon={<BookOpen className="w-6 h-6 text-cyan-400" />}
                        title="Curso Completo SICX"
                        desc="Tudo o que você precisa saber – conceito, cadastro, tipos de produtos, documentos, estratégias de venda e muito mais."
                    />
                    <Topic
                        icon={<Zap className="w-6 h-6 text-cyan-400" />}
                        title="Simulador SICX"
                        desc="Teste se seus produtos são elegíveis antes da abertura oficial."
                    />
                    <Topic
                        icon={<ClipboardCheck className="w-6 h-6 text-cyan-400" />}
                        title="Checklist de Prontidão"
                        desc="Veja o que sua empresa já tem e o que ainda falta para vender no SICX."
                    />
                    <Topic
                        icon={<BarChart2 className="w-6 h-6 text-cyan-400" />}
                        title="Comparador Estratégico"
                        desc="Avalie a melhor opção: venda direta (SICX) ou licitação tradicional."
                    />
                    <Topic
                        icon={<Zap className="w-6 h-6 text-cyan-400" />}
                        title="Radar de Tendências"
                        desc="Produtos com maior chance de entrar no catálogo do SICX."
                    />
                    <Topic
                        icon={<Bell className="w-6 h-6 text-cyan-400" />}
                        title="Aviso Automático"
                        desc="Notificações assim que o SICX for ativado e abrir para cadastro."
                    />
                </div>

                <div className="mt-16 max-w-md mx-auto text-center">
                    <h3 className="text-2xl font-bold mb-4">Entre na lista de espera</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Seu melhor e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Quero ser avisado'}
                        </button>
                    </form>
                    {message && (
                        <p className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Topic({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
            {icon}
            <div>
                <h3 className="text-xl font-semibold mb-1 text-white">{title}</h3>
                <p className="text-slate-300 text-sm">{desc}</p>
            </div>
        </div>
    );
}
