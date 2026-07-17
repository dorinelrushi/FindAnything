'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, Send, Loader2, MapPin, MessageCircleQuestion } from 'lucide-react';

const QUICK_PROMPTS = [
    { label: 'Hotels', text: 'Suggest good hotels for my stay' },
    { label: 'Restaurants', text: 'Where should I eat? Best restaurants' },
    { label: 'Bars', text: 'Recommend bars and nightlife' },
    { label: 'Tours', text: 'What tours and activities do you have?' },
    { label: 'Shqip', text: 'Më sugjero hotele dhe restorante në Korçë' },
];

const TYPE_EMOJI = {
    hotel: '🏨',
    restaurant: '🍽️',
    bar: '🍸',
    bujtina: '🏡',
    tour: '🏔️',
    rentcar: '🚗',
    city: '🏘️',
};

function SuggestionCard({ item }) {
    return (
        <Link
            href={item.path || '/explore'}
            className="flex gap-3 p-2.5 rounded-xl border border-border-light bg-bg-light/80 hover:border-brand/40 hover:bg-brand/5 transition-colors group"
        >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0 border border-border-light">
                {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                        {TYPE_EMOJI[item.type] || '📍'}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                    {item.title}
                </p>
                <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                    <span>{TYPE_EMOJI[item.type] || '📍'}</span>
                    <span className="capitalize">{item.type}</span>
                    {(item.city || item.country) && (
                        <>
                            <span aria-hidden>·</span>
                            <MapPin className="w-3 h-3 inline" />
                            <span className="truncate">
                                {[item.city, item.country].filter(Boolean).join(', ')}
                            </span>
                        </>
                    )}
                </p>
                {item.why ? (
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{item.why}</p>
                ) : null}
            </div>
        </Link>
    );
}

export default function AskAI() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                'Hi! I\'m Ask AI ✨ Ask me in any language what you\'re looking for — hotels, restaurants, bars, tours, car rentals… I\'ll search this website and suggest real places.\n\nCiao · Merhaba · Γεια · Bonjour · Hallo · Përshëndetje',
            suggestions: [],
            followUpQuestions: [],
        },
    ]);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, loading, open]);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        }
    }, [open]);

    const sendMessage = async (text) => {
        const message = String(text || '').trim();
        if (!message || loading) return;

        setError(null);
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: message }]);
        setLoading(true);

        try {
            const history = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .map((m) => ({ role: m.role, content: m.content }))
                .slice(-8);

            const res = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply || 'Here are some ideas from the site.',
                    suggestions: data.suggestions || [],
                    followUpQuestions: data.followUpQuestions || [],
                },
            ]);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to reach Ask AI');
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        'Sorry — I could not answer right now. Please try again in a moment, or browse Explore for hotels, bars, and more.',
                    suggestions: [],
                    followUpQuestions: [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        sendMessage(input);
    };

    return (
        <>
            {/* Floating button — left side so it doesn't clash with community chat (right) */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 left-6 lg:bottom-10 lg:left-10 z-[90] flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-brand hover:bg-brand-hover text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 group"
                    aria-label="Open Ask AI"
                >
                    <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    </span>
                    <span className="font-bold text-sm tracking-tight">Ask AI</span>
                </button>
            )}

            {open && (
                <div
                    className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-[95] w-auto sm:w-[400px] max-w-[calc(100vw-2rem)] h-[min(620px,calc(100vh-5rem))] flex flex-col rounded-2xl border border-border-light bg-surface shadow-airbnb overflow-hidden"
                    role="dialog"
                    aria-label="Ask AI assistant"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-brand to-[#FF7A33] text-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm leading-tight">Ask AI</p>
                                <p className="text-[11px] text-white/85 truncate">
                                    Any language · real places from this site
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-2 rounded-full hover:bg-white/15 transition-colors"
                            aria-label="Close Ask AI"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-bg-light/40">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                        m.role === 'user'
                                            ? 'bg-brand text-white rounded-br-md'
                                            : 'bg-surface border border-border-light text-text-primary rounded-bl-md shadow-soft'
                                    }`}
                                >
                                    {m.role === 'assistant' && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand mb-1.5">
                                            <MessageCircleQuestion className="w-3.5 h-3.5" />
                                            Ask AI
                                        </div>
                                    )}
                                    <div>{m.content}</div>

                                    {m.suggestions?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {m.suggestions.map((s) => (
                                                <SuggestionCard key={s.id || s.path} item={s} />
                                            ))}
                                        </div>
                                    )}

                                    {m.followUpQuestions?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {m.followUpQuestions.map((q) => (
                                                <button
                                                    key={q}
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => sendMessage(q)}
                                                    className="text-[11px] px-2.5 py-1 rounded-full border border-brand/30 text-brand bg-brand/5 hover:bg-brand/10 font-semibold transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-surface border border-border-light rounded-2xl rounded-bl-md px-4 py-3 shadow-soft flex items-center gap-2 text-sm text-text-secondary">
                                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                                    Searching the website…
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border-t border-red-100 dark:border-red-900/40">
                            {error}
                        </div>
                    )}

                    {/* Quick prompts */}
                    <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-border-light bg-surface">
                        {QUICK_PROMPTS.map((p) => (
                            <button
                                key={p.label}
                                type="button"
                                disabled={loading}
                                onClick={() => sendMessage(p.text)}
                                className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border-light hover:border-brand/40 hover:text-brand text-text-secondary transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 flex gap-2 bg-surface">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask in any language…"
                            disabled={loading}
                            className="flex-1 min-w-0 rounded-full border border-border-light bg-bg-light px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                            maxLength={2000}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-11 h-11 rounded-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:hover:bg-brand text-white flex items-center justify-center flex-shrink-0 transition-colors"
                            aria-label="Send message"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
