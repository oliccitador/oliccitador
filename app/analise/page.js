'use client';

import { useState, useCallback } from 'react';
import { Search, ShieldCheck, ShoppingCart, FileText, Loader2, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
    const [description, setDescription] = useState('');
    const [ca, setCa] = useState('');
    const [catmat, setCatmat] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!description) return;

        // --- CORREÇÃO: Forçar o reset do estado na submissão ---
        setResult(null); // Limpa imediatamente os resultados antigos
        // --------------------------------------------------------

        setLoading(true);
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    ca: ca || null,
                    catmat: catmat || null
                }),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao analisar. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    // FUNÇÃO DE RESET: Limpa o estado e a descrição para nova busca
    const handleReset = useCallback(() => {
        setResult(null);
        setDescription('');
        console.log("Interface resetada para nova busca.");
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                        <span className="text-blue-600">O Licitador</span>
                    </h1>
                    <p className="text-slate-500">O Cérebro Lógico das Compras Públicas</p>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                        Cole a Descrição Técnica do Item (Edital)
                    </label>
                    <textarea
                        className="w-full h-32 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Ex: Luva de segurança confeccionada em vaqueta, com reforço palmar interno..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Campos opcionais para CA e CATMAT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Número do CA (opcional)
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Ex: 12345"
                                value={ca}
                                onChange={(e) => setCa(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Código CATMAT (opcional)
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Ex: 123456"
                                value={catmat}
                                onChange={(e) => setCatmat(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !description}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analisando com as 4 Regras de Ouro...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Analisar Item
                            </>
                        )}
                    </button>
                </div>

                {result && result.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                        <p className="font-bold">Erro na Análise:</p>
                        <p>{result.error}</p>
                        {result.raw_response && (
                            <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-semibold">Ver resposta bruta</summary>
                                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                                    {result.raw_response}
                                </pre>
                            </details>
                        )}
                    </div>
                )}

                {/* BOTÃO DE RESET - Visível após análise concluída */}
                {result && !result.error && (
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={handleReset}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            🔄 Fazer Nova Busca
                        </button>
                    </div>
                )}

                {result && !result.error && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Regra 1: Edital Gêmeo */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2 text-amber-600 font-semibold">
                                <FileText className="w-5 h-5" />
                                <h2>Regra do Edital Gêmeo</h2>
                            </div>
                            <p className="text-sm text-slate-600">Snippet para busca no PNCP:</p>
                            <div className="bg-slate-100 p-3 rounded-md font-mono text-sm text-slate-800 break-words">
                                {result.regra_edital_gemeo || result.edital_gemeo_snippet}
                            </div>
                        </div>

                        {/* Regra 2: Detetive de Códigos */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2 text-purple-600 font-semibold">
                                <Search className="w-5 h-5" />
                                <h2>Detetive de Códigos</h2>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">CA Detectado</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {result.detetive_de_codigos?.ca_detectado && result.detetive_de_codigos.ca_detectado !== "Nenhum detectado" ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
                                                {result.detetive_de_codigos.ca_detectado}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Nenhum CA detectado</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">CATMAT / BR</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {result.detetive_de_codigos?.catmat_br && result.detetive_de_codigos.catmat_br !== "Nenhum detectado" ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
                                                {result.detetive_de_codigos.catmat_br}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Nenhum código detectado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Regra 3: Produto de Referência */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3 md:col-span-2">
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <ShoppingCart className="w-5 h-5" />
                                <h2>📦 Produto de Referência de Mercado</h2>
                            </div>

                            {/* Query Semântica Limpa */}
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm font-medium text-green-800">Query Semântica Limpa:</p>
                                <p className="text-sm text-gray-700 mt-1">
                                    {result.query_semantica_limpa || 'Aguardando análise...'}
                                </p>
                            </div>

                            {/* Produto de Referência */}
                            {result.produto_referencia && result.produto_referencia.marca && result.produto_referencia.modelo ? (
                                <div className="mt-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                {result.produto_referencia.marca} - {result.produto_referencia.modelo}
                                            </h3>
                                            <p className="text-sm text-gray-700 mb-3">
                                                Este produto atende às especificações técnicas descritas no edital.
                                            </p>
                                            <div className="bg-white/70 p-3 rounded border border-green-300">
                                                <p className="text-xs font-semibold text-green-800 uppercase mb-1">Aviso Legal</p>
                                                <p className="text-xs text-gray-600">
                                                    Esta é uma <strong>referência técnica de qualidade</strong> conforme Lei 14.133/21.
                                                    A licitação aceita <strong>similares ou equivalentes</strong> que atendam às mesmas especificações.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Item de Especificação Genérica
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        Não foi possível identificar uma marca/modelo específico como referência técnica para este item.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Regra 4: Justificativa */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3 md:col-span-2">
                            <div className="flex items-center gap-2 text-blue-600 font-semibold">
                                <ShieldCheck className="w-5 h-5" />
                                <h2>Justificativa Técnica (Lei 14.133/21)</h2>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                                {result.justificativa_tecnica}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
