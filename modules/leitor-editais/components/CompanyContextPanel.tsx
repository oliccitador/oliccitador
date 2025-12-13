'use client';

/**
 * CompanyContextPanel - Captura contexto operacional da empresa
 * 
 * @component
 * @sprint Sprint 3 - CNPJ/Contexto
 */

// ... imports ...
import { useState, useEffect } from 'react';

export interface CompanyContext {
    companyProfileId?: string;
    estoque: 'PRONTO' | 'SOB_ENCOMENDA' | 'NAO_TENHO';
    alcanceLogisticoKm: number | null;
    apetiteRisco: 'BAIXO' | 'MEDIO' | 'ALTO';
    observacoes: string;
}

interface CompanyContextPanelProps {
    companyProfileId?: string;
    // Callback para enviar dados ao pai em tempo real
    onContextChange?: (context: CompanyContext) => void;
}

export default function CompanyContextPanel({
    companyProfileId,
    onContextChange
}: CompanyContextPanelProps) {
    const [formData, setFormData] = useState<CompanyContext>({
        companyProfileId,
        estoque: 'PRONTO',
        alcanceLogisticoKm: null,
        apetiteRisco: 'MEDIO',
        observacoes: '',
    });

    // Propagar mudanças para o componente pai sempre que o form mudar
    useEffect(() => {
        if (onContextChange) {
            onContextChange({
                ...formData,
                companyProfileId // Garante que o ID atualizado vá junto
            });
        }
    }, [formData, companyProfileId, onContextChange]);

    const handleChange = (field: keyof CompanyContext, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    3. Contexto Operacional
                </h2>
                <p className="text-sm text-gray-600">
                    Informe características operacionais que afetam sua capacidade de participar.
                    Estes dados serão usados na análise da licitação.
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

            {/* Nota de rodapé explicativa em vez de botão */}
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estes dados serão salvos automaticamente ao clicar em "Analisar Licitação".
            </div>
        </div>
    );
}
