import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar para a Home
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Termos de Uso</h1>

                <div className="space-y-6 text-justify">
                    <p>Última atualização: 25 de Novembro de 2024</p>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Aceitação dos Termos</h2>
                        <p>Ao acessar e usar o O Licitador, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nosso serviço.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. Descrição do Serviço</h2>
                        <p>O Licitador é uma ferramenta de software como serviço (SaaS) que utiliza inteligência artificial para auxiliar na análise de editais de licitação, busca de preços e geração de justificativas técnicas. O serviço é fornecido "como está" e "conforme disponível".</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. Uso Aceitável</h2>
                        <p>Você concorda em usar o serviço apenas para fins legais e de acordo com estes Termos. Você não deve usar o serviço para qualquer finalidade ilegal ou não autorizada.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. Contas e Assinaturas</h2>
                        <p>Para acessar certos recursos, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais. As assinaturas são cobradas mensalmente e podem ser canceladas a qualquer momento.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">5. Limitação de Responsabilidade</h2>
                        <p>O Licitador não garante que os resultados gerados pela IA sejam 100% precisos ou livres de erros. A responsabilidade final pela verificação e uso das informações em processos licitatórios é exclusivamente do usuário. Em nenhum caso seremos responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequentes.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">6. Alterações nos Termos</h2>
                        <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">7. Contato</h2>
                        <p>Se você tiver dúvidas sobre estes Termos, entre em contato conosco através do suporte disponível na plataforma.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
