'use client';

import { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, Shield, Factory, FileText, ArrowRight, Loader2, DollarSign } from 'lucide-react';

export default function ConsultaCAPage() {
    const [ca, setCa] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ca) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/ca-lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ca }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao buscar CA');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCotação = () => {
        alert("Funcionalidade de Cotação Direta será implementada no próximo passo (Módulo Cotação Bypass).");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center space-y-4">
                <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <Shield className="w-10 h-10 text-blue-600" />
                    Consulta CA & Cotação
                </h1>
                <p className="text-slate-600 text-lg">
                    Validação oficial de EPIs e busca de preços via código.
                </p>
            </div>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-2">
                        <Search className="w-6 h-6 text-slate-400 ml-3 mr-3" />
                        <input
                            type="text"
                            value={ca}
                            onChange={(e) => setCa(e.target.value.replace(/\D/g, ''))}
                            placeholder="Digite o número do CA (Ex: 40377)"
                            className="w-full text-xl font-medium text-slate-800 placeholder-slate-400 outline-none h-12"
                        />
                        <button
                            type="submit"
                            disabled={loading || !ca}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analisar'}
                        </button>
                    </div>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>

            {/* Result Card */}
            {result && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                        {/* Card Header with Status */}
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{result.nome_comercial}</h2>
                                <div className="flex items-center gap-2 mt-2 text-slate-500 font-mono text-sm">
                                    <span>CA: {result.numero_ca}</span>
                                    <span>•</span>
                                    <a href={result.link_fonte} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Fonte Oficial
                                    </a>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-medium ${result.validade !== 'Vencido' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {result.validade !== 'Vencido' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                Validade: {result.validade}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Factory className="w-4 h-4" /> Fabricante
                                    </h3>
                                    <p className="text-lg font-medium text-slate-900">{result.fabricante}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Descrição Técnica
                                    </h3>
                                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                        {result.descricao_tecnica}
                                    </p>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="bg-blue-50 rounded-xl p-6 flex flex-col justify-center items-center space-y-4 border border-blue-100">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Pronto para Cotar?</h3>
                                <p className="text-center text-slate-600 text-sm">
                                    Utilize os dados validados acima para buscar os melhores fornecedores no mercado.
                                </p>
                                <button
                                    onClick={handleCotação}
                                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    Buscar Preços Agora
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
