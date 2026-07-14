'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
});

function getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(resolved) {
    const root = document.documentElement;
    if (resolved === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('light');
    const [resolvedTheme, setResolvedTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        // stored: 'light' | 'dark' | 'system' | null
        const initial = stored === 'light' || stored === 'dark' || stored === 'system'
            ? stored
            : 'system';
        const resolved = initial === 'system' ? getSystemTheme() : initial;
        setThemeState(initial);
        setResolvedTheme(resolved);
        applyThemeClass(resolved);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            if (theme === 'system') {
                const resolved = getSystemTheme();
                setResolvedTheme(resolved);
                applyThemeClass(resolved);
            }
        };

        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [theme, mounted]);

    const setTheme = useCallback((next) => {
        const value = next === 'dark' || next === 'light' || next === 'system' ? next : 'system';
        localStorage.setItem('theme', value);
        setThemeState(value);
        const resolved = value === 'system' ? getSystemTheme() : value;
        setResolvedTheme(resolved);
        applyThemeClass(resolved);
    }, []);

    const toggleTheme = useCallback(() => {
        // Simple light ↔ dark toggle (persists explicit choice)
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }, [resolvedTheme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
