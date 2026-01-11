'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FeaturedAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        // Check if ad popup was already shown in this session
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

                // Auto-close after 7 seconds
                setTimeout(() => {
                    setIsVisible(false);
                }, 7000);

                const token = localStorage.getItem('token');
                // Track views for all fetched ads
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
        <div className="ad-popup-overlay">
            <style jsx>{`
                .ad-popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: fadeIn 0.3s ease-out;
                }
                .ad-popup-content {
                    width: 90%;
                    max-width: 450px;
                    background: var(--card-bg);
                    border: 2px solid var(--primary);
                    border-radius: 20px;
                    padding: 25px;
                    position: relative;
                    box-shadow: 0 0 30px rgba(108, 92, 231, 0.4);
                    animation: scaleUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .close-timer {
                    position: absolute;
                    top: -15px;
                    right: -15px;
                    width: 40px;
                    height: 40px;
                    background: var(--primary);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
                .ad-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .ad-badge {
                    background: var(--primary);
                    color: white;
                    padding: 4px 12px;
                    font-size: 0.75rem;
                    border-radius: 20px;
                    font-weight: bold;
                }
                .ad-timer-bar {
                    height: 4px;
                    background: var(--primary);
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    animation: shrink 7s linear forwards;
                    border-bottom-left-radius: 20px;
                    border-bottom-right-radius: 20px;
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>

            <div className="ad-popup-content">
                <div className="close-timer" onClick={() => setIsVisible(false)}>&times;</div>
                <div className="ad-header">
                    <span className="ad-badge">RECOMMENDED</span>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Featured Ad</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: '12px',
                        backgroundImage: `url(${currentAd.listing.image || 'https://via.placeholder.com/400x200'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}></div>

                    <div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>{currentAd.content.title}</h3>
                        <p style={{ fontSize: '0.95rem', color: '#ccc', margin: 0, lineHeight: '1.5' }}>
                            {currentAd.content.description}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        {currentAd.content.whatsapp && (
                            <a
                                href={`https://wa.me/${currentAd.content.whatsapp}`}
                                target="_blank"
                                className="btn"
                                onClick={() => trackClick(currentAd)}
                                style={{ flex: 1, textAlign: 'center', background: '#25D366', textDecoration: 'none' }}
                            >
                                WhatsApp
                            </a>
                        )}
                        <Link
                            href={`/${currentAd.listing.type}/${currentAd.listing.slug || currentAd.listing._id}`}
                            className="btn"
                            style={{ flex: 1, textAlign: 'center', background: 'var(--primary)', textDecoration: 'none' }}
                            onClick={() => trackClick(currentAd)}
                        >
                            {currentAd.content.buttonText}
                        </Link>
                    </div>
                </div>

                <div className="ad-timer-bar"></div>
            </div>
        </div>
    );
}
