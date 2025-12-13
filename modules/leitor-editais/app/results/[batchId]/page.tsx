'use client';

import { useEffect, useState } from 'react';
import ResultsDashboard from '@/components/ResultsDashboard';
import OCRQualityBanner from '@/components/OCRQualityBanner';
// ✅ SPRINT 3: QuestionBox POST
import QuestionBox from '@/components/QuestionBox';

export default function ResultsPage({ params }: { params: { batchId: string } }) {
    const { batchId } = params;
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('ResultsPage Mounted v2 - Fix #438 Applied');
        async function loadBatch() {
            setLoading(true);
            try {
                // ✅ ESTRATÉGIA PREVIEW-FIRST: Tentar localStorage antes
                // Como o deploy preview não tem DB, confiamos na persistência local do navegador
                const cached = localStorage.getItem(`result_${batchId}`);
                if (cached) {
                    console.log('📦 Carregando resultado do cache local (Preview Mode)');
                    const data = JSON.parse(cached);
                    setResult(data);
                    setLoading(false);
                    return;
                }

                // Se não tiver local, tenta servidor (pode falhar no preview)
                const response = await fetch(`/api/batches/${batchId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('not_found');
                    } else {
                        throw new Error(`Erro: ${response.statusText}`);
                    }
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setResult(data);

                // Cachear para próximas vezes
                localStorage.setItem(`result_${batchId}`, JSON.stringify(data));
                localStorage.setItem('lastResult', JSON.stringify(data));

            } catch (err: any) {
                console.error('Erro ao carregar batch:', err);
                // Se falhar e não tinhamos cache, é erro real
                setError('server_error');
            } finally {
                setLoading(false);
            }
        }

        loadBatch();
    }, [batchId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando resultado...</p>
                </div>
            </div>
        );
    }

    if (error === 'not_found') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        ❌ Resultado Não Encontrado
                    </h1>
                    <p className="text-gray-600 mb-2">
                        Batch ID: <code className="bg-gray-100 px-2 py-1 rounded">{batchId}</code>
                    </p>
                    <p className="text-gray-600 mb-6">
                        Este resultado não está disponível. Pode ter expirado ou nunca foi gerado.
                    </p>
                    <a
                        href="/"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        ← Nova Análise
                    </a>
                </div>
            </div>
        );
    }

    if (error === 'server_error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
                    <h1 className="text-2xl font-bold text-red-800 mb-4">
                        ❌ Erro ao Carregar Resultado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Ocorreu um erro ao buscar o resultado. Tente novamente.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        🔄 Recarregar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Resultado da Análise
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Batch ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{result?.batch_id}</code>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(result?.timestamp).toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href="/history"
                                className="text-gray-600 hover:text-gray-800 font-semibold"
                            >
                                📋 Histórico
                            </a>
                            <a
                                href="/"
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                ← Nova Análise
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* OCR Quality Banner */}
                <OCRQualityBanner
                    ocrQuality={result?.pipeline_summary?.ocr_quality_avg || 0}
                    warnings={result?.pipeline_warnings || []}
                />

                {/* Results Dashboard */}
                <ResultsDashboard result={result} />

                {/* ✅ SPRINT 3: Perguntas Pós-Análise */}
                <div className="mt-8">
                    <QuestionBox
                        mode="POST"
                        batchId={batchId}
                        title="💬 Faça Perguntas Sobre Esta Análise"
                        description="Pergunte sobre pontos específicos usando os dados já processados. Não será necessário rodar a análise novamente."
                    />
                </div>

            </main>
        </div>
    );
}
