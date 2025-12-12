'use client';

/**
 * CompanyContextPanel - Captura contexto operacional da empresa
 * 
 * @component
 * @sprint Sprint 3 - CNPJ/Contexto
 */

import { useState } from 'react';

export interface CompanyContext {
    companyProfileId?: string;
    estoque: 'PRONTO' | 'SOB_ENCOMENDA' | 'NAO_TENHO';
    alcanceLogisticoKm: number | null;
    apetiteRisco: 'BAIXO' | 'MEDIO' | 'ALTO';
    observacoes: string;
}

interface CompanyContextPanelProps {
    batchId?: string;
    companyProfileId?: string;
    onContextSaved?: (context: CompanyContext) => void;
}

export default function CompanyContextPanel({
    batchId,
    companyProfileId,
    onContextSaved
}: CompanyContextPanelProps) {
    const [formData, setFormData] = useState<CompanyContext>({
        companyProfileId,
        estoque: 'PRONTO',
        alcanceLogisticoKm: null,
        apetiteRisco: 'MEDIO',
        observacoes: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (field: keyof CompanyContext, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleSave = async () => {
        if (!batchId) {
            setError('Batch ID não fornecido');
            return;
        }

        if (!companyProfileId && !formData.companyProfileId) {
            setError('Consulte o CNPJ antes de salvar o contexto');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/api/batches/${batchId}/context`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    companyProfileId: companyProfileId || formData.companyProfileId,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao salvar contexto');
            }

            const savedContext = await res.json();
            setSuccess(true);

            if (onContextSaved) {
                onContextSaved(savedContext);
            }

            setTimeout(() => setSuccess(false), 3000);

        } catch (err: any) {
            console.error('Erro ao salvar contexto:', err);
            setError(err.message || 'Erro ao salvar contexto operacional');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    3. Contexto Operacional
                </h2>
                <p className="text-sm text-gray-600">
                    Informe características operacionais que afetam sua capacidade de participar
                </p>
            </div>

            <div className="space-y-5">
                {/* Estoque */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estoque <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.estoque}
                        onChange={(e) => handleChange('estoque', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="PRONTO">✅ Pronto (em estoque)</option>
                        <option value="SOB_ENCOMENDA">⏳ Sob Encomenda</option>
                        <option value="NAO_TENHO">❌ Não Tenho</option>
                    </select>
                </div>

                {/* Alcance Logístico */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alcance Logístico (km)
                    </label>
                    <input
                        type="number"
                        value={formData.alcanceLogisticoKm || ''}
                        onChange={(e) => handleChange('alcanceLogisticoKm', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Ex: 500"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Distância máxima que consegue entregar (deixe em branco se ilimitado)
                    </p>
                </div>

                {/* Apetite de Risco */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apetite de Risco <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['BAIXO', 'MEDIO', 'ALTO'] as const).map((nivel) => (
                            <button
                                key={nivel}
                                type="button"
                                onClick={() => handleChange('apetiteRisco', nivel)}
                                className={`px-4 py-3 rounded-md font-medium transition-all ${formData.apetiteRisco === nivel
                                        ? 'bg-blue-600 text-white shadow-md scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {nivel === 'BAIXO' && '🟢 Baixo'}
                                {nivel === 'MEDIO' && '🟡 Médio'}
                                {nivel === 'ALTO' && '🔴 Alto'}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        <strong>Baixo:</strong> Prioriza segurança jurídica<br />
                        <strong>Médio:</strong> Equilibrado<br />
                        <strong>Alto:</strong> Aceita editais mais complexos
                    </p>
                </div>

                {/* Observações */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações Adicionais
                    </label>
                    <textarea
                        value={formData.observacoes}
                        onChange={(e) => handleChange('observacoes', e.target.value)}
                        placeholder="Ex: Equipe reduzida em janeiro/fevereiro, certificações pendentes, etc."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                </div>
            </div>

            {/* Feedback */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                        <strong>❌ Erro:</strong> {error}
                    </p>
                </div>
            )}

            {success && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                        <strong>✅ Sucesso:</strong> Contexto salvo com sucesso!
                    </p>
                </div>
            )}

            {/* Botão Salvar */}
            <div className="mt-6">
                <button
                    onClick={handleSave}
                    disabled={loading || !companyProfileId}
                    className={`w-full px-6 py-3 rounded-md font-semibold transition-all ${loading || !companyProfileId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 active:scale-98 shadow-md'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Salvando...
                        </span>
                    ) : companyProfileId ? (
                        '💾 Salvar Contexto Operacional'
                    ) : (
                        '⚠️ Consulte o CNPJ primeiro'
                    )}
                </button>
            </div>
        </div>
    );
}
