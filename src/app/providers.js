'use client';

import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <FavoritesProvider>
                    {children}
                </FavoritesProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
