'use client';

import { useState } from 'react';
import UploadPanel from '@/components/UploadPanel';
import PipelineStatusStepper from '@/components/PipelineStatusStepper';
import OCRQualityBanner from '@/components/OCRQualityBanner';
// ✅ SPRINT 3: Novos componentes
import CNPJPanel from '@/components/CNPJPanel';
import CompanyContextPanel from '@/components/CompanyContextPanel';
import QuestionBox from '@/components/QuestionBox';
import type { Question } from '@/components/QuestionBox';

export default function HomePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<'idle' | 'ready' | 'running' | 'success' | 'warning' | 'partial' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);

    // ✅ SPRINT 3: Estados adicionais
    const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
    const [contextData, setContextData] = useState<any>(null); // Novo estado

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles);
        setStatus(newFiles.length > 0 ? 'ready' : 'idle');
    };

    const handleAnalyze = async () => {
        if (files.length === 0) return;

        setStatus('running');
        setProgress({ step: 'upload', message: 'Enviando arquivos e contexto...' });

        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            // ✅ SPRINT 3: Incluir company_profile_id se disponível
            if (companyProfileId) {
                formData.append('company_profile_id', companyProfileId);
            }

            // ✅ SPRINT 3: Incluir Contexto Operacional se disponível
            if (contextData) {
                formData.append('context', JSON.stringify(contextData));
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Erro: ${response.statusText}`);
            }

            const data = await response.json();

            // ✅ OTIMIZAÇÃO DE STORAGE (Evitar Quota Exceeded)
            // Removemos dados pesados que não são usados no Dashboard inicial
            const optimizedData = { ...data };

            if (optimizedData.corpo_integrado) {
                // Remove detalhamento excessivo
                delete optimizedData.corpo_integrado.globalLines;
                delete optimizedData.corpo_integrado.segments;
                delete optimizedData.corpo_integrado.lineMap;
                delete optimizedData.corpo_integrado.textoCompleto; // Se muito grande
            }

            if (optimizedData._corpus) {
                delete optimizedData._corpus.globalLines;
                delete optimizedData._corpus.segments;
                delete optimizedData._corpus.lineMap;
                delete optimizedData._corpus.textoCompleto;
            }

            // Limita logs da caixa preta
            if (optimizedData.black_box && optimizedData.black_box.logs) {
                optimizedData.black_box.logs = optimizedData.black_box.logs.slice(0, 50);
            }

            try {
                localStorage.setItem(`result_${data.batch_id}`, JSON.stringify(optimizedData));
                localStorage.setItem('lastResult', JSON.stringify(optimizedData));
            } catch (storageError) {
                console.warn('Falha ao salvar no LocalStorage (Quota):', storageError);
                // Fallback: Apenas IDs e resumo
                const ultraLight = {
                    batch_id: data.batch_id,
                    status: data.status,
                    pipeline_summary: data.pipeline_summary,
                    results: data.results, // Pode ainda ser grande, mas essencial
                    timestamp: data.timestamp
                };
                try {
                    localStorage.clear(); // Tenta limpar velhos
                    localStorage.setItem(`result_${data.batch_id}`, JSON.stringify(ultraLight));
                    localStorage.setItem('lastResult', JSON.stringify(ultraLight));
                } catch (e) {
                    console.error('LocalStorage indisponível');
                }
            }

            setResult(data);
            setStatus(data.status === 'completed' ? 'success' : 'partial');
            setProgress({ step: 'done', message: 'Análise concluída! Redirecionando...' });

            // ✅ REDIRECIONAR PARA /results/{batch_id}
            setTimeout(() => {
                window.location.href = `/results/${data.batch_id}`;
            }, 1500);

        } catch (error: any) {
            console.error('Erro na análise:', error);
            setStatus('error');
            setProgress({ step: 'error', message: error.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        O Licitador Blindado
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Análise automática de licitações públicas
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* OCR Quality Banner (se resultado com OCR baixo) */}
                {result && (
                    <OCRQualityBanner
                        ocrQuality={result.pipeline_summary?.ocr_quality_avg || 0}
                        warnings={result.pipeline_warnings || []}
                    />
                )}

                {/* 1. Upload Panel */}
                <div className="mb-8">
                    <UploadPanel
                        files={files}
                        onFilesChange={handleFilesChange}
                        disabled={status === 'running'}
                    />
                </div>

                {/* ✅ SPRINT 3: 2. CNPJ Panel */}
                <div className="mb-8">
                    <CNPJPanel
                        onProfileLoaded={(profile) => setCompanyProfileId(profile.id)}
                    />
                </div>

                {/* ✅ SPRINT 3: 3. Company Context Panel (condicional) */}
                {companyProfileId && (
                    <div className="mb-8">
                        <CompanyContextPanel
                            companyProfileId={companyProfileId}
                            onContextChange={(ctx) => setContextData(ctx)} // Captura em tempo real
                        />
                    </div>
                )}

                {/* ✅ SPRINT 3: 4. Perguntas Pré-Análise */}
                <div className="mb-8">
                    <QuestionBox
                        mode="PRE"
                        title="❓ Perguntas Pré-Análise (Opcional)"
                        description="Faça perguntas antes da análise. Elas serão respondidas automaticamente após o processamento completo."
                    />
                </div>

                {/* Botão Analisar */}
                {status !== 'running' && files.length > 0 && (
                    <div className="mb-8">
                        <button
                            onClick={handleAnalyze}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={status !== 'ready' && status !== 'idle'}
                        >
                            Analisar Licitação
                        </button>
                    </div>
                )}

                {/* Pipeline Status */}
                {status === 'running' && (
                    <div className="mb-8">
                        <PipelineStatusStepper
                            status={status}
                            progress={progress}
                        />
                    </div>
                )}

                {/* Resultado (redirecionará, mas mostra brevemente) */}
                {(status === 'success' || status === 'partial' || status === 'warning') && result && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-4">
                            ✅ Análise Concluída
                        </h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>Batch ID:</strong> {result.batch_id}</p>
                            <p><strong>Status:</strong> {result.status}</p>
                            <p className="text-blue-600 font-semibold mt-4">
                                Redirecionando para dashboard completo...
                            </p>
                        </div>
                    </div>
                )}

                {/* Erro */}
                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-red-800 mb-2">
                            ❌ Erro na Análise
                        </h2>
                        <p className="text-red-700">{progress?.message}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
