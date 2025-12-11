import './globals.css'
import { Inter } from 'next/font/google'
import { SupportButton } from '../components/whatsapp/SupportButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'O Licitador',
    description: 'Sistema de análise de editais e precificação baseado nas 4 Regras de Ouro e Lei 14.133/21.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                {children}
                <SupportButton />
            </body>
        </html>
    )
}
