'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const pathname = usePathname();

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
            <nav className="nav">
                <Link href="/" className="logo" onClick={() => setIsMenuOpen(false)}>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>TryToFindEverything</h1>
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
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <span className="logo">TryToFindEverything</span>
                            <button onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem' }}>✕</button>
                        </div>
                        <div className="mobile-menu-content">
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
                                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '10px' }}>Account: {user.email}</p>
                                        <button onClick={logout} className="btn" style={{ width: '100%' }}>Logout</button>
                                    </div>
                                </>
                            ) : (
                                <Link href="/login" className="btn" onClick={() => setIsMenuOpen(false)}>Login</Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .nav {
                    background: rgba(15, 15, 20, 0.7);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 18px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .logo h1 {
                    background: linear-gradient(90deg, #fff, #a29bfe);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.5px;
                }
                .nav-links a {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s;
                    position: relative;
                }
                .nav-links a:hover { color: white; }
                .nav-links a::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: var(--primary);
                    transition: width 0.3s;
                }
                .nav-links a:hover::after { width: 100%; }

                .badge {
                    position: absolute;
                    top: -10px;
                    right: -15px;
                    background: var(--accent);
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 0.7rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 10px rgba(253, 121, 168, 0.5);
                }
                .mobile-only { display: none; }
                .desktop-only { display: flex; align-items: center; gap: 30px; }

                @media (max-width: 768px) {
                    .desktop-only { display: none; }
                    .mobile-only { display: block; }
                    .nav { padding: 15px 25px; }
                }

                .mobile-menu-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(10px);
                    z-index: 2000;
                    animation: fadeIn 0.3s ease;
                }

                .mobile-menu {
                    position: fixed;
                    top: 0; right: 0; bottom: 0;
                    width: 85%;
                    max-width: 350px;
                    background: #0f0f13;
                    border-left: 1px solid rgba(255,255,255,0.1);
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .mobile-menu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 50px;
                }

                .mobile-menu-content {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .mobile-menu-content a {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
        </>
    );
}
