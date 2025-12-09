'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, HelpCircle, X, Send, Paperclip, Loader2, Minus, ChevronUp } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatWidgetProps {
    mode: 'sales' | 'support';
}

export function ChatWidget({ mode }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- CONFIGURAÇÃO POR MODO ---
    const config = {
        sales: {
            storageKey: 'olicitador_chat_sales_phone',
            context: 'public',
            theme: {
                primary: 'bg-cyan-600',
                gradient: 'bg-gradient-to-r from-cyan-600 to-blue-600',
                light: 'bg-cyan-50',
                userMsg: 'bg-cyan-100',
                icon: <MessageSquare size={24} />,
                sendIconClass: 'text-cyan-600 hover:text-cyan-700'
            },
            texts: {
                trigger: 'Dúvidas sobre os planos?',
                headerTitle: 'Atendimento Comercial',
                headerSubtitle: 'Estamos online para te ajudar a escolher o melhor plano.',
                welcomeTitle: 'Olá! 👋',
                welcomeDesc: 'Para iniciarmos, qual seu WhatsApp?',
                placeholderPhone: 'Ex: 11999999999',
                buttonStart: 'Iniciar Conversa',
                suggestions: ['Quais são os planos?', 'Como funciona o teste?', 'Tem fidelidade?']
            },
            initialMsg: `Olá! Sou o assistente comercial. Como posso ajudar você a vender mais hoje?`
        },
        support: {
            storageKey: 'olicitador_chat_support_phone',
            context: 'operacional',
            theme: {
                primary: 'bg-slate-700',
                gradient: 'bg-gradient-to-r from-slate-700 to-slate-900',
                light: 'bg-slate-50',
                userMsg: 'bg-slate-200',
                icon: <HelpCircle size={24} />,
                sendIconClass: 'text-slate-700 hover:text-slate-800'
            },
            texts: {
                trigger: 'Precisa de ajuda técnica?',
                headerTitle: 'Suporte Técnico',
                headerSubtitle: 'Especialistas prontos para resolver seu problema.',
                welcomeTitle: 'Suporte Online 🛠️',
                welcomeDesc: 'Confirme seu WhatsApp de cadastro para o suporte.',
                placeholderPhone: 'Seu WhatsApp cadastrado',
                buttonStart: 'Acessar Suporte',
                suggestions: ['Não consigo analisar', 'Erro na cotação', 'Como funciona o CATMAT?']
            },
            initialMsg: `Olá! Sou o suporte técnico. Qual dificuldade você está encontrando na plataforma?`
        }
    }[mode];

    // --- EFEITOS E LÓGICA ---

    // Scroll automátio
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages, isOpen]);

    // Carregar sessão salva
    useEffect(() => {
        const storedPhone = localStorage.getItem(config.storageKey);
        if (storedPhone) {
            setPhone(storedPhone);
            setIsRegistered(true);
            fetchSession(storedPhone);
        }
    }, [config.storageKey]);

    const fetchSession = async (phoneNumber: string) => {
        try {
            // Reutilizamos a API existente, mas agora com isolamento via frontend
            // Na prática, o backend retorna a sessão daquele telefone.
            // O isolamento real de *histórico* acontece porque usamos telefones/chaves diferentes se o usuário quiser,
            // ou pelo próprio contexto que filtra as mensagens (se implementarmos filtro por contexto no back).
            // Por enquanto, o filtro frontend via 'config.context' ajuda a manter a coerência visual.
            const res = await fetch(`/.netlify/functions/whatsapp-session?phone=${phoneNumber}`);
            if (res.ok) {
                const data = await res.json();

                // IMPORTANTE: Aqui poderíamos filtrar mensagens por contexto se o backend retornasse tudo misturado.
                // Como backend atual é simples, assumimos que ele retorna o array 'messages'.
                // Para garantir V1 robusta: confiamos que o usuário usará o mesmo número,
                // mas a IA responderá baseado no contexto ATUAL que enviaremos no POST.

                if (data.messages) setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;

        localStorage.setItem(config.storageKey, phone);
        setIsRegistered(true);

        if (messages.length === 0) {
            const greeting: Message = {
                role: 'assistant',
                content: config.initialMsg,
                timestamp: new Date().toISOString()
            };
            setMessages([greeting]);
            // O backend salvará quando enviarmos a primeira mensagem ou podemos forçar um create session se necessário.
        }
    };

    const handleSendMessage = async (inputMsg: string) => {
        if (!inputMsg.trim() || !phone) return;

        const newUserMsg: Message = { role: 'user', content: inputMsg, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newUserMsg]);
        setMessage('');
        setLoading(true);

        try {
            const res = await fetch('/.netlify/functions/whatsapp-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message: inputMsg,
                    context: config.context // AQUI ESTÁ A CHAVE DO ISOLAMENTO DE CÉREBRO
                })
            });

            if (res.ok) {
                const data = await res.json();
                // O backend retorna a sessão atualizada com a resposta da IA
                if (data.messages) setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZAÇÃO ---

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Balão de convite (Trigger) */}
                <div className="mb-4 bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-[280px] border border-slate-100 cursor-pointer hover:scale-105 transition-transform origin-bottom-right" onClick={() => setIsOpen(true)}>
                    <div className="relative">
                        <div className={`absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white`}></div>
                        <div className={`p-2 rounded-full ${config.theme.userMsg} text-slate-700`}>
                            {config.theme.icon}
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">{config.texts.headerTitle}</p>
                        <p className="text-xs text-slate-500">{config.texts.trigger}</p>
                    </div>
                </div>

                {/* Botão Flutuante */}
                <button
                    onClick={() => setIsOpen(true)}
                    className={`${config.theme.gradient} text-white p-4 rounded-full shadow-lg shadow-cyan-900/20 hover:scale-110 transition-all duration-300 flex items-center justify-center`}
                >
                    {config.theme.icon}
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300 ${isMinimized ? 'w-[320px] h-[70px]' : 'w-[360px] h-[580px]'} animate-in slide-in-from-bottom-10 fade-in`}>

            {/* Header */}
            <div className={`${config.theme.gradient} p-5 text-white flex justify-between items-start relative overflow-hidden shrink-0 cursor-pointer`} onClick={() => !isRegistered && setIsMinimized(!isMinimized)}>
                {/* Decorative circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                <div className="flex gap-3 z-10 w-full pr-8">
                    <div className="relative">
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20"></div>
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            {config.theme.icon}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight">{config.texts.headerTitle}</h3>
                        {!isMinimized && (
                            <p className="text-xs text-white/80 mt-1 font-light leading-relaxed">
                                {config.texts.headerSubtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 z-20 absolute top-4 right-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        {isMinimized ? <ChevronUp size={18} /> : <Minus size={18} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden relative">

                    {!isRegistered ? (
                        // TELA DE REGISTRO
                        <div className="flex-1 flex flex-col justify-center p-6 text-center animate-in fade-in duration-500">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                                <div className={`w-12 h-12 ${config.theme.light} rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700`}>
                                    {config.theme.icon}
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg mb-2">{config.texts.welcomeTitle}</h4>
                                <p className="text-sm text-slate-500 mb-6">{config.texts.welcomeDesc}</p>

                                <form onSubmit={handleRegister} className="space-y-3">
                                    <input
                                        type="tel"
                                        placeholder={config.texts.placeholderPhone}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-800 transition-all placeholder:text-slate-400"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={phone.length < 8}
                                        className={`w-full ${config.theme.gradient} text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/10 hover:shadow-cyan-900/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {config.texts.buttonStart}
                                    </button>
                                </form>
                            </div>
                            <p className="text-[10px] text-slate-400">
                                Ao continuar, você concorda com nossos termos de uso.
                            </p>
                        </div>
                    ) : (
                        // TELA DE CHAT
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Mensagens */}
                                {messages.map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${isUser
                                                ? `${config.theme.gradient} text-white rounded-tr-none shadow-cyan-900/10`
                                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                                }`}>
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <span className={`text-[10px] block mt-1.5 opacity-70 ${isUser ? 'text-cyan-50 text-right' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="flex justify-start animate-in fade-in">
                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-slate-400" />
                                            <span className="text-xs text-slate-400 font-medium">Digitando...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Sugestões (Chips) */}
                            {messages.length < 3 && !loading && (
                                <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
                                    {config.texts.suggestions.map((sug, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(sug)}
                                            className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-cyan-200 hover:text-cyan-700 transition-colors shadow-sm"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-slate-100">
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-50 transition-all">
                                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200/50">
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent outline-none text-slate-700 text-sm placeholder:text-slate-400"
                                        placeholder="Digite aqui..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(message)}
                                    />
                                    <button
                                        onClick={() => handleSendMessage(message)}
                                        disabled={!message.trim() || loading}
                                        className={`p-2.5 rounded-full ${message.trim() ? config.theme.gradient + ' text-white shadow-md transform hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition-all duration-200`}
                                    >
                                        <Send size={18} className={message.trim() ? 'ml-0.5' : ''} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
