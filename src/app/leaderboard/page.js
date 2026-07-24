'use client';
import BusinessLeaderboard from '@/app/components/BusinessLeaderboard';
import Link from 'next/link';

export default function LeaderboardPage() {
    return (
        <main className="min-h-screen bg-surface pb-20">
            <div className="container-wide py-10 md:py-16 space-y-8">
                <div className="space-y-4 max-w-2xl">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-brand transition-colors"
                    >
                        ← Back to home
                    </Link>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                            Live rankings
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mt-2">
                            Business Leaderboard
                        </h1>
                        <p className="text-text-secondary text-base md:text-lg mt-3 leading-relaxed">
                            See which hotels, restaurants, and bars are leading right now — based on
                            page visits, QR scans, and traveler recommendations.
                        </p>
                    </div>
                </div>

                <BusinessLeaderboard showHeader={false} showFullLink={false} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    {[
                        {
                            title: 'Visits',
                            text: 'Page views when travelers open a listing and explore photos, menus, and details.',
                            icon: '👀',
                        },
                        {
                            title: 'QR scans',
                            text: 'Unique check-ins when guests scan a business QR code in person.',
                            icon: '📱',
                        },
                        {
                            title: 'Recommendations',
                            text: 'Weighted score from real reviews — higher ratings and more reviews rank higher.',
                            icon: '⭐',
                        },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="p-6 rounded-3xl border border-border-light bg-bg-light space-y-2"
                        >
                            <span className="text-2xl">{card.icon}</span>
                            <h3 className="font-black text-text-primary">{card.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{card.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
