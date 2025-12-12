'use client';

import { useState } from 'react';

export default function SourcesPanel({ result }: { result: any }) {
    const [filter, setFilter] = useState('all');

    // Agregar evidências de todos os agentes
    const allEvidence = [];
    Object.entries(result.agents || {}).forEach(([agentId, agentData]: [string, any]) => {
        if (agentData?.evidence) {
            agentData.evidence.forEach((ev: any) => {
                allEvidence.push({ ...ev, agent: agentId });
            });
        }
    });

    const filteredEvidence = filter === 'all' ? allEvidence : allEvidence.filter((ev: any) => ev.agent === filter);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para área de transferência!');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Fontes / Evidências ({filteredEvidence.length})</h2>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border rounded"
                >
                    <option value="all">Todos os Agentes</option>
                    <option value="AGENT_02">AGENT_02 (Estrutura)</option>
                    <option value="AGENT_03">AGENT_03 (Itens)</option>
                    <option value="AGENT_04">AGENT_04 (Habilitação)</option>
                    <option value="AGENT_05">AGENT_05 (Técnico)</option>
                </select>
            </div>

            {filteredEvidence.length === 0 ? (
                <p className="text-gray-600">Nenhuma evidência disponível</p>
            ) : (
                <div className="space-y-3">
                    {filteredEvidence.map((ev: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 border rounded">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="font-semibold">{ev.field || 'Campo'}</span>
                                    <span className="text-sm text-gray-600 ml-2">({ev.agent})</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`${ev.trecho_literal}\n\nFonte: ${ev.documento}, Página ${ev.pagina}`)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    📋 Copiar
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Documento:</strong> {ev.documento} | <strong>Página:</strong> {ev.pagina}
                            </p>
                            <div className="p-3 bg-white rounded text-sm border">
                                "{ev.trecho_literal}"
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Confidence: {((ev.confidence || 0) * 100).toFixed(0)}%
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
