'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing favorites', e);
            }
        }
    }, []);

    const toggleFavorite = (listing) => {
        setFavorites(prev => {
            const exists = prev.find(fav => fav._id === listing._id);
            let next;
            if (exists) {
                next = prev.filter(fav => fav._id !== listing._id);
            } else {
                next = [...prev, listing];
            }
            localStorage.setItem('favorites', JSON.stringify(next));
            return next;
        });
    };

    const isFavorite = (id) => favorites.some(fav => fav._id === id);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
