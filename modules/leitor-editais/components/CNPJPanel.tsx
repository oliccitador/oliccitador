'use client';

/**
 * CNPJPanel - Consulta e exibe dados do CNPJ
 * 
 * @component
 * @sprint Sprint 3 - CNPJ/Contexto
 */

import { useState } from 'react';
import { formatCNPJ } from '@/lib/services/receita';

interface CompanyProfile {
    id: string;
    cnpj: string;
    razaoSocial?: string;
    cnaes?: string[];
    porte?: string;
    situacaoCadastral?: string;
    cached?: boolean;
}

interface CNPJPanelProps {
    onProfileLoaded?: (profile: CompanyProfile) => void;
}

export default function CNPJPanel({ onProfileLoaded }: CNPJPanelProps) {
    const [cnpj, setCnpj] = useState('');
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Somente dígitos

        // Limitar a 14 dígitos
        if (value.length > 14) {
            value = value.substring(0, 14);
        }

        setCnpj(value);
        setError(null);
    };

    const handleLookup = async () => {
        if (cnpj.length !== 14) {
            setError('CNPJ deve conter 14 dígitos');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/company/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cnpj }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao consultar CNPJ');
            }

            const data: CompanyProfile = await res.json();
            setProfile(data);

            if (onProfileLoaded) {
                onProfileLoaded(data);
            }

        } catch (err: any) {
            console.error('Erro ao consultar CNPJ:', err);
            setError(err.message || 'Erro ao consultar Receita Federal');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLookup();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                    2. CNPJ da Empresa
                </h2>
                <span className="text-sm text-gray-500">(Opcional)</span>
            </div>

            <div className="flex gap-3 mb-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={formatCNPJ(cnpj)}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleLookup}
                    disabled={loading || cnpj.length !== 14}
                    className={`px-6 py-3 rounded-md font-semibold transition-all ${loading || cnpj.length !== 14
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Consultando...
                        </span>
                    ) : (
                        'Consultar Receita'
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
                    <p className="text-sm text-red-700">
                        <strong>❌ Erro:</strong> {error}
                    </p>
                </div>
            )}

            {profile && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                            📄 Dados da Empresa
                        </h3>
                        {profile.cached && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Cache
                            </span>
                        )}
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Razão Social:</span>
                            <p className="text-gray-900">{profile.razaoSocial || 'N/A'}</p>
                        </div>

                        <div>
                            <span className="font-medium text-gray-700">CNPJ:</span>
                            <p className="text-gray-900 font-mono">{formatCNPJ(profile.cnpj)}</p>
                        </div>

                        {profile.cnaes && profile.cnaes.length > 0 && (
                            <div>
                                <span className="font-medium text-gray-700">CNAEs:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {profile.cnaes.map((cnae, idx) => (
                                        <span
                                            key={idx}
                                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono"
                                        >
                                            {cnae}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.porte && (
                            <div>
                                <span className="font-medium text-gray-700">Porte:</span>
                                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                    {profile.porte}
                                </span>
                            </div>
                        )}

                        {profile.situacaoCadastral && (
                            <div>
                                <span className="font-medium text-gray-700">Situação:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${profile.situacaoCadastral === 'ATIVA'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {profile.situacaoCadastral}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
