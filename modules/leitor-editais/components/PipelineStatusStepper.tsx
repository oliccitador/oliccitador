'use client';

interface PipelineStatusStepperProps {
    status: 'idle' | 'ready' | 'running' | 'success' | 'warning' | 'partial' | 'error';
    progress?: {
        step: string;
        message: string;
    };
}

const PIPELINE_STEPS = [
    { id: 'upload', label: 'Upload' },
    { id: 'classify', label: 'Classificação' },
    { id: 'ocr', label: 'OCR' },
    { id: 'normalize', label: 'Normalização' },
    { id: 'index', label: 'Indexação' },
    { id: 'dedup', label: 'Deduplicação' },
    { id: 'fusion', label: 'Fusão' },
    { id: 'extract', label: 'Extração' },
    { id: 'validate', label: 'Validação' },
];

export default function PipelineStatusStepper({ status, progress }: PipelineStatusStepperProps) {
    const getCurrentStepIndex = () => {
        if (!progress) return -1;
        return PIPELINE_STEPS.findIndex(s => s.id === progress.step);
    };

    const currentIndex = getCurrentStepIndex();

    const getStepStatus = (index: number): 'pending' | 'running' | 'success' | 'error' => {
        if (status === 'error' && index === currentIndex) return 'error';
        if (index < currentIndex) return 'success';
        if (index === currentIndex) return 'running';
        return 'pending';
    };

    const getStepColor = (stepStatus: string): string => {
        switch (stepStatus) {
            case 'success': return 'bg-green-500';
            case 'running': return 'bg-blue-500 animate-pulse';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-6">Pipeline de Processamento</h2>

            {/* Stepper */}
            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10"></div>

                {/* Progress Bar Fill */}
                <div
                    className="absolute top-5 left-0 h-1 bg-blue-500 -z-10 transition-all duration-300"
                    style={{ width: `${(currentIndex / (PIPELINE_STEPS.length - 1)) * 100}%` }}
                ></div>

                {/* Steps */}
                <div className="flex justify-between">
                    {PIPELINE_STEPS.map((step, index) => {
                        const stepStatus = getStepStatus(index);
                        const isActive = index === currentIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative" style={{ width: '10%' }}>
                                {/* Circle */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(stepStatus)} transition-colors duration-300`}>
                                    {stepStatus === 'success' && (
                                        <span className="text-white font-bold">✓</span>
                                    )}
                                    {stepStatus === 'running' && (
                                        <span className="text-white text-xs">{index + 1}</span>
                                    )}
                                    {stepStatus === 'error' && (
                                        <span className="text-white font-bold">✕</span>
                                    )}
                                    {stepStatus === 'pending' && (
                                        <span className="text-gray-600 text-xs">{index + 1}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`mt-2 text-xs text-center ${isActive ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress Message */}
            {progress && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        {progress.message}
                    </p>
                </div>
            )}

            {/* Status Summary */}
            {status === 'running' && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Processando...</span>
                </div>
            )}
        </div>
    );
}
