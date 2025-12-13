'use client';

export default function DownloadsPanel({ result }: { result: any }) {
    const agent9 = result.agents?.AGENT_09 || result.results?.report;
    const consolidado = agent9?.dados?.consolidado;
    const minutas = result.agents?.AGENT_06?.dados?.minutas || [];

    const hasConsolidado = !!consolidado;

    const handleDownload = (type: string) => {
        alert(`Download de ${type} será implementado quando gerador de PDF estiver pronto`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Downloads</h2>

            {!hasConsolidado && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">
                        ⚠️ Downloads estarão disponíveis quando o AGENT_09 (ReportSynthesizer) tiver gerado o consolidado.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Relatório Principal */}
                <button
                    onClick={() => handleDownload('Relatório PDF')}
                    disabled={!hasConsolidado}
                    className="p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">📄</span>
                        <h3 className="font-semibold">Relatório Principal (PDF)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Relatório completo com todos os blocos
                        </p>
                    </div>
                </button>

                {/* Anexo I */}
                <button
                    onClick={() => handleDownload('Anexo I PDF')}
                    disabled={!hasConsolidado}
                    className="p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">📋</span>
                        <h3 className="font-semibold">Anexo I (PDF)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Tabela detalhada de itens
                        </p>
                    </div>
                </button>

                {/* Anexo I Excel */}
                <button
                    onClick={() => handleDownload('Anexo I Excel')}
                    disabled={!hasConsolidado}
                    className="p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">📊</span>
                        <h3 className="font-semibold">Anexo I (Excel)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Planilha editável de itens
                        </p>
                    </div>
                </button>

                {/* Minutas */}
                <button
                    onClick={() => handleDownload('Minutas')}
                    disabled={minutas.length === 0}
                    className="p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">⚖️</span>
                        <h3 className="font-semibold">Minutas Jurídicas ({minutas.length})</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {minutas.length > 0 ? 'ZIP com minutas em DOCX/PDF' : 'Nenhuma minuta gerada'}
                        </p>
                    </div>
                </button>

                {/* Caixa Preta JSON */}
                <button
                    onClick={() => handleDownload('Caixa Preta JSON')}
                    disabled={!hasConsolidado}
                    className="p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">📦</span>
                        <h3 className="font-semibold">Caixa Preta (JSON)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Dados completos para auditoria
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
