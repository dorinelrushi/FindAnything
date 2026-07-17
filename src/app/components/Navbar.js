'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

function ThemeToggleButton({ className = '' }) {
    const { resolvedTheme, toggleTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full hover:bg-bg-light transition-colors text-text-primary ${className}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}

const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/blog', label: 'Blog' },
    { href: '/budgets', label: 'Budgets' },
    { href: '/suggestions', label: 'Suggestions' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const { favorites } = useFavorites();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const profileRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchPendingCount();
        }
    }, [user]);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    // Close menus on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, [pathname]);

    const fetchPendingCount = async () => {
        try {
            const res = await fetch('/api/admin/registrations');
            const data = await res.json();
            if (data.registrations) {
                setPendingCount(data.registrations.length);
            }
        } catch (error) {
            console.error('Error fetching pending count', error);
        }
    };

    const handleLogout = () => {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        logout();
    };

    if (!mounted) return null;

    const isActive = (href) =>
        href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`);

    const Avatar = ({ size = 'md' }) => {
        const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
        if (user?.image) {
            return (
                <div className={`${sizeClass} rounded-full border border-border-light overflow-hidden flex-shrink-0`}>
                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                </div>
            );
        }
        return (
            <div className={`${sizeClass} rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold flex-shrink-0`}>
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
        );
    };

    const ProfileMenuItems = ({ onItemClick, compact = false }) => (
        <>
            <div className={`px-4 ${compact ? 'py-3' : 'py-3'} border-b border-border-light`}>
                <p className="text-sm font-bold text-text-primary truncate">{user?.name || 'Account'}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
            </div>

            <Link
                href="/profile"
                onClick={onItemClick}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-light transition-colors"
            >
                <span aria-hidden>👤</span> Profile
            </Link>

            {user?.role === 'admin' && (
                <Link
                    href="/admin"
                    onClick={onItemClick}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-light transition-colors"
                >
                    <span className="flex items-center gap-3">
                        <span aria-hidden>⚙️</span> Admin
                    </span>
                    {pendingCount > 0 && (
                        <span className="bg-brand text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-black">
                            {pendingCount}
                        </span>
                    )}
                </Link>
            )}

            {(user?.role === 'business' || user?.role === 'admin') && (
                <Link
                    href="/dashboard"
                    onClick={onItemClick}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-light transition-colors"
                >
                    <span aria-hidden>📊</span> Dashboard
                </Link>
            )}

            <div className="border-t border-border-light mt-1 pt-1">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                    <span aria-hidden>🚪</span> Log out
                </button>
            </div>
        </>
    );

    return (
        <header
            className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
                isScrolled ? 'bg-surface shadow-soft py-3' : 'bg-surface/80 backdrop-blur-md py-4'
            } border-b border-border-light`}
        >
            <div className="container-wide flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group flex-shrink-0" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        T
                    </div>
                    <span className="text-[17px] tracking-tight text-brand group-hover:text-brand-hover transition-colors hidden sm:inline">
                        TryToFindEverything
                    </span>
                </Link>

                {/* Desktop Nav links */}
                <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                                isActive(href)
                                    ? 'text-brand bg-brand/5'
                                    : 'text-text-primary hover:text-brand hover:bg-bg-light'
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop right actions */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <ThemeToggleButton />

                    <Link
                        href="/favorites"
                        className="relative p-2 hover:bg-bg-light rounded-full transition-colors"
                        title="My Favorites"
                    >
                        <svg
                            width="22"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={pathname === '/favorites' ? '#FF385C' : 'none'}
                            stroke={pathname === '/favorites' ? '#FF385C' : 'currentColor'}
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {favorites.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm border border-surface">
                                {favorites.length}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => setIsProfileOpen((v) => !v)}
                                className="flex items-center gap-2 p-1 pr-2 rounded-full border border-border-light hover:shadow-soft hover:border-brand/30 transition-all bg-surface"
                                aria-expanded={isProfileOpen}
                                aria-haspopup="menu"
                                aria-label="Account menu"
                            >
                                <Avatar size="sm" />
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    className={`text-text-secondary transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                                {(user.role === 'admin' && pendingCount > 0) && (
                                    <span className="absolute -top-1 -right-1 bg-brand text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border border-surface">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-56 bg-surface border border-border-light rounded-2xl shadow-airbnb overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                >
                                    <ProfileMenuItems onItemClick={() => setIsProfileOpen(false)} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-soft active:scale-95"
                        >
                            Log in
                        </Link>
                    )}
                </div>

                {/* Mobile right actions */}
                <div className="flex items-center gap-1 md:hidden">
                    <ThemeToggleButton />
                    <Link href="/favorites" className="relative p-2" onClick={() => setIsMenuOpen(false)}>
                        <svg
                            width="22"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={pathname === '/favorites' ? '#FF385C' : 'none'}
                            stroke={pathname === '/favorites' ? '#FF385C' : 'currentColor'}
                            strokeWidth="2.5"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {favorites.length > 0 && (
                            <span className="absolute -top-0.5 -right-0 bg-brand text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black">
                                {favorites.length}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-bg-light transition-colors text-text-primary"
                        aria-label="Toggle menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {isMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 top-[65px] z-40 bg-surface h-[calc(100vh-65px)] md:hidden overflow-y-auto">
                    <div className="flex flex-col p-5 gap-1">
                        {NAV_LINKS.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`px-4 py-3.5 rounded-xl text-[16px] font-semibold flex items-center justify-between ${
                                    isActive(href) ? 'text-brand bg-brand/5' : 'text-text-primary hover:bg-bg-light'
                                }`}
                            >
                                {label}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                setIsMenuOpen(false);
                                window.dispatchEvent(new CustomEvent('open-ask-ai'));
                            }}
                            className="px-4 py-3.5 rounded-xl text-[16px] font-bold text-brand bg-brand/5 hover:bg-brand/10 flex items-center justify-between mt-2 border border-brand/20 transition-all text-left cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <span>✨</span> Ask AI Assistant
                            </span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>

                        <div className="mt-4 pt-4 border-t border-border-light">
                            {user ? (
                                <div className="bg-bg-light rounded-2xl overflow-hidden border border-border-light">
                                    <ProfileMenuItems onItemClick={() => setIsMenuOpen(false)} />
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-airbnb"
                                >
                                    Log in
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
