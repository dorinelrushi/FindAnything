'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DailyReminder() {
    const { user, loading: authLoading } = useAuth();
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationAllowed, setLocationAllowed] = useState(false);
    const [detectedCity, setCityName] = useState(null);

    useEffect(() => {
        if (user && (user.role === 'person' || !user.role)) {
            const savedCity = localStorage.getItem('preferredCity');
            if (savedCity) {
                fetchDailySuggestion(savedCity);
            } else {
                checkLocationAndFetch();
            }
        }
    }, [user]);

    if (authLoading || !user) return null;
    if (user.role === 'business' || user.role === 'admin') return null;

    const checkLocationAndFetch = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocationAllowed(true);
                    
                    try {
                        // Reverse geocoding using OSM Nominatim
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        const geoData = await geoRes.json();
                        const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county;
                        
                        fetchDailySuggestion(city);
                    } catch (error) {
                        console.error("Geocoding failed", error);
                        fetchDailySuggestion(null);
                    }
                },
                () => {
                    fetchDailySuggestion(null);
                }
            );
        } else {
            fetchDailySuggestion(null);
        }
    };

    const fetchDailySuggestion = async (cityName) => {
        setLoading(true);
        try {
            let pool = [];
            let normalizedCity = cityName;

            // Normalize city name logic
            const allRes = await fetch('/api/listings?limit=1').then(res => res.json());
            if (allRes.allCities && cityName) {
                const norm = cityName.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').trim();
                const match = allRes.allCities.find(c => {
                    const listC = c.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').trim();
                    return listC === norm;
                });
                if (match) normalizedCity = match;
            }
            
            // 1. Try to fetch listings for the specific city first
            if (normalizedCity) {
                const cityRes = await fetch(`/api/listings?limit=50&city=${encodeURIComponent(normalizedCity)}&sort=views`);
                const cityData = await cityRes.json();
                if (cityData.listings && cityData.listings.length > 0) {
                    pool = cityData.listings;
                    setCityName(normalizedCity);
                }
            }

            // 2. If no city listings found or no city detected, fallback to global popular listings
            if (pool.length === 0) {
                const globalRes = await fetch('/api/listings?limit=100&sort=views');
                const globalData = await globalRes.json();
                if (globalData.listings && globalData.listings.length > 0) {
                    pool = globalData.listings;
                    setCityName(null);
                }
            }
            
            if (pool.length > 0) {
                // Pick a seed based on the current date to rotate suggestions daily
                const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
                const index = dayOfYear % pool.length;
                setSuggestion(pool[index]);
            }
        } catch (error) {
            console.error("Failed to fetch daily suggestion", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !suggestion) return null;

    return (
        <div className="hidden md:block bg-gradient-to-r from-brand to-rose-500 text-white py-3 px-4 shadow-md">
            <div className="container-wide flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">✨</span>
                    <div className="text-sm md:text-base font-bold">
                        {detectedCity ? `Since you're in ${detectedCity}: ` : "Today's Suggestion: "}
                        <span className="underline decoration-white/50 underline-offset-4">How about spending your day at {suggestion.title}?</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <Link 
                        href="/suggestions"
                        className="text-xs font-bold underline underline-offset-4 hover:text-white/80 transition-colors"
                    >
                        View All Suggestions
                    </Link>
                    <Link 
                        href={`/${suggestion.type}/${suggestion.slug || suggestion._id}`}
                        className="bg-surface text-brand px-6 py-2 rounded-full text-sm font-black hover:bg-bg-light transition-all active:scale-95 shadow-soft whitespace-nowrap"
                    >
                        Let's Go!
                    </Link>
                </div>
            </div>
        </div>
    );
}
