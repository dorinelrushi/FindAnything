'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { favorites } = useFavorites();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        <header
            className={`sticky top-0 z-[100] w-full transition-all duration-300 ${isScrolled ? 'bg-white shadow-soft py-3' : 'bg-white/80 backdrop-blur-md py-4'
                } border-b border-border-light`}
        >
            <div className="container-wide flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        T
                    </div>
                    <span className="text-[18px] tracking-tight text-brand group-hover:text-brand-hover transition-colors">
                        TryToFindEverything
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className={`text-sm font-semibold hover:text-brand transition-colors ${pathname === '/' ? 'text-brand' : 'text-text-primary'}`}>Home</Link>
                    <Link href="/explore" className={`text-sm font-semibold hover:text-brand transition-colors ${pathname === '/explore' ? 'text-brand' : 'text-text-primary'}`}>Explore</Link>
                    <Link href="/suggestions" className={`text-sm font-semibold hover:text-brand transition-colors ${pathname === '/suggestions' ? 'text-brand' : 'text-text-primary'}`}>Suggestions</Link>
                    <Link href="/blog" className={`text-sm font-semibold hover:text-brand transition-colors ${pathname === '/blog' ? 'text-brand' : 'text-text-primary'}`}>Blog</Link>

                    <div className="flex items-center gap-6 pl-4 border-l border-border-light">
                        {/* Favorites Icon */}
                        <Link href="/favorites" className="relative group p-2 hover:bg-bg-light rounded-full transition-colors" title="My Favorites">
                            <svg
                                width="24" height="20" viewBox="0 0 24 24"
                                fill={pathname === '/favorites' ? "#FF385C" : "none"}
                                stroke={pathname === '/favorites' ? "#FF385C" : "currentColor"}
                                strokeWidth="2"
                                className="group-hover:scale-110 transition-transform"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm border border-white">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="relative text-sm font-semibold hover:text-brand transition-colors">
                                        Admin
                                        {pendingCount > 0 && (
                                            <span className="absolute -top-2 -right-3 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </Link>
                                )}
                                {(user.role === 'business' || user.role === 'admin') && (
                                    <Link href="/dashboard" className="text-sm font-semibold hover:text-brand transition-colors">Dashboard</Link>
                                )}
                                <Link href="/profile" className="flex items-center gap-2 group">
                                    {user.image ? (
                                        <div className="w-8 h-8 rounded-full border border-border-light overflow-hidden">
                                            <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">
                                            {user.name?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold hover:text-brand transition-colors">Profile</span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="bg-bg-light hover:bg-border-light text-text-primary px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-soft active:scale-95"
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="flex items-center gap-3 md:hidden">
                    <Link href="/favorites" className="relative p-2" onClick={() => setIsMenuOpen(false)}>
                        <svg
                            width="25" height="20" viewBox="0 0 24 24"
                            fill={pathname === '/favorites' ? "#FF385C" : "none"}
                            stroke={pathname === '/favorites' ? "#FF385C" : "currentColor"}
                            strokeWidth="2.5"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {favorites.length > 0 && (
                            <span className="absolute -top-1 -right-0 bg-brand text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black">
                                {favorites.length}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-bg-light transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {isMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 top-[65px] z-40 bg-white h-screen md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col p-6 gap-[15px] h-full overflow-y-auto">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-[18px]  flex items-center justify-between border-b pb-4">
                            Home
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </Link>
                        <Link href="/explore" onClick={() => setIsMenuOpen(false)} className="text-[18px]   flex items-center justify-between border-b pb-4">
                            Explore
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </Link>
                        <Link href="/suggestions" onClick={() => setIsMenuOpen(false)} className="text-[18px] flex items-center justify-between border-b pb-4 text-brand">
                            Suggestions
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </Link>
                        <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-[18px] flex items-center justify-between border-b pb-4">
                            Blog
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </Link>

                        {user ? (
                            <div className="mt-4 flex flex-col gap-6">
                                {user.role === 'admin' && (
                                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-[18px] text-brand">Admin Panel</Link>
                                )}
                                {(user.role === 'business' || user.role === 'admin') && (
                                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-[18px]">Dashboard</Link>
                                )}
                                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-[18px] flex items-center justify-between border-b pb-4">
                                    My Profile
                                    {user.image ? (
                                        <img src={user.image} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                    )}
                                </Link>
                                <div className="pt-6 border-t font-medium">
                                    <p className="text-sm text-text-secondary mb-4">Logged in as {user.email}</p>
                                    <button
                                        onClick={() => { logout(); setIsMenuOpen(false); }}
                                        className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-airbnb"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-airbnb"
                                >
                                    Log in
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </header >
    );
}
