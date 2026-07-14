'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BudgetDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/budgets/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) setBudget(data.budget);
                else setNotFound(true);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const cleanPhone = (num) => num?.replace(/[^\d]/g, '') || '';
    const formatLink = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `https://${url}`;
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    };

    const getAvatarBg = (name) => {
        if (!name) return '#e8eaed';
        const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const colors = ['#fce7f3','#ede9fe','#e0e7ff','#dbeafe','#ccfbf1','#d1fae5','#fef9c3','#ffedd5','#ffe4e6'];
        const text   = ['#be185d','#6d28d9','#3730a3','#1d4ed8','#0f766e','#065f46','#92400e','#c2410c','#be123c'];
        const i = sum % colors.length;
        return { bg: colors[i], text: text[i] };
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary font-semibold">Loading request…</p>
                </div>
            </main>
        );
    }

    if (notFound || !budget) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <div className="text-6xl">🔍</div>
                    <h1 className="text-2xl font-black text-text-primary">Post not found</h1>
                    <p className="text-text-secondary">This budget request may have been deleted.</p>
                    <Link href="/budgets" className="inline-block mt-2 bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover transition-all">
                        ← Back to Budgets
                    </Link>
                </div>
            </main>
        );
    }

    const posterName = budget.user?.name || 'Visitor';
    const avatarStyle = getAvatarBg(posterName);

    return (
        <main className="min-h-screen bg-bg-light py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Back Button */}
                <Link
                    href="/budgets"
                    className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> All Requests
                </Link>

                {/* Main Card */}
                <article className="bg-surface rounded-[2rem] border border-border-light/40 shadow-airbnb overflow-hidden">

                    {/* Card Top Banner */}
                    <div className="bg-gradient-to-r from-brand/10 via-brand/5 to-transparent px-8 py-6 border-b border-border-light/30">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {/* Poster */}
                            <div className="flex items-center gap-4">
                                {budget.user?.image ? (
                                    <img
                                        src={budget.user.image}
                                        alt={posterName}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                                    />
                                ) : (
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-base shadow-inner select-none"
                                        style={{ background: avatarStyle.bg, color: avatarStyle.text }}
                                    >
                                        {getInitials(posterName)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-black text-base text-text-primary">{posterName}</p>
                                    <p className="text-xs text-text-secondary font-semibold">
                                        📅 Posted {new Date(budget.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Budget Badge */}
                            <span className="bg-brand text-white text-sm font-black px-4 py-2 rounded-xl shadow flex items-center gap-1.5">
                                💰 {budget.budget}
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-7 space-y-6">
                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight leading-snug">
                            {budget.title}
                        </h1>

                        {/* Full Description */}
                        <div className="bg-bg-light rounded-2xl p-5 border border-border-light/40">
                            <h2 className="text-[11px] uppercase font-black text-text-secondary tracking-widest mb-3">
                                📋 Full Request Details
                            </h2>
                            <p className="text-text-primary text-[15px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                                {budget.description}
                            </p>
                        </div>

                        {/* Contact Section */}
                        <div className="space-y-4">
                            <h2 className="text-[11px] uppercase font-black text-text-secondary tracking-widest">
                                📞 Contact this Traveler
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {budget.whatsappNumber ? (
                                    <a
                                        href={`https://wa.me/${cleanPhone(budget.whatsappNumber)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-sm shadow hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        💬 WhatsApp
                                    </a>
                                ) : (
                                    <span className="flex items-center justify-center gap-2 bg-bg-light text-text-secondary/40 py-3.5 rounded-xl text-sm border border-dashed select-none">
                                        💬 No WhatsApp
                                    </span>
                                )}

                                {budget.instagramLink ? (
                                    <a
                                        href={formatLink(budget.instagramLink)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white py-3.5 rounded-xl font-bold text-sm shadow hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        📸 Instagram
                                    </a>
                                ) : (
                                    <span className="flex items-center justify-center gap-2 bg-bg-light text-text-secondary/40 py-3.5 rounded-xl text-sm border border-dashed select-none">
                                        📸 No Instagram
                                    </span>
                                )}

                                {budget.facebookLink ? (
                                    <a
                                        href={formatLink(budget.facebookLink)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3.5 rounded-xl font-bold text-sm shadow hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        👥 Facebook
                                    </a>
                                ) : (
                                    <span className="flex items-center justify-center gap-2 bg-bg-light text-text-secondary/40 py-3.5 rounded-xl text-sm border border-dashed select-none">
                                        👥 No Facebook
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border-light/30 px-8 py-5 bg-bg-light/50 flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-xs text-text-secondary font-semibold">
                            🌍 Posted on KorcaCity — Tourist Budgets
                        </p>
                        <Link
                            href="/budgets"
                            className="text-xs font-black text-brand hover:underline"
                        >
                            ← View all requests
                        </Link>
                    </div>
                </article>
            </div>
        </main>
    );
}
