'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchPendingCount();
        }
    }, [user]);

    const fetchPendingCount = async () => {
        try {
            const res = await fetch('/api/admin/registrations');
            const data = await res.json();
            if (data.registrations) {
                setPendingCount(data.registrations.length);
            }
        } catch (error) {
            console.error("Error fetching pending count", error);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <nav className="glass nav">
                <Link href="/" className="logo" onClick={() => setIsMenuOpen(false)}>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>KorcaCity</h1>
                </Link>

                <div className="nav-links desktop-only">
                    <Link href="/">Home</Link>
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <Link href="/admin" style={{ position: 'relative' }}>
                                    Admin
                                    {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
                                </Link>
                            )}
                            {(user.role === 'business' || user.role === 'admin') && (
                                <Link href="/dashboard">Dashboard</Link>
                            )}
                            <button onClick={logout} className="btn" style={{ padding: '8px 16px' }}>Logout</button>
                        </>
                    ) : (
                        <Link href="/login" className="btn">Login</Link>
                    )}
                </div>

                <div className="mobile-only">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="btn"
                        style={{ padding: '10px', background: 'transparent', fontSize: '1.5rem' }}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            {isMenuOpen && (
                <div className="mobile-menu glass" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
                                )}
                                {(user.role === 'business' || user.role === 'admin') && (
                                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                                )}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 0', paddingTop: '10px' }}>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Account: {user.email}</p>
                                    <button onClick={logout} className="btn" style={{ width: '100%', marginTop: '5px' }}>Logout</button>
                                </div>
                            </>
                        ) : (
                            <Link href="/login" className="btn" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge {
                    position: absolute;
                    top: -10px;
                    right: -15px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    fontSize: 0.7rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 10px rgba(255, 71, 87, 0.5);
                }
                .mobile-only { display: none; }
                .desktop-only { display: flex; align-items: center; gap: 15px; }

                @media (max-width: 768px) {
                    .desktop-only { display: none; }
                    .mobile-only { display: block; }
                }

                .mobile-menu {
                    position: fixed;
                    top: 80px;
                    left: 15px;
                    right: 15px;
                    z-index: 1000;
                    padding: 20px;
                    animation: slideDown 0.3s ease-out;
                }

                .mobile-menu-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .mobile-menu-content a {
                    font-size: 1.2rem;
                    color: white;
                    text-decoration: none;
                    padding: 5px 0;
                }

                @keyframes slideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
