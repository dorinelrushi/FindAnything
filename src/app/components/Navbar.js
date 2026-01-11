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
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <span className="logo">KorcaCity</span>
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
                    background: #1a1a24;
                    border-bottom: 2px solid var(--primary);
                    backdrop-filter: none;
                    margin-bottom: 0;
                    padding: 15px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .logo {
                    color: white;
                    font-weight: bold;
                }
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
                .desktop-only { display: flex; align-items: center; gap: 20px; }

                @media (max-width: 768px) {
                    .desktop-only { display: none; }
                    .mobile-only { display: block; }
                    .nav {
                        padding: 12px 20px;
                    }
                }

                .mobile-menu-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 1001;
                }

                .mobile-menu {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 280px;
                    background: #1a1a24;
                    border-left: 1px solid var(--primary);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease-out;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                }

                .mobile-menu-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .mobile-menu-content {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .mobile-menu-content a {
                    font-size: 1.1rem;
                    color: white;
                    text-decoration: none;
                    padding: 8px 0;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .mobile-menu-content a:hover {
                    color: var(--primary);
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    );
}
