import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'O Licitador Blindado',
    description: 'Análise automática de licitações públicas com arquitetura multi-agentes',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
