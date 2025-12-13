'use client';

import { useEffect, useState } from 'react';

export default function HistoryPage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                const response = await fetch('/api/history');

                if (!response.ok) {
                    throw new Error(`Erro: ${response.statusText}`);
                }

                const data = await response.json();
                setBatches(data.batches || []);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Histórico de Análises
                        </h1>
                        <a
                            href="/"
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            + Nova Análise
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando histórico...</p>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-600 mb-6">
                            Nenhuma análise encontrada
                        </p>
                        <a
                            href="/"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Criar Primeira Análise
                        </a>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Batch ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Órgão
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        OCR
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {batches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                {new Date(batch.createdAt).toLocaleTimeString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                {batch.id.substring(0, 8)}...
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {batch.orgao || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.status === 'success' ? 'bg-green-100 text-green-800' :
                                                    batch.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                        batch.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`${batch.ocrQualityAvg < 0.5 ? 'text-red-600 font-bold' : ''}`}>
                                                {(batch.ocrQualityAvg * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a
                                                href={`/results/${batch.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                Ver Resultado →
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
