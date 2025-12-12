'use client';

import { useState, useRef } from 'react';

interface UploadPanelProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'jpg', 'png'];

export default function UploadPanel({ files, onFilesChange, disabled }: UploadPanelProps) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Validar tamanho
        if (file.size > MAX_FILE_SIZE) {
            return `${file.name}: Arquivo muito grande (máx: 50MB)`;
        }

        // Validar extensão
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            return `${file.name}: Extensão não permitida (permitidas: ${ALLOWED_EXTENSIONS.join(', ')})`;
        }

        return null;
    };

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        setError(null);
        const newFiles: File[] = [];
        const errors: string[] = [];

        Array.from(fileList).forEach(file => {
            const validationError = validateFile(file);
            if (validationError) {
                errors.push(validationError);
            } else {
                newFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setError(errors.join('\n'));
        }

        if (newFiles.length > 0) {
            onFilesChange([...files, ...newFiles]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (disabled) return;
        handleFiles(e.target.files);
    };

    const handleRemove = (index: number) => {
        const updated = files.filter((_, i) => i !== index);
        onFilesChange(updated);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">1. Upload de Documentos</h2>

            {/* Dropzone */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-gray-600">
                        <span className="font-semibold text-blue-600">Clique para escolher</span> ou arraste arquivos aqui
                    </div>
                    <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX, XLSX, XLS, JPG, PNG (máx 50MB cada)
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png"
                    onChange={handleChange}
                    className="hidden"
                    disabled={disabled}
                />
            </div>

            {/* Erro */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm whitespace-pre-line">
                    {error}
                </div>
            )}

            {/* Lista de Arquivos */}
            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold mb-3">Arquivos Selecionados ({files.length})</h3>
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(index);
                                    }}
                                    disabled={disabled}
                                    className="ml-4 text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
