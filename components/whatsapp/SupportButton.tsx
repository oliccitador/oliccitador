'use client';

import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface SupportButtonProps {
    context: 'public' | 'operacional';
    userId?: string;
    metadata?: {
        page?: string;
        plan?: string;
    };
}

/**
 * Floating support button component
 * Shows on every page, creates WhatsApp session based on context
 */
export function SupportButton({ context, userId, metadata }: SupportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        try {
            setIsLoading(true);

            // Create session via API
            const response = await fetch('/api/whatsapp/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: '', // Will be collected in modal
                    context,
                    userId,
                    metadata
                })
            });

            if (response.ok) {
                // Open WhatsApp deep link
                const botLabel = context === 'public' ? 'Suporte Comercial' : 'Suporte Técnico';
                const message = `Olá! Preciso de ajuda com ${botLabel}`;

                // Open WhatsApp Web or App
                const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';
                const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            alert('Desculpe, não foi possível abrir o WhatsApp. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const bgColor = context === 'public' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700';
    const label = context === 'public' ? '💼 Suporte Comercial' : '🔧 Suporte Técnico';

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`fixed bottom-6 right-6 ${bgColor} text-white rounded-full shadow-lg 
                       flex items-center gap-2 px-5 py-3 transition-all hover:scale-105 
                       disabled:opacity-50 disabled:hover:scale-100 z-50 group`}
            aria-label={label}
            title={label}
        >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden group-hover:inline-block font-medium text-sm">
                {isLoading ? 'Abrindo...' : label}
            </span>
        </button>
    );
}
