'use client';

interface OCRQualityBannerProps {
    ocrQuality: number; // 0-1
    warnings: string[];
}

export default function OCRQualityBanner({ ocrQuality, warnings }: OCRQualityBannerProps) {
    const hasLowOCR = ocrQuality < 0.5;
    const hasOCRWarning = warnings.some(w => w.toLowerCase().includes('ocr'));

    if (!hasLowOCR && !hasOCRWarning) {
        return null;
    }

    return (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-lg font-bold text-red-800">
                        ⚠️ Leitura com Baixa Confiabilidade (OCR Baixo)
                    </h3>
                    <p className="mt-2 text-sm text-red-700">
                        A qualidade de leitura dos documentos está abaixo do ideal ({(ocrQuality * 100).toFixed(0)}%).
                        <strong> Alguns campos podem estar incorretos ou incompletos.</strong>
                    </p>
                    <div className="mt-3 space-y-2">
                        <p className="text-sm text-red-700 font-semibold">
                            Campos sensíveis marcados com <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-yellow-900">LOW_CONFIDENCE</span> devem ser revisados manualmente.
                        </p>
                        <p className="text-sm text-red-700">
                            <strong>O que fazer:</strong>
                        </p>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-2">
                            <li>Anexar PDF com melhor qualidade</li>
                            <li>Anexar TR (Termo de Referência)</li>
                            <li>Anexar esclarecimentos oficiais</li>
                            <li>Revisar manualmente os campos críticos</li>
                        </ul>
                    </div>
                    <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
                        📎 Anexar Documentos Melhores
                    </button>
                </div>
            </div>
        </div>
    );
}
