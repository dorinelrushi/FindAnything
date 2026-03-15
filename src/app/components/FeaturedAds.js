'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FeaturedAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        const adShown = sessionStorage.getItem('ad_shown');
        if (!adShown) {
            fetchAds();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchAds = async () => {
        try {
            const res = await fetch('/api/ads');
            const data = await res.json();
            if (data.success && data.ads.length > 0) {
                setAds(data.ads);
                setIsVisible(true);
                sessionStorage.setItem('ad_shown', 'true');

                setTimeout(() => {
                    setIsVisible(false);
                }, 10000);

                const token = localStorage.getItem('token');
                data.ads.forEach(ad => {
                    fetch(`/api/ads/${ad._id}/track`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({ type: 'view' })
                    }).catch(() => { });
                });
            }
        } catch (error) {
            console.error('Failed to fetch ads', error);
        } finally {
            setLoading(false);
        }
    };

    const trackClick = (ad) => {
        const token = localStorage.getItem('token');
        fetch(`/api/ads/${ad._id}/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ type: 'click' })
        }).catch(() => { });

        fetch('/api/user/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: ad.listing.type })
        });
    };

    if (loading || ads.length === 0 || !isVisible) return null;

    const currentAd = ads[currentAdIndex];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-airbnb animate-in zoom-in-95 ease-out duration-400">
                {/* Close Button */}
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>

                {/* Ad Content */}
                <div className="flex flex-col">
                    <div className="h-64 overflow-hidden bg-bg-light">
                        <img 
                            src={currentAd.listing.image || 'https://via.placeholder.com/600x400'} 
                            alt={currentAd.content.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Sygjeruar</span>
                            <h3 className="text-3xl font-extrabold text-text-primary">{currentAd.content.title}</h3>
                            <p className="text-text-secondary leading-relaxed">
                                {currentAd.content.description}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            {currentAd.content.whatsapp && (
                                <a
                                    href={`https://wa.me/${currentAd.content.whatsapp}`}
                                    target="_blank"
                                    onClick={() => trackClick(currentAd)}
                                    className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold text-center transition-colors shadow-sm active:scale-95"
                                >
                                    WhatsApp
                                </a>
                            )}
                            <Link
                                href={`/${currentAd.listing.type}/${currentAd.listing.slug || currentAd.listing._id}`}
                                onClick={() => { trackClick(currentAd); setIsVisible(false); }}
                                className="flex-1 bg-brand hover:bg-brand-hover text-white py-4 rounded-xl font-bold text-center transition-colors shadow-soft active:scale-95"
                            >
                                {currentAd.content.buttonText || 'Shiko më shumë'}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Animated Timer Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-brand w-full origin-left animate-[shrink_10s_linear_forwards]" />
            </div>

            <style jsx global>{`
                @keyframes shrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
}
