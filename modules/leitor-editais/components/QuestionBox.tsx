'use client';

/**
 * QuestionBox - Módulo de perguntas PRE e POST análise
 * 
 * @component
 * @sprint Sprint 3 - Perguntas Pós-Análise
 */

import { useState } from 'react';

export interface Question {
    category: string;
    questionText: string;
}

export interface Answer {
    questionId: string;
    category: string;
    questionText: string;
    answerText: string;
    evidence: Array<{
        field: string;
        documento: string;
        pagina: number;
        trecho_literal: string;
    }>;
    status: 'OK' | 'LOW_CONFIDENCE' | 'NO_DATA';
    answerFormat: 'TEXT' | 'LEGAL_DRAFT';
}

interface QuestionBoxProps {
    mode: 'PRE' | 'POST';
    batchId?: string;
    title?: string;
    description?: string;
}

const CATEGORIES = [
    { value: 'habilitacao', label: '📋 Habilitação' },
    { value: 'capacidade_tecnica', label: '🔧 Capacidade Técnica' },
    { value: 'itens', label: '📦 Itens/Objeto' },
    { value: 'equivalencia_marca', label: '🏷️ Marca/Equivalência' },
    { value: 'divergencias', label: '⚠️ Divergências' },
    { value: 'prazos', label: '⏰ Prazos/Entrega' },
    { value: 'pagamento', label: '💰 Pagamento' },
    { value: 'penalidades', label: '⚖️ Penalidades/Garantias' },
    { value: 'me_epp', label: '🏢 MEI/ME/EPP' },
    { value: 'juridico', label: '📜 Jurídico' },
    { value: 'go_no_go', label: '✅ Decisão (Vale a pena?)' },
];

export default function QuestionBox({
    mode,
    batchId,
    title,
    description
}: QuestionBoxProps) {
    const [category, setCategory] = useState(CATEGORIES[0].value);
    const [questionText, setQuestionText] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultTitle = mode === 'PRE'
        ? '❓ Perguntas Pré-Análise'
        : '💬 Perguntas Pós-Análise';

    const defaultDescription = mode === 'PRE'
        ? 'Faça perguntas antes da análise. Elas serão respondidas após o processamento completo.'
        : 'Pergunte sobre pontos específicos usando os dados já analisados.';

    const handleAddQuestion = () => {
        if (!questionText.trim()) {
            setError('Digite uma pergunta válida');
            return;
        }

        setQuestions(prev => [...prev, { category, questionText }]);
        setQuestionText('');
        setError(null);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (questions.length === 0) {
            setError('Adicione pelo menos uma pergunta');
            return;
        }

        if (!batchId && mode === 'POST') {
            setError('Batch ID não fornecido');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Para modo PRE sem batchId, apenas armazena localmente
            if (mode === 'PRE' && !batchId) {
                setAnswers(questions.map((q, idx) => ({
                    questionId: `temp-${idx}`,
                    category: q.category,
                    questionText: q.questionText,
                    answerText: 'Pergunta registrada. Será respondida após a análise completa.',
                    evidence: [],
                    status: 'OK',
                    answerFormat: 'TEXT',
                })));
                setQuestions([]);
                setLoading(false);
                return;
            }

            // Enviar para API
            const res = await fetch(`/api/batches/${batchId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    questions,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao processar perguntas');
            }

            const data = await res.json();
            setAnswers(data.answers);
            setQuestions([]);

        } catch (err: any) {
            console.error('Erro ao processar perguntas:', err);
            setError(err.message || 'Erro ao processar perguntas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {title || defaultTitle}
                </h2>
                <p className="text-sm text-gray-600">
                    {description || defaultDescription}
                </p>
            </div>

            {/* Formulário de Nova Pergunta */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sua Pergunta
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Ex: Preciso de certidão negativa de débitos?"
                        rows={3}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleAddQuestion();
                            }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Pressione Ctrl+Enter para adicionar
                    </p>
                </div>

                <button
                    onClick={handleAddQuestion}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all"
                >
                    ➕ Adicionar Pergunta
                </button>
            </div>

            {/* Lista de Perguntas Adicionadas */}
            {questions.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Perguntas Adicionadas ({questions.length})
                    </h3>
                    <div className="space-y-2">
                        {questions.map((q, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex-1">
                                    <div className="text-xs text-blue-600 font-medium mb-1">
                                        {CATEGORIES.find(c => c.value === q.category)?.label}
                                    </div>
                                    <div className="text-sm text-gray-900">{q.questionText}</div>
                                </div>
                                <button
                                    onClick={() => handleRemoveQuestion(idx)}
                                    className="text-red-600 hover:text-red-800 font-bold"
                                    title="Remover"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Botão de Enviar */}
            {questions.length > 0 && (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full px-6 py-3 rounded-md font-semibold transition-all ${loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processando...
                        </span>
                    ) : (
                        `🚀 Enviar ${questions.length} Pergunta${questions.length > 1 ? 's' : ''}`
                    )}
                </button>
            )}

            {/* Erro */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                        <strong>❌ Erro:</strong> {error}
                    </p>
                </div>
            )}

            {/* Respostas */}
            {answers.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        📝 Respostas ({answers.length})
                    </h3>
                    <div className="space-y-4">
                        {answers.map((answer, idx) => (
                            <div
                                key={answer.questionId}
                                className={`p-5 rounded-md border-2 ${answer.status === 'NO_DATA'
                                        ? 'bg-yellow-50 border-yellow-300'
                                        : answer.status === 'LOW_CONFIDENCE'
                                            ? 'bg-orange-50 border-orange-300'
                                            : 'bg-green-50 border-green-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium">
                                            {CATEGORIES.find(c => c.value === answer.category)?.label || answer.category}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-semibold ${answer.status === 'OK' ? 'bg-green-200 text-green-800' :
                                            answer.status === 'LOW_CONFIDENCE' ? 'bg-orange-200 text-orange-800' :
                                                'bg-yellow-200 text-yellow-800'
                                        }`}>
                                        {answer.status}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <strong className="text-sm text-gray-700">Pergunta:</strong>
                                    <p className="text-sm text-gray-900 mt-1">{answer.questionText}</p>
                                </div>

                                <div className="mb-3">
                                    <strong className="text-sm text-gray-700">Resposta:</strong>
                                    <pre className="text-sm text-gray-900 mt-1 whitespace-pre-wrap font-sans">
                                        {answer.answerText}
                                    </pre>
                                </div>

                                {answer.evidence && answer.evidence.length > 0 && (
                                    <div>
                                        <strong className="text-xs text-gray-600">Evidências:</strong>
                                        <div className="mt-2 space-y-1">
                                            {answer.evidence.map((ev, evIdx) => (
                                                <div key={evIdx} className="text-xs bg-white p-2 rounded border border-gray-200">
                                                    <div className="font-mono text-gray-500">
                                                        {ev.documento} - Pág. {ev.pagina}
                                                    </div>
                                                    <div className="text-gray-700 italic mt-1">
                                                        "{ev.trecho_literal.substring(0, 150)}..."
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
