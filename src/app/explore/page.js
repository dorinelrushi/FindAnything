'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
    { id: '', label: 'All', emoji: '🌟' },
    { id: 'city', label: 'City', emoji: '🏘️' },
    { id: 'hotel', label: 'Hotels', emoji: '🏨' },
    { id: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
    { id: 'bar', label: 'Bars', emoji: '🍸' },
    { id: 'bujtina', label: 'Guesthouses', emoji: '🏡' },
    { id: 'tour', label: 'Tours', emoji: '🏔️' },
    { id: 'rentcar', label: 'Car Rentals', emoji: '🚗' },
];

function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialType = searchParams.get('type') || '';
    const initialSearch = searchParams.get('search') || '';
    const initialCategory = searchParams.get('category') || '';
    const initialCity = searchParams.get('city') || '';
    const initialServices = searchParams.get('services') ? searchParams.get('services').split(',') : [];

    const [listings, setListings] = useState([]);
    const [filter, setFilter] = useState(initialType);
    const [search, setSearch] = useState(initialSearch);
    const [categoryFilter, setCategoryFilter] = useState(initialCategory);
    const [cityFilter, setCityFilter] = useState(initialCity);
    const [serviceFilters, setServiceFilters] = useState(initialServices);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Dynamic filters
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        setFilter(initialType);
        setSearch(initialSearch);
        setCategoryFilter(initialCategory);
        setCityFilter(initialCity);
        setServiceFilters(initialServices);
    }, [initialType, initialSearch, initialCategory, initialCity]);

    useEffect(() => {
        fetchListings();
    }, [filter, search, categoryFilter, cityFilter, serviceFilters]);

    const fetchListings = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter) params.append('type', filter);
        if (search) params.append('search', search);
        if (categoryFilter) params.append('category', categoryFilter);
        if (cityFilter) params.append('city', cityFilter);
        if (serviceFilters.length > 0) params.append('services', serviceFilters.join(','));

        try {
            const res = await fetch(`/api/listings?${params.toString()}`);
            const data = await res.json();
            const fetchedListings = data.listings || [];
            setListings(fetchedListings);

            const cats = new Set();
            const servs = new Set();
            fetchedListings.forEach(listing => {
                if (listing.category) cats.add(listing.category);
                if (listing.services) listing.services.forEach(s => servs.add(s));
            });
            setAvailableCategories(Array.from(cats).sort());
            setAvailableServices(Array.from(servs).sort());
            if (data.allCities) setAvailableCities(data.allCities.sort());
        } catch (error) {
            console.error('Failed to fetch listings', error);
        }
        setLoading(false);
    };

    const updateURL = (updates) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                params.set(key, Array.isArray(value) ? value.join(',') : value);
            } else {
                params.delete(key);
            }
        });
        router.push(`/explore?${params.toString()}`);
    };

    const handleFilterChange = (newType) => {
        setFilter(newType);
        setCategoryFilter('');
        setServiceFilters([]);
        updateURL({ type: newType, category: '', services: [], city: newType === 'city' ? '' : cityFilter });
    };

    const toggleServiceFilter = (service) => {
        const newServices = serviceFilters.includes(service)
            ? serviceFilters.filter(s => s !== service)
            : [...serviceFilters, service];
        setServiceFilters(newServices);
        updateURL({ services: newServices });
    };

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    if (!hydrated) return null;

    return (
        <main className="min-h-screen bg-white">
            {/* 1. Top Integrated Search & Category Bar */}
            <div className="sticky top-[57px] z-40 bg-white border-b border-border-light shadow-sm">
                <div className="container-wide space-y-3 py-6">
                    {/* Search Pill */}
                    <div className="max-w-xl mx-auto md:mx-0">
                        <div className="search-pill bg-bg-light border border-border-light">
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-text-primary"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && updateURL({ search })}
                            />
                            <button className="bg-brand text-white p-2 rounded-full">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </button>
                        </div>
                    </div>

                    {/* Category Scroll */}
                    <div className="flex items-center gap-6 md:gap-10 overflow-x-auto mt-[25px] pb-2 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleFilterChange(cat.id)}
                                className={`flex flex-col items-center gap-1.5 min-w-fit pb-2 transition-all border-b-2 hover:opacity-100 ${filter === cat.id
                                    ? 'border-text-primary text-text-primary opacity-100'
                                    : 'border-transparent text-text-secondary opacity-60 hover:border-border-light'
                                    }`}
                            >
                                <span className="text-xl md:text-2xl">{cat.emoji}</span>
                                <span className="text-[10px] md:text-xs font-bold whitespace-nowrap uppercase tracking-wider">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container-wide py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* 2. Desktop Filters Sidebar */}
                    <aside className="hidden lg:block space-y-10">
                        {availableCities.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">City</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setCityFilter(''); updateURL({ city: '' }); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${cityFilter === '' ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light hover:border-text-primary'}`}
                                    >
                                        All
                                    </button>
                                    {availableCities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => { setCityFilter(city); updateURL({ city }); }}
                                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${cityFilter === city ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light hover:border-text-primary'}`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableServices.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Amenities</h3>
                                <div className="space-y-3">
                                    {availableServices.map(service => (
                                        <label key={service} className="flex items-center gap-3 group cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={serviceFilters.includes(service)}
                                                onChange={() => toggleServiceFilter(service)}
                                                className="w-5 h-5 rounded border-border-light text-brand focus:ring-brand"
                                            />
                                            <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                                {service}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* 3. Main Results List */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-bold text-text-secondary">
                                {loading ? 'Searching...' : `${listings.length} places found`}
                            </h2>
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden flex items-center gap-2 border border-border-light px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                                Filters
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[4/3] rounded-2xl bg-bg-light animate-pulse" />
                                ))}
                            </div>
                        ) : filter === 'city' && !cityFilter ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {availableCities.map((city, idx) => (
                                    <button
                                        key={city}
                                        onClick={() => {
                                            setCityFilter(city);
                                            setFilter('');
                                            updateURL({ city, type: '' });
                                        }}
                                        className="group relative aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-bg-light border border-border-light shadow-xl hover:shadow-2xl transition-all duration-500 text-left active:scale-[0.97]"
                                    >
                                        {/* Dynamic Gradient Background based on index for variety */}
                                        <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${idx % 3 === 0 ? 'from-brand via-rose-400 to-orange-300' :
                                            idx % 3 === 1 ? 'from-blue-500 via-indigo-400 to-purple-300' :
                                                'from-emerald-500 via-teal-400 to-cyan-300'
                                            }`} />

                                        {/* Mesh-like subtle background patterns */}
                                        <div className="absolute inset-x-0 top-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:via-black/40" />

                                        {/* Content Container with Glassmorphism */}
                                        <div className="absolute bottom-6 left-6 right-6 z-20 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-white/70 text-[11px] font-black uppercase tracking-[0.3em] mb-2 block animate-pulse">Explore</span>
                                                    <h3 className="text-white font-black text-3xl tracking-tight leading-none">{city}</h3>
                                                    <p className="text-white/60 text-xs font-bold mt-2">Discover popular spots here</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg transform transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shine effect on hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                                {listings.map(listing => (
                                    <Link
                                        href={`/${listing.type}/${listing.slug || listing._id}`}
                                        key={listing._id}
                                        className="group space-y-3"
                                    >
                                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-bg-light relative">
                                            <img
                                                src={listing.image || 'https://via.placeholder.com/400x300'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
                                                {listing.type}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-text-primary line-clamp-1">{listing.title}</h3>
                                                <div className="flex items-center gap-1 text-xs font-bold">★ 4.9</div>
                                            </div>
                                            <p className="text-xs text-text-secondary line-clamp-2">
                                                {listing.city} · {stripHtml(listing.description).substring(0, 100)}...
                                            </p>
                                            <div className="pt-1">
                                                <span className="font-bold text-text-primary text-sm">
                                                    {listing.price ? (typeof listing.price === 'string' && (listing.price.includes('€') || listing.price.includes('Lek') || listing.price.includes('$')) ? listing.price : `€${listing.price}`) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {!loading && listings.length === 0 && (
                            <div className="text-center py-32 space-y-4">
                                <div className="text-6xl">🔍</div>
                                <h3 className="text-xl font-bold">No results found</h3>
                                <p className="text-text-secondary">Try changing your filters or search.</p>
                                <button
                                    onClick={() => handleFilterChange('')}
                                    className="text-brand font-bold underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Mobile Filters Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between p-4 border-b">
                        <button onClick={() => setShowMobileFilters(false)} className="text-2xl font-light">×</button>
                        <span className="font-bold">Filters</span>
                        <button onClick={() => { setServiceFilters([]); setCityFilter(''); setShowMobileFilters(false); }} className="text-xs font-bold underline">Clear</button>
                    </div>
                    <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-140px)]">
                        <section className="space-y-4">
                            <h3 className="font-bold">City</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableCities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => { setCityFilter(city); updateURL({ city }); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border ${cityFilter === city ? 'bg-text-primary text-white' : 'border-border-light'}`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className="font-bold">Amenities</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {availableServices.map(service => (
                                    <label key={service} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={serviceFilters.includes(service)}
                                            onChange={() => toggleServiceFilter(service)}
                                            className="w-5 h-5 rounded border-border-light text-brand"
                                        />
                                        <span className="text-sm">{service}</span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-white">
                        <button
                            onClick={() => setShowMobileFilters(false)}
                            className="w-full bg-text-primary text-white py-4 rounded-xl font-bold"
                        >
                            Show {listings.length} results
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="container-wide py-20 text-center font-bold">Loading...</div>}>
            <ExploreContent />
        </Suspense>
    );
}
