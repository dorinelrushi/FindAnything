'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
    {
        key: 'mostVisitedHotel',
        title: 'Most Visited Hotel',
        emoji: '🏨',
        accent: 'from-sky-500/15 to-blue-500/5',
        border: 'border-sky-500/20',
        badge: 'Views',
        metric: (item) => `${(item?.views || 0).toLocaleString()} views`,
    },
    {
        key: 'mostPopularRestaurant',
        title: 'Most Popular Restaurant',
        emoji: '🍽️',
        accent: 'from-orange-500/15 to-amber-500/5',
        border: 'border-orange-500/20',
        badge: 'Popular',
        metric: (item) => `${(item?.views || 0).toLocaleString()} views`,
    },
    {
        key: 'mostScannedBar',
        title: 'Most Scanned Bar',
        emoji: '🍸',
        accent: 'from-violet-500/15 to-purple-500/5',
        border: 'border-violet-500/20',
        badge: 'Scans',
        metric: (item) => `${(item?.scanCount || 0).toLocaleString()} scans`,
    },
    {
        key: 'mostScannedQR',
        title: 'Most Scanned QR',
        emoji: '📱',
        accent: 'from-brand/15 to-rose-500/5',
        border: 'border-brand/20',
        badge: 'Top QR',
        metric: (item) => `${(item?.scanCount || 0).toLocaleString()} scans`,
    },
    {
        key: 'mostRecommended',
        title: 'Most Recommended Business',
        emoji: '⭐',
        accent: 'from-yellow-500/20 to-amber-400/5',
        border: 'border-yellow-500/25',
        badge: 'Top rated',
        metric: (item) =>
            item?.reviewCount > 0
                ? `${item.avgRating}★ · ${item.reviewCount} review${item.reviewCount === 1 ? '' : 's'}`
                : `${(item?.views || 0).toLocaleString()} views`,
    },
];

function LeaderboardCard({ category, item, rank }) {
    if (!item) {
        return (
            <div
                className={`relative flex flex-col rounded-3xl border ${category.border} bg-gradient-to-br ${category.accent} p-5 min-h-[220px] opacity-70`}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-surface/80 px-2.5 py-1 rounded-full">
                        {category.badge}
                    </span>
                </div>
                <h3 className="text-sm font-black text-text-primary leading-snug mb-3">
                    {category.title}
                </h3>
                <p className="text-xs text-text-secondary mt-auto">No listings yet — be the first!</p>
            </div>
        );
    }

    return (
        <Link
            href={item.path || '/'}
            className={`group relative flex flex-col rounded-3xl border ${category.border} bg-gradient-to-br ${category.accent} overflow-hidden hover:shadow-airbnb hover:-translate-y-1 transition-all duration-300 min-h-[220px]`}
        >
            <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-inverse text-on-inverse text-xs font-black flex items-center justify-center shadow-soft">
                #{rank}
            </div>

            <div className="relative h-28 bg-bg-light overflow-hidden">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-bg-light">
                        {category.emoji}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-2 right-2 text-[10px] font-black uppercase tracking-widest text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {category.badge}
                </span>
            </div>

            <div className="flex flex-col flex-1 p-4 space-y-2">
                <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">{category.emoji}</span>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            {category.title}
                        </p>
                        <h3 className="text-base font-extrabold text-text-primary leading-tight line-clamp-2 group-hover:text-brand transition-colors">
                            {item.title}
                        </h3>
                    </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="text-xs font-bold text-brand">{category.metric(item)}</p>
                    {(item.city || item.type) && (
                        <p className="text-[10px] font-medium text-text-secondary capitalize truncate">
                            {item.type}
                            {item.city ? ` · ${item.city}` : ''}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function BusinessLeaderboard({ showHeader = true, showFullLink = true }) {
    const [leaderboard, setLeaderboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch('/api/leaderboard');
                const data = await res.json();
                if (!cancelled && data.success) {
                    setLeaderboard(data.leaderboard);
                }
            } catch (e) {
                console.error('Failed to load leaderboard', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const hasAny =
        leaderboard &&
        CATEGORIES.some((c) => leaderboard[c.key]);

    if (!loading && !hasAny) return null;

    return (
        <section
            className={`${showHeader ? 'pt-12 border-t border-border-light' : ''} scroll-mt-24`}
            id="business-leaderboard"
        >
            {showHeader && (
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                            Rankings
                        </span>
                        <h2 className="text-3xl font-extrabold text-text-primary mt-2">
                            Business Leaderboard
                        </h2>
                        <p className="text-text-secondary text-sm mt-2 max-w-xl">
                            Live standings from real visits, QR scans, and traveler recommendations across the platform.
                        </p>
                    </div>
                    {showFullLink && (
                        <Link
                            href="/leaderboard"
                            className="text-sm font-bold text-text-primary hover:text-brand transition-colors underline underline-offset-4 self-start sm:self-auto"
                        >
                            Full leaderboard →
                        </Link>
                    )}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-3xl border border-border-light bg-bg-light h-[220px] animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    {CATEGORIES.map((category, index) => (
                        <LeaderboardCard
                            key={category.key}
                            category={category}
                            item={leaderboard?.[category.key]}
                            rank={index + 1}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
