'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

export function ChatManager() {
    const pathname = usePathname();

    // Lógica RIGIDA de separação:
    // Apenas rotas de sistema (dashboard, analise, producao) recebem suporte técnico
    const isSupportContext =
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/analise') ||
        pathname?.startsWith('/producao');

    // Se estiver na rota de suporte, mostra APENAS suporte.
    // Se estiver em qualquer outra (home, login, pricing), mostra APENAS vendas.

    // Key é importante para forçar o React a remontar o componente quando mudar de modo,
    // garantindo que não vaze estado (phone, messages) de um para outro na memória.
    return (
        <ChatWidget
            key={isSupportContext ? 'support-chat' : 'sales-chat'}
            mode={isSupportContext ? 'support' : 'sales'}
        />
    );
}
