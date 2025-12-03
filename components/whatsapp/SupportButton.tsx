'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface Session {
    phone: string;
    messages: Message[];
    context: 'public' | 'operacional';
}

export function SupportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const storedPhone = localStorage.getItem('whatsapp_phone');
        if (storedPhone) {
            setPhone(storedPhone);
            setIsRegistered(true);
            fetchSession(storedPhone);
        }
    }, []);

    const fetchSession = async (phoneNumber: string) => {
        try {
            const res = await fetch(`/.netlify/functions/whatsapp-session?phone=${phoneNumber}`);
            if (res.ok) {
                const data = await res.json();
                setSession(data);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;
        localStorage.setItem('whatsapp_phone', phone);
        setIsRegistered(true);
        fetchSession(phone);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !phone) return;

        const newMessage = message;
        setMessage('');
        setLoading(true);

        // Optimistic update
        setSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, { role: 'user', content: newMessage, timestamp: new Date().toISOString() }]
        } : null);

        try {
            const res = await fetch('/.netlify/functions/whatsapp-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message: newMessage,
                    context: window.location.pathname.includes('/dashboard') ? 'operacional' : 'public'
                })
            });

            if (res.ok) {
                await fetchSession(phone); // Refresh to get bot response if immediate
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center gap-2"
                >
                    <MessageCircle size={24} />
                    <span className="font-medium hidden md:inline">Suporte WhatsApp</span>
                </button>
            )}

            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-[350px] h-[500px] flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-[#075E54] p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <div>
                                <h3 className="font-bold">Suporte O Licitador</h3>
                                <p className="text-xs text-green-100">
                                    {isRegistered ? 'Online' : 'Identifique-se'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-1 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5] bg-opacity-50">
                        {!isRegistered ? (
                            <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                                <div className="bg-white p-6 rounded-xl shadow-sm w-full">
                                    <h4 className="font-semibold text-gray-800 mb-2">Bem-vindo!</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Para iniciar o atendimento, por favor informe seu número de WhatsApp.
                                    </p>
                                    <form onSubmit={handleRegister} className="space-y-3">
                                        <input
                                            type="tel"
                                            placeholder="Ex: 11999999999"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                                        >
                                            Iniciar Chat
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {session?.messages.length === 0 && (
                                    <div className="text-center text-xs text-gray-500 my-4">
                                        Inicie a conversa...
                                    </div>
                                )}
                                {session?.messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user'
                                                    ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none'
                                                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                                                }`}
                                        >
                                            {msg.content}
                                            <div className="text-[10px] text-gray-400 text-right mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-end">
                                        <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none">
                                            <Loader2 size={16} className="animate-spin text-green-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {isRegistered && (
                        <div className="p-3 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 p-2 border rounded-full focus:ring-2 focus:ring-green-500 outline-none px-4"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || loading}
                                    className="bg-[#075E54] text-white p-2 rounded-full hover:bg-green-800 disabled:opacity-50 transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
