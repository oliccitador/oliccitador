'use client';

import { useState } from 'react';
import SourcesPanel from './SourcesPanel';
import BlackBoxPanel from './BlackBoxPanel';
import DownloadsPanel from './DownloadsPanel';

interface ResultsDashboardProps {
    result: any;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
    const [activeTab, setActiveTab] = useState('resumo');

    const tabs = [
        { id: 'resumo', label: 'Resumo do Processo' },
        { id: 'itens', label: 'Itens/Objeto' },
        { id: 'habilitacao', label: 'Habilitação' },
        { id: 'tecnico', label: 'Técnico/Capacidade' },
        { id: 'divergencias', label: 'Divergências' },
        { id: 'juridico', label: 'Jurídico e Minutas' },
        { id: 'decisao', label: 'Decisão GO/NO-GO' },
        { id: 'fontes', label: 'Fontes' },
        { id: 'caixa-preta', label: 'Caixa Preta' },
        { id: 'downloads', label: 'Downloads' },
    ];

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'resumo' && <ResumoSection result={result} />}
                {activeTab === 'itens' && <ItensSection result={result} />}
                {activeTab === 'habilitacao' && <HabilitacaoSection result={result} />}
                {activeTab === 'tecnico' && <TecnicoSection result={result} />}
                {activeTab === 'divergencias' && <DivergenciasSection result={result} />}
                {activeTab === 'juridico' && <JuridicoSection result={result} />}
                {activeTab === 'decisao' && <DecisaoSection result={result} />}
                {activeTab === 'fontes' && <SourcesPanel result={result} />}
                {activeTab === 'caixa-preta' && <BlackBoxPanel result={result} />}
                {activeTab === 'downloads' && <DownloadsPanel result={result} />}
            </div>
        </div>
    );
}

// Seção: Resumo do Processo (AGENT_02)
function ResumoSection({ result }: { result: any }) {
    const agent2 = result.agents?.AGENT_02 || result.results?.structure;
    const dados = agent2?.dados || {};
    const lowOCR = result.pipeline_summary?.ocr_quality_avg < 0.5;

    const FieldWithBadge = ({ label, value }: { label: string, value: any }) => (
        <div>
            <span className="text-sm text-gray-600">{label}:</span>
            <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold">{value || 'SEM DADOS NO ARQUIVO'}</span>
                {lowOCR && ['modalidade', 'órgão', 'tipo julgamento'].some(s => label.toLowerCase().includes(s)) && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-yellow-900">
                        LOW_CONFIDENCE
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Resumo do Processo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWithBadge label="Modalidade" value={dados.modalidade} />
                <FieldWithBadge label="Tipo de Julgamento" value={dados.tipoJulgamento} />
                <FieldWithBadge label="Órgão" value={dados.orgao} />
                <FieldWithBadge label="Nº Processo" value={dados.numeroProcesso} />
                <FieldWithBadge label="Nº Edital" value={dados.numeroEdital} />
                <FieldWithBadge label="Plataforma" value={dados.plataforma} />
            </div>

            {dados.datas && (
                <div>
                    <h3 className="font-semibold mb-2">Datas Críticas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {dados.datas.publicacao && (
                            <FieldWithBadge label="Publicação" value={new Date(dados.datas.publicacao).toLocaleDateString('pt-BR')} />
                        )}
                        {dados.datas.abertura && (
                            <FieldWithBadge label="Abertura" value={new Date(dados.datas.abertura).toLocaleString('pt-BR')} />
                        )}
                        {dados.datas.envioPropostas && (
                            <FieldWithBadge label="Envio Propostas" value={new Date(dados.datas.envioPropostas).toLocaleString('pt-BR')} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Seção: Itens (AGENT_03)
function ItensSection({ result }: { result: any }) {
    const agent3 = result.agents?.AGENT_03 || result.results?.items;
    const itens = agent3?.dados?.itens || [];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Itens / Objeto ({itens.length})</h2>

            {itens.length === 0 ? (
                <p className="text-gray-600">Nenhum item detectado</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classificação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {itens.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm">{item.numero || i + 1}</td>
                                    <td className="px-4 py-3 text-sm">{item.descricao}</td>
                                    <td className="px-4 py-3 text-sm">{item.quantidade}</td>
                                    <td className="px-4 py-3 text-sm">{item.unidade}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.classificacao === 'ELEGIVEL' ? 'bg-green-100 text-green-800' :
                                            item.classificacao === 'DUVIDA' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {item.classificacao}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Seção: Habilitação (AGENT_04)
function HabilitacaoSection({ result }: { result: any }) {
    const agent4 = result.agents?.AGENT_04 || result.results?.compliance;
    const checklist = agent4?.dados?.checklist || [];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Habilitação</h2>

            {checklist.length === 0 ? (
                <p className="text-gray-600">Nenhum requisito detectado</p>
            ) : (
                <ul className="space-y-3">
                    {checklist.map((req: any, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <span className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${req.exigencia_excessiva ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                {i + 1}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium">{req.requisito}</p>
                                <p className="text-sm text-gray-600 mt-1">{req.categoria}</p>
                                {req.exigencia_excessiva && (
                                    <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                                        ⚠️ EXIGÊNCIA EXCESSIVA
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Seção: Técnico (AGENT_05)
function TecnicoSection({ result }: { result: any }) {
    const agent5 = result.agents?.AGENT_05 || result.results?.technical;
    const requisitos = agent5?.dados?.requisitos_tecnicos || [];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Capacidade Técnica</h2>

            {requisitos.length === 0 ? (
                <p className="text-gray-600">Nenhum requisito técnico detectado</p>
            ) : (
                <ul className="space-y-3">
                    {requisitos.map((req: any, i: number) => (
                        <li key={i} className="p-3 bg-gray-50 rounded">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="font-medium">{req.tipo}</p>
                                    <p className="text-sm text-gray-600 mt-1">{req.descricao}</p>
                                </div>
                                {req.gatilho_impugnacao && (
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
                                        GATILHO IMPUGNAÇÃO
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Seção: Divergências (AGENT_07)
function DivergenciasSection({ result }: { result: any }) {
    const agent7 = result.agents?.AGENT_07 || result.results?.divergences;
    const inconsistencias = agent7?.dados?.inconsistencias || [];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Divergências ({inconsistencias.length})</h2>

            {inconsistencias.length === 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800">✅ Nenhuma divergência detectada</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {inconsistencias.map((div: any, i: number) => (
                        <li key={i} className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold">Campo: {div.campo}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${div.severidade === 'ALTA' ? 'bg-red-500 text-white' :
                                    div.severidade === 'MEDIA' ? 'bg-yellow-500 text-yellow-900' :
                                        'bg-gray-500 text-white'
                                    }`}>
                                    {div.severidade}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {div.valores?.map((val: any, j: number) => (
                                    <div key={j} className="text-sm">
                                        <span className="font-medium">{val.fonte}:</span> {val.valor}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-700 mt-2">
                                <strong>Ação sugerida:</strong> {div.acao_sugerida}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Seção: Jurídico (AGENT_06)
function JuridicoSection({ result }: { result: any }) {
    const agent6 = result.agents?.AGENT_06 || result.results?.legal;
    const minutas = agent6?.dados?.minutas || [];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Jurídico e Minutas ({minutas.length})</h2>

            {minutas.length === 0 ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800">ℹ️ Nenhuma minuta gerada (sem gatilhos detectados)</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {minutas.map((minuta: any, i: number) => (
                        <li key={i} className="p-4 bg-white border border-gray-200 rounded shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-lg">{minuta.titulo}</h3>
                                <span className="px-3 py-1 rounded text-sm font-bold bg-purple-500 text-white">
                                    {minuta.tipo}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap font-mono">
                                {minuta.texto}
                            </div>
                            {minuta.gatilho && (
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong>Gatilho:</strong> {minuta.gatilho}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Seção: Decisão (AGENT_08)
function DecisaoSection({ result }: { result: any }) {
    const agent8 = result.agents?.AGENT_08 || result.results?.decision;
    const goNoGo = agent8?.dados?.go_no_go || {};
    const matrizRisco = agent8?.dados?.matriz_risco || [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Decisão GO/NO-GO</h2>

            {/* Recomendação */}
            <div className={`p-6 rounded-lg ${goNoGo.recomendacao === 'PARTICIPAR' ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
                }`}>
                <h3 className="text-2xl font-bold mb-2">
                    {goNoGo.recomendacao === 'PARTICIPAR' ? '✅ PARTICIPAR' : '❌ NÃO RECOMENDADO'}
                </h3>
                <p className="text-gray-800">{goNoGo.justificativa}</p>

                {goNoGo.condicoes_para_go && goNoGo.condicoes_para_go.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Condições para GO:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {goNoGo.condicoes_para_go.map((cond: string, i: number) => (
                                <li key={i} className="text-sm">{cond}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Matriz de Risco */}
            {matrizRisco.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-3">Matriz de Risco:</h3>
                    <div className="space-y-3">
                        {matrizRisco.map((risco: any, i: number) => (
                            <div key={i} className="p-4 bg-gray-50 rounded border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="font-medium">{risco.tema}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${risco.nivel === 'CRITICO' ? 'bg-red-600 text-white' :
                                        risco.nivel === 'ALTO' ? 'bg-orange-500 text-white' :
                                            risco.nivel === 'MEDIO' ? 'bg-yellow-500 text-yellow-900' :
                                                'bg-green-500 text-white'
                                        }`}>
                                        {risco.nivel}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">{risco.risco}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    <strong>Ação:</strong> {risco.acao}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
