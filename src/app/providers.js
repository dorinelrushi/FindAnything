'use client';

import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

export function Providers({ children }) {
    return (
        <AuthProvider>
            <FavoritesProvider>
                {children}
            </FavoritesProvider>
        </AuthProvider>
    );
}
