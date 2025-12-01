'use client';

import Link from 'next/link';
import { Brain, ArrowLeft, FileText, Search, CheckCircle, AlertCircle, Info, MousePointerClick, BookOpen } from 'lucide-react';

export default function TutorialPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] font-sans text-slate-100 selection:bg-cyan-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Brain className="w-8 h-8 text-cyan-400" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                O Licitador
                            </span>
                        </Link>
                        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para Início
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-400">
                            Como Usar O Licitador
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Guia passo a passo para transformar editais complexos em análises precisas em segundos.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* Passo 1 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-cyan-500 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-cyan-400">1.</span> Copie o texto do edital
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 mb-4">
                                    No primeiro campo da tela, copie exatamente o texto do edital ou Termo de Referência.
                                </p>
                                <div className="flex items-start gap-3 text-sm text-slate-400 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                    <Info className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <p>Esse campo é o ponto de partida da análise. A IA usará este texto para extrair todas as informações necessárias.</p>
                                </div>
                            </div>
                        </section>

                        {/* Passo 2 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-amber-500 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-amber-500">2.</span> Campos opcionais: CA e CATMAT
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 mb-6">
                                    Logo abaixo, você verá dois campos opcionais:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <h3 className="font-bold text-amber-400 mb-2">CA (Certificado de Aprovação)</h3>
                                        <p className="text-sm text-slate-300">Usado quando o item é um EPI com Certificado de Aprovação válido.</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <h3 className="font-bold text-amber-400 mb-2">CATMAT</h3>
                                        <p className="text-sm text-slate-300">Usado quando você já sabe o código oficial do Catálogo de Materiais.</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-400 italic">
                                    * Se você não tiver esses códigos, pode deixar em branco. A ferramenta entende e analisa mesmo assim.
                                </p>
                            </div>
                        </section>

                        {/* Passo 3 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-blue-500 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-blue-500">3.</span> Clique em “Analisar Item”
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex items-center gap-6">
                                <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                    <MousePointerClick className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-slate-300 mb-2">
                                        Depois de preencher a descrição (e os códigos opcionais), clique no botão:
                                    </p>
                                    <button className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 cursor-default">
                                        🔍 Analisar Item
                                    </button>
                                    <p className="mt-3 text-sm text-slate-400">
                                        A ferramenta processa automaticamente e exibe os resultados logo abaixo.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Passo 4 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-green-500 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-green-500">4.</span> Informações Oficiais
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 mb-4">
                                    Se o item tiver dados oficiais associados — como CATMAT ou CA — eles aparecerão no painel correspondente.
                                </p>
                                <ul className="space-y-2 text-slate-300">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Código oficial</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Nome oficial do item</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Classe do material</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Unidade de fornecimento</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Descrição técnica completa</li>
                                </ul>
                                <p className="mt-4 text-sm text-green-400 font-medium">
                                    Esse bloco ajuda você a validar que o item está identificado corretamente.
                                </p>
                            </div>
                        </section>

                        {/* Passo 5 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-orange-500 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-orange-500">5.</span> Carry Semântica
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 mb-4">
                                    Nesta área aparece a <strong>Carry Semântica</strong>, que é a descrição comercial organizada, objetiva e clara do item.
                                </p>
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                                    <h4 className="text-orange-400 font-bold mb-2">Use essa descrição para:</h4>
                                    <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
                                        <li className="flex items-center gap-2">🛒 Cotar preços com fornecedores</li>
                                        <li className="flex items-center gap-2">🔎 Buscar em catálogos e lojas</li>
                                        <li className="flex items-center gap-2">⚖️ Comparar marcas e modelos</li>
                                        <li className="flex items-center gap-2">🚫 Evitar erros de interpretação</li>
                                    </ul>
                                </div>
                                <p className="text-sm text-slate-400">
                                    A Carry Semântica funciona como uma descrição comercial final, pronta para uso na pesquisa de mercado.
                                </p>
                            </div>
                        </section>

                        {/* Passo 6 */}
                        <section className="relative pl-8 border-l-2 border-slate-700 hover:border-blue-400 transition-colors">
                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-blue-400">6.</span> Justificativa Técnica
                            </h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 mb-4">
                                    O último painel apresenta a Justificativa Técnica, conforme a Lei 14.133/21.
                                </p>
                                <div className="space-y-3 text-slate-300">
                                    <div className="flex gap-3">
                                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p>Comentários sobre a interpretação da descrição</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p>Informações oficiais quando aplicáveis</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p>Comprovação de equivalência técnica</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p>Texto pronto para anexar ao processo licitatório</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-blue-300 font-medium border-t border-white/5 pt-4">
                                    Esse bloco agrega segurança, transparência e rastreabilidade ao processo.
                                </p>
                            </div>
                        </section>

                        {/* Dicas Importantes */}
                        <section className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/20 rounded-3xl p-8">
                            <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-3">
                                <CheckCircle className="w-8 h-8" />
                                7. Dicas Importantes
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="text-slate-300">Sempre copie a descrição <strong>exatamente</strong> como está no edital.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="text-slate-300">Preencha o CA ou o CATMAT apenas se tiver <strong>certeza</strong> da informação.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="text-slate-300">Use a <strong>Carry Semântica</strong> para conversar com fornecedores.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="text-slate-300">Guarde a <strong>Justificativa Técnica</strong> para anexar ao processo.</p>
                                </div>
                            </div>
                        </section>

                        {/* Exemplo Completo */}
                        <section className="bg-slate-800/50 rounded-3xl p-8 border border-white/5 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">8. Exemplo Completo</h2>
                            <p className="text-slate-400 mb-8">
                                Após clicar em Analisar Item, a ferramenta exibirá automaticamente:
                            </p>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-900 rounded-xl border border-white/10">
                                    <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-white mb-2">Informações Oficiais</h3>
                                    <p className="text-sm text-slate-500">(Somente se existirem)</p>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-xl border border-white/10">
                                    <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-white mb-2">Carry Semântica</h3>
                                    <p className="text-sm text-slate-500">Descrição comercial para cotação</p>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-xl border border-white/10">
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-white mb-2">Justificativa Técnica</h3>
                                    <p className="text-sm text-slate-500">Para anexar ao processo</p>
                                </div>
                            </div>
                            <p className="mt-8 text-cyan-400 font-medium">
                                Tudo automaticamente, sem pesquisar manualmente na internet.
                            </p>
                        </section>
                    </div>

                    <div className="mt-16 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(8,145,178,0.6)] hover:shadow-[0_0_30px_rgba(8,145,178,0.8)] hover:-translate-y-1">
                            <Brain className="w-6 h-6" />
                            Começar a Usar Agora
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0b1120] py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-slate-500" />
                        <span className="text-slate-400 font-semibold">O Licitador</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="/terms" className="hover:text-cyan-400 transition-colors">Termos de Uso</Link>
                        <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacidade</Link>
                        <Link href="/tutorial" className="hover:text-cyan-400 transition-colors text-cyan-400">Tutorial</Link>
                        <a href="mailto:suporte.olicitador@gmail.com" className="hover:text-cyan-400 transition-colors">Contato</a>
                    </div>
                    <p className="text-slate-600 text-sm">© 2024 O Licitador. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
