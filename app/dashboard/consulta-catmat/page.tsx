'use client';

import { useState } from 'react';
import { Search, Loader2, Package, Tag, Layers, ArrowRight, DollarSign, Database, AlertCircle } from 'lucide-react';

export default function ConsultaCATMATPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Price Bypass States
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceResult, setPriceResult] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null); // Qual item está sendo cotado

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setHasSearched(false);
        setResults([]);
        setPriceResult(null);
        setSelectedItem(null);

        try {
            const res = await fetch('/api/catmat-lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const handleCotação = async (item: any) => {
        setPriceLoading(true);
        setSelectedItem(item);
        setPriceResult(null);

        try {
            // Monta query
            const searchQuery = item.descricao; // PDM Puro

            const payload = {
                query: searchQuery,
                has_ca: false,
                query_semantica: searchQuery, // Bypass: usa a mesma string
                // Passar metadados extras se a API de preços suportar
                catmat_id: item.codigo
            };

            const response = await fetch('/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            setPriceResult(data);

        } catch (error) {
            console.error('Erro na cotação:', error);
            alert('Erro ao buscar preços.');
        } finally {
            setPriceLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center space-y-4">
                <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <Database className="w-10 h-10 text-indigo-600" />
                    Catálogo Unificado (CATMAT)
                </h1>
                <p className="text-slate-600 text-lg">
                    Consulte códigos oficiais e padronize suas descrições.
                </p>
            </div>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-2">
                        <Search className="w-6 h-6 text-slate-400 ml-3 mr-3" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por código (ex: 4782) ou descrição (ex: Luva Latex)"
                            className="w-full text-xl font-medium text-slate-800 placeholder-slate-400 outline-none h-12"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results Grid */}
            <div className="max-w-4xl mx-auto space-y-6">
                {hasSearched && results.length === 0 && (
                    <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">Nenhum item encontrado</h3>
                        <p className="text-slate-500">Tente buscar pelo código exato ou simplificar os termos.</p>
                    </div>
                )}

                {results.map((item) => (
                    <div key={item.codigo} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all overflow-hidden group">
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wide">
                                            CATMAT {item.codigo}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-100 uppercase tracking-wide">
                                            {item.unidade}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {item.descricao}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2 text-slate-500 text-sm">
                                        <Layers className="w-4 h-4" />
                                        <span>{item.classe}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleCotação(item)}
                                    disabled={priceLoading && selectedItem?.codigo === item.codigo}
                                    className="shrink-0 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                                >
                                    {priceLoading && selectedItem?.codigo === item.codigo ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <DollarSign className="w-4 h-4" />
                                    )}
                                    Cotar este Item
                                </button>
                            </div>

                            {/* PRICE RESULTS AREA (Inline Expand) */}
                            {selectedItem?.codigo === item.codigo && priceResult && (
                                <div className="mt-6 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <h4 className="font-bold text-green-700 flex items-center gap-2">
                                            <span className="text-xl">💰</span> Cotação para "{item.descricao}"
                                        </h4>
                                    </div>

                                    {priceResult.melhores_precos && priceResult.melhores_precos.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {priceResult.melhores_precos.map((price: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-900 line-clamp-1">{price.titulo}</p>
                                                        <p className="text-xs text-slate-500">{price.loja}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-green-700">{price.preco_formatado}</p>
                                                        <a href={price.link} target="_blank" className="text-xs text-blue-600 hover:underline">Ver Loja</a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Nenhum preço encontrado.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
