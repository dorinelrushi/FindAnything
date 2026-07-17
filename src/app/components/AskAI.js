'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sparkles,
    X,
    Send,
    Loader2,
    MapPin,
    MessageCircleQuestion,
    Briefcase,
    BookOpen,
    ExternalLink,
} from 'lucide-react';

const QUICK_PROMPTS = [
    { label: '🐾 Pets OK?', text: 'Show me hotels that allow pets' },
    { label: '🏨 Top hotel', text: 'What is the most visited hotel?' },
    { label: '📶 Wi-Fi', text: 'Hotels with free Wi-Fi' },
    { label: '💼 Jobs', text: 'Show me available jobs' },
    { label: '🎵 Live Music', text: 'Bars with live music' },
    { label: '🗺️ Tours', text: 'What tours are available?' },
    { label: '🍽️ Restaurants', text: 'Suggest a good restaurant' },
    { label: '🇦🇱 Shqip', text: 'Hotele që lejojnë kafshë shtëpiake në Tiranë' },
];


const TYPE_EMOJI = {
    hotel: '🏨',
    restaurant: '🍽️',
    bar: '🍸',
    bujtina: '🏡',
    tour: '🏔️',
    rentcar: '🚗',
    city: '🏘️',
    job: '💼',
    blog: '📝',
};

function SuggestionCard({ item }) {
    const kind = item.kind || (item.type === 'job' ? 'job' : item.type === 'blog' ? 'blog' : 'place');
    const href =
        kind === 'job' ? item.applicationLink || item.path || '/jobs' : item.path || '/explore';
    const external = kind === 'job' && item.applicationLink && /^https?:\/\//i.test(item.applicationLink);

    const meta =
        kind === 'job'
            ? [item.companyName, item.city].filter(Boolean).join(' · ')
            : kind === 'blog'
              ? 'Blog / guide'
              : [item.type, item.city, item.country].filter(Boolean).join(' · ');

    const icon =
        kind === 'job' ? (
            <Briefcase className="w-5 h-5 text-brand" />
        ) : kind === 'blog' ? (
            <BookOpen className="w-5 h-5 text-brand" />
        ) : (
            <span className="text-xl">{TYPE_EMOJI[item.type] || '📍'}</span>
        );

    const inner = (
        <>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0 border border-border-light flex items-center justify-center">
                {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                    icon
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                    {item.title}
                </p>
                <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5 capitalize">
                    {kind === 'place' && <MapPin className="w-3 h-3 flex-shrink-0" />}
                    {kind === 'job' && <Briefcase className="w-3 h-3 flex-shrink-0" />}
                    {kind === 'blog' && <BookOpen className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{meta || kind}</span>
                    {typeof item.views === 'number' && item.views > 0 && kind === 'place' && (
                        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                            {item.views} views
                        </span>
                    )}
                </p>
                {item.why ? (
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{item.why}</p>
                ) : null}
                {external && (
                    <p className="text-[10px] text-brand font-semibold mt-1 flex items-center gap-1">
                        Apply <ExternalLink className="w-3 h-3" />
                    </p>
                )}
            </div>
        </>
    );

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-2.5 rounded-xl border border-border-light bg-bg-light/80 hover:border-brand/40 hover:bg-brand/5 transition-colors group"
            >
                {inner}
            </a>
        );
    }

    return (
        <Link
            href={href}
            className="flex gap-3 p-2.5 rounded-xl border border-border-light bg-bg-light/80 hover:border-brand/40 hover:bg-brand/5 transition-colors group"
        >
            {inner}
        </Link>
    );
}

export default function AskAI() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pathname = usePathname();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                "Hello! 👋 I'm Ask AI, your personal guide on TryToFindEverything.\n\nI read this site's real database — hotels (with pet & family policies), restaurants, bars, tours, car rentals, jobs, and travel blogs. Ask me anything, in any language!\n\n💡 Try:\n• \"Hotels that allow pets in Tirana\"\n• \"Most visited hotel\"\n• \"Bars with live music\"\n• \"Jobs available\"",
            suggestions: [],
            followUpQuestions: ['Hotels that allow pets', 'Most visited hotel', 'Show available jobs'],
        },
    ]);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // Extract current listing slug if viewing a listing details page
    const pathParts = pathname ? pathname.split('/').filter(Boolean) : [];
    const isListingPage = pathParts.length === 2 && [
        'hotel',
        'restaurant',
        'bar',
        'bujtina',
        'rentcar',
        'tour',
    ].includes(pathParts[0].toLowerCase());
    const currentSlug = isListingPage ? pathParts[1] : null;

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-ask-ai', handleOpen);
        return () => window.removeEventListener('open-ask-ai', handleOpen);
    }, []);

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
            // Send full history including prior suggestion cards so "one more" can avoid repeats
            const history = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                    suggestions: m.suggestions || [],
                }))
                .slice(-12);

            const res = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history, currentSlug }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply || "I'm here — how can I help?",
                    suggestions: data.suggestions || [],
                    followUpQuestions: data.followUpQuestions || [],
                    intent: data.intent,
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
                        "I'm sorry — I couldn't reach the assistant just now. Please try again in a moment, or browse Explore, Jobs, and Blog on the site.",
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
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-[90] flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-brand hover:bg-brand-hover text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 group"
                    aria-label="Open Ask AI chat"
                >
                    <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    </span>
                    <span className="font-bold text-sm tracking-tight">Ask AI</span>
                </button>
            )}

            {open && (
                <div
                    className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-[95] w-auto sm:w-[420px] max-w-[calc(100vw-2rem)] h-[min(680px,calc(100vh-5rem))] flex flex-col rounded-2xl border border-border-light bg-surface shadow-airbnb overflow-hidden"
                    role="dialog"
                    aria-label="Ask AI chat"
                >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-brand to-[#FF7A33] text-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm leading-tight">Ask AI</p>
                                <p className="text-[11px] text-white/85 truncate">
                                    Professional concierge · any language
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

                    <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-bg-light/40">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[94%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
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
                                                <SuggestionCard
                                                    key={`${s.kind || s.type}-${s.id || s.path}-${s.title}`}
                                                    item={s}
                                                />
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
                                                    className="text-[11px] px-2.5 py-1 rounded-full border border-brand/30 text-brand bg-brand/5 hover:bg-brand/10 font-semibold transition-colors text-left"
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
                                    Thinking…
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border-t border-red-100 dark:border-red-900/40">
                            {error}
                        </div>
                    )}

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

                    <form onSubmit={handleSubmit} className="p-3 flex gap-2 bg-surface">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type naturally — any language…"
                            disabled={loading}
                            className="flex-1 min-w-0 rounded-full border border-border-light bg-bg-light px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                            maxLength={2500}
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
