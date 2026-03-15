'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SuggestionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [listings, setListings] = useState([]);
    const [cityListings, setCityListings] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detectedCity, setCityName] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        // Load manually selected city if any
        const savedCity = localStorage.getItem('preferredCity');
        if (savedCity) {
            setSelectedCity(savedCity);
        }

        if (user && (user.role === 'person' || !user.role)) {
            // Check if we already have permission or should ask
            if ("geolocation" in navigator) {
                // If we have a saved city, don't auto-ask for GPS to prioritize favorite
                if (!savedCity) {
                    requestLocation();
                } else {
                    fetchPopularListings(savedCity);
                }
            } else {
                fetchPopularListings(savedCity || null);
            }
        }
    }, [user]);

    if (authLoading) return <div className="container-wide py-20 text-center font-bold text-text-secondary">Loading...</div>;

    if (!user || user.role === 'business' || user.role === 'admin') {
        return (
            <div className="container-wide py-20 text-center space-y-6">
                <div className="text-6xl">🔒</div>
                <h1 className="text-3xl font-black">Suggestions are for Explorers</h1>
                <p className="text-text-secondary max-w-md mx-auto">
                    Please log in as a visitor to see daily recommendations on how to spend your day.
                </p>
                <Link href="/login" className="inline-block bg-brand text-white px-8 py-3 rounded-xl font-bold shadow-soft">
                    Log In to Explore
                </Link>
            </div>
        );
    }

    const requestLocation = () => {
        setLocationStatus('loading');
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError("Your browser doesn't support location services.");
            fetchPopularListings(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocationStatus('success');
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const geoData = await geoRes.json();
                    const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county;
                    setCityName(city);
                    fetchPopularListings(city);
                } catch (error) {
                    console.error("Geocoding failed", error);
                    fetchPopularListings(null);
                }
            },
            (error) => {
                let msg = "Could not get your location.";
                if (error.code === 1) msg = "Location permission denied. Please allow access in settings.";
                else if (error.code === 2) msg = "Location position unavailable.";
                else if (error.code === 3) msg = "Locating timed out.";
                
                // Detection if on HTTP
                if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                    msg = "Geolocation requires a secure connection (HTTPS).";
                }

                setLocationStatus('error');
                setLocationError(msg);
                console.log("Location error:", error.message);
                
                const savedCity = localStorage.getItem('preferredCity');
                fetchPopularListings(savedCity || null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        if (city) {
            localStorage.setItem('preferredCity', city);
        } else {
            localStorage.removeItem('preferredCity');
        }
        fetchPopularListings(city || detectedCity);
    };

    const normalizeCityName = (city, cityList) => {
        if (!city || !cityList.length) return city;
        
        // Accurate matching for common cases like Korçë -> Korce
        const normalized = city.toLowerCase()
            .replace(/ë/g, 'e')
            .replace(/ç/g, 'c')
            .trim();

        // Search in available cities for a match
        const match = cityList.find(c => {
            const listC = c.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').trim();
            return listC === normalized;
        });

        return match || city;
    };

    const fetchPopularListings = async (cityName) => {
        setLoading(true);
        try {
            // First get all cities if we don't have them yet
            let currentAvailableCities = availableCities;
            if (currentAvailableCities.length === 0) {
                const res = await fetch('/api/listings?limit=1').then(res => res.json());
                if (res.allCities) {
                    currentAvailableCities = res.allCities;
                    setAvailableCities(res.allCities);
                }
            }

            // Normalize the city name based on what's available in DB
            const finalCityName = cityName ? normalizeCityName(cityName, currentAvailableCities) : null;
            if (cityName && finalCityName !== cityName) {
                setCityName(finalCityName);
            }

            const promises = [
                fetch('/api/listings?limit=100&sort=views').then(res => res.json())
            ];

            if (finalCityName) {
                promises.push(fetch(`/api/listings?limit=50&city=${encodeURIComponent(finalCityName)}&sort=views`).then(res => res.json()));
            }

            const results = await Promise.all(promises);
            
            setListings(results[0].listings || []);
            setCityListings(results[1] ? (results[1].listings || []) : []);
            
            if (results[0].allCities) {
                setAvailableCities(results[0].allCities);
            }
        } catch (error) {
            console.error("Failed to fetch popular listings", error);
        } finally {
            setLoading(false);
        }
    };

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    if (loading) return <div className="container-wide py-20 text-center font-bold text-text-secondary">Loading suggestions...</div>;

    return (
        <main className="container-wide py-12 space-y-16">
            <section className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand bg-brand/10 px-4 py-2 rounded-full">Explore the Best</span>
                <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tight leading-tight">
                    How to Spend <span className="text-brand">Today</span>
                </h1>
                
                {/* Location Controls */}
                <div className="flex flex-col items-center gap-6 mt-10">
                    {locationStatus !== 'success' && (
                        <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl space-y-4 max-w-sm w-full shadow-lg transition-all">
                            <p className="font-bold text-text-primary">Enable Location for {detectedCity || 'Local'} Results</p>
                            <p className="text-sm text-text-secondary">Explore the best restaurants, hotels, and activities in your current city.</p>
                            
                            {locationError && (
                                <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">
                                    ⚠️ {locationError}
                                </p>
                            )}

                            <button 
                                onClick={requestLocation}
                                disabled={locationStatus === 'loading'}
                                className="w-full bg-brand text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {locationStatus === 'loading' ? '📍 Locating...' : '📍 Use My Location'}
                            </button>
                        </div>
                    )}

                    {locationStatus === 'error' && (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Or Select Destination</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {availableCities.map(city => (
                                    <button 
                                        key={city}
                                        onClick={() => handleCitySelect(city)}
                                        className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${selectedCity === city ? 'bg-brand text-white border-brand' : 'bg-white text-text-primary border-border-light hover:border-brand'}`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {locationStatus === 'success' && (
                        <div className="flex items-center gap-3 bg-green-50 text-green-700 px-6 py-2 rounded-full font-bold border border-green-100 shadow-sm animate-in zoom-in-95 duration-300">
                            <span className="text-lg">✅</span> 
                            {detectedCity || 'Location Detected'}
                        </div>
                    )}
                </div>

                <p className="text-lg text-text-secondary font-medium px-4 mt-8">
                    {locationStatus === 'success' && (cityListings.length > 0)
                        ? `We found ${cityListings.length} amazing places in ${detectedCity}.` 
                        : "Discover the best places to visit, eat, and stay."}
                </p>
            </section>

            {(cityListings.length > 0 || (listings.length > 0 && !detectedCity && !selectedCity)) ? (
                <section className="bg-gradient-to-br from-brand/5 to-rose-500/5 p-8 md:p-12 rounded-[2rem] border border-brand/10 space-y-8">
                    <div className="flex items-center justify-between border-b border-brand/10 pb-4">
                        <h2 className="text-2xl font-black text-text-primary flex items-center gap-3">
                            <span className="text-3xl">🎯</span>
                            {selectedCity || detectedCity ? `Popular in ${selectedCity || detectedCity}` : `Top Rated in Albania`}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        {(selectedCity || detectedCity ? cityListings : listings).slice(0, 20).map((listing) => (
                            <Link 
                                key={listing._id} 
                                href={`/${listing.type}/${listing.slug || listing._id}`}
                                className="group space-y-4 cursor-pointer bg-white p-4 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-brand/5 hover:border-brand/20 flex flex-col h-full"
                            >
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-bg-light relative">
                                    <img 
                                        src={listing.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                                        alt={listing.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase text-brand shadow-sm">
                                        {listing.type}
                                    </div>
                                </div>
                                
                                <div className="space-y-2 flex-grow">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-black text-text-primary group-hover:text-brand transition-colors text-lg line-clamp-1">{listing.title}</h3>
                                    </div>
                                    <p className="text-text-secondary text-xs flex items-center gap-1 font-bold">
                                        📍 {listing.city}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="w-full bg-bg-light group-hover:bg-brand group-hover:text-white py-3 rounded-xl text-center text-sm font-black transition-all">
                                        View Details
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="bg-gradient-to-br from-brand/5 to-rose-500/5 p-8 md:p-12 rounded-[2rem] border border-brand/10 text-center space-y-4">
                    <div className="text-4xl">🔎</div>
                    <h2 className="text-xl font-bold text-text-primary">No local suggestions found yet</h2>
                    <p className="text-text-secondary">Try selecting a different city or browse all listings below.</p>
                </section>
            )}

            <section className="bg-bg-light p-10 md:p-20 rounded-[3rem] text-center space-y-8 border border-border-light">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-3xl font-black text-text-primary">Can't decide where to go?</h2>
                <p className="text-text-secondary max-w-xl mx-auto text-lg leading-relaxed">
                    Our community helps you find the hidden gems and popular spots. Keep exploring, keep discovering!
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                    <Link href="/explore" className="bg-text-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg">
                        Browse Everything
                    </Link>
                    <Link href="/favorites" className="bg-white border border-border-light text-text-primary px-10 py-4 rounded-2xl font-bold hover:bg-bg-light transition-all active:scale-95">
                        My Saved List
                    </Link>
                </div>
            </section>
        </main>
    );
}
