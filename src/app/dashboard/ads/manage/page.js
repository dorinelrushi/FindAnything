'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyAds() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [ads, setAds] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchMyAds();
        }
    }, [user]);

    const fetchMyAds = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ads/my-ads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            }
        } catch (error) {
            console.error('Failed to fetch ads', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const getDaysLeft = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    if (loading || statsLoading) return <div className="container"><p>Loading...</p></div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1>My Advertisements</h1>
                <Link href="/dashboard" className="btn" style={{ background: 'var(--secondary)', textDecoration: 'none' }}>Back to Dashboard</Link>
            </div>

            {ads.length === 0 ? (
                <div className="glass card" style={{ textAlign: 'center', padding: '50px' }}>
                    <p>You don't have any advertisements yet.</p>
                    <Link href="/dashboard" className="btn" style={{ marginTop: '20px', textDecoration: 'none', display: 'inline-block' }}>Promote a Listing</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {ads.map(ad => {
                        const daysLeft = getDaysLeft(ad.endDate);
                        const isActive = ad.status === 'active' && daysLeft > 0;

                        return (
                            <div key={ad._id} className="glass card" style={{
                                padding: '30px',
                                border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                backgroundImage: `url(${ad.listing?.image || ''})`,
                                                backgroundSize: 'cover'
                                            }}></div>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{ad.content.title}</h3>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Listing: {ad.listing?.title}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                            <div>
                                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>STATUS</p>
                                                <span style={{
                                                    color: isActive ? '#55efc4' : '#ff7675',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {isActive ? 'ACTIVE' : (ad.status === 'pending' ? 'PENDING' : 'EXPIRED')}
                                                </span>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>DAYS LEFT</p>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{daysLeft} Days</span>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>PLAN</p>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{ad.plan.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        minWidth: '300px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '20px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>TOTAL VIEWS</p>
                                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{ad.views || 0}</span>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>CLICKS</p>
                                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{ad.clicks || 0}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                            <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>ENGAGEMENT RATE</p>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
                                    Active from {new Date(ad.startDate).toLocaleDateString()} to {new Date(ad.endDate).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
