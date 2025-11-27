import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar para a Home
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Política de Privacidade</h1>

                <div className="space-y-6 text-justify">
                    <p>Última atualização: 25 de Novembro de 2024</p>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Coleta de Informações</h2>
                        <p>Coletamos informações que você nos fornece diretamente, como seu nome, endereço de e-mail e dados de pagamento ao criar uma conta. Também coletamos dados de uso automaticamente quando você interage com nosso serviço.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. Uso das Informações</h2>
                        <p>Usamos suas informações para fornecer, manter e melhorar nossos serviços, processar transações, enviar comunicações relacionadas ao serviço e para fins de segurança e autenticação.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. Compartilhamento de Dados</h2>
                        <p>Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviços terceirizados (como processadores de pagamento e provedores de infraestrutura) estritamente para a operação do serviço.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. Segurança de Dados</h2>
                        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados. No entanto, nenhum método de transmissão pela Internet é 100% seguro.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">5. Seus Direitos</h2>
                        <p>Você tem o direito de acessar, corrigir ou excluir seus dados pessoais. Você pode gerenciar suas informações através das configurações da sua conta ou entrando em contato conosco.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">6. Cookies</h2>
                        <p>Utilizamos cookies e tecnologias semelhantes para melhorar a experiência do usuário e analisar o tráfego. Você pode controlar o uso de cookies através das configurações do seu navegador.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">7. Alterações nesta Política</h2>
                        <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas através do nosso site ou por e-mail.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
