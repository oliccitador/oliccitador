'use client';

export default function BlackBoxPanel({ result }: { result: any }) {
    const blackBox = result.black_box || {};
    const timeline = blackBox.timeline || [];
    const warnings = blackBox.warnings || [];
    const errors = blackBox.errors || [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Caixa Preta (Auditoria)</h2>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600">Total de Etapas</p>
                    <p className="text-2xl font-bold">{timeline.length}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded">
                    <p className="text-sm text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold">{warnings.length}</p>
                </div>
                <div className="p-4 bg-red-50 rounded">
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold">{errors.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                    <p className="text-sm text-gray-600">Páginas Processadas</p>
                    <p className="text-2xl font-bold">{result.pipeline_summary?.total_pages || 0}</p>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="font-semibold text-lg mb-3">Timeline de Execução:</h3>
                <div className="space-y-2">
                    {timeline.map((event: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <span className="text-gray-500 text-sm">{i + 1}</span>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{event.agent || event.step}</span>
                                    <span className="text-sm text-gray-600">{event.timestamp}</span>
                                </div>
                                {event.message && (
                                    <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-3">Avisos:</h3>
                    <ul className="space-y-2">
                        {warnings.map((warning: string, i: number) => (
                            <li key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                ⚠️ {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-3">Erros:</h3>
                    <ul className="space-y-2">
                        {errors.map((error: string, i: number) => (
                            <li key={i} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                                ❌ {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
