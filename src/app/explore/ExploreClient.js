'use client';
import { useState, useEffect } from 'react';
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

export default function ExploreClient() {
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
    }, [initialType, initialSearch, initialCategory, initialCity, initialServices.join(',')]);

    useEffect(() => {
        fetchListings();
        if (hydrated) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

    const toggleMobileFilters = () => setShowMobileFilters(!showMobileFilters);

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    if (!hydrated) return null;

    return (
        <main className="min-h-screen bg-white">
            <div className="sticky top-[57px] z-40 bg-white border-b border-border-light shadow-sm">
                <div className="container-wide space-y-3 py-6">
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
                            <button className="bg-brand text-white p-2 rounded-full" onClick={() => updateURL({ search })}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 lg:gap-10 overflow-x-auto mt-[25px] pb-2 scrollbar-hide relative">
                        <div className="flex items-center gap-6 lg:gap-10 pr-20 lg:pr-0">
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
                        
                        <div className="lg:hidden absolute right-0 top-0 bottom-2 flex items-center bg-gradient-to-l from-white via-white to-transparent pl-10">
                            <button 
                                onClick={toggleMobileFilters}
                                className="bg-bg-light border border-border-light p-2.5 rounded-xl shadow-sm hover:border-text-primary transition-all flex items-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                                <span className="text-[13px] font-bold">Filters</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-wide py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="hidden lg:block space-y-10">
                        {availableCities.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">City</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setCityFilter(''); setSearch(''); updateURL({ city: '', search: '' }); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${cityFilter === '' ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light hover:border-text-primary'}`}
                                    >
                                        All
                                    </button>
                                    {availableCities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => { setCityFilter(city); setSearch(''); updateURL({ city, search: '' }); }}
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

                    <div className="lg:col-span-3 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-bold text-text-secondary">
                                {loading ? 'Searching...' : `${listings.length} places found`}
                            </h2>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[4/3] rounded-2xl bg-bg-light animate-pulse" />
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
                                            <h3 className="font-bold text-text-primary line-clamp-1">{listing.title}</h3>
                                            <p className="text-xs text-text-secondary line-clamp-2">
                                                {listing.city} · {stripHtml(listing.description).substring(0, 100)}...
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {listings.length === 0 && !loading && (
                            <div className="text-center py-20 bg-bg-light rounded-3xl">
                                <p className="text-text-secondary font-medium italic">No places found matching your criteria.</p>
                                <button 
                                    onClick={() => { setFilter(''); setCityFilter(''); setSearch(''); setCategoryFilter(''); setServiceFilters([]); updateURL({ type: '', city: '', search: '', category: '', services: [] }); }}
                                    className="mt-4 text-brand font-bold underline underline-offset-4"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showMobileFilters && (
                <div className="fixed inset-0 z-[100] bg-white overflow-y-auto lg:hidden">
                    <div className="sticky top-0 bg-white border-b border-border-light p-5 flex items-center justify-between z-10">
                        <h2 className="text-xl font-bold">Filters</h2>
                        <button onClick={toggleMobileFilters} className="p-2 bg-bg-light rounded-full text-2xl leading-none">×</button>
                    </div>
                    
                    <div className="p-6 space-y-10 pb-32">
                        {availableCities.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">City</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setCityFilter(''); setSearch(''); updateURL({ city: '', search: '' }); }}
                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${cityFilter === '' ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light'}`}
                                    >
                                        All
                                    </button>
                                    {availableCities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => { setCityFilter(city); setSearch(''); updateURL({ city, search: '' }); }}
                                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${cityFilter === city ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light'}`}
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
                                 <div className="grid grid-cols-2 gap-4">
                                     {availableServices.map(service => (
                                         <label key={service} className="flex items-center gap-3">
                                             <input
                                                 type="checkbox"
                                                 checked={serviceFilters.includes(service)}
                                                 onChange={() => toggleServiceFilter(service)}
                                                 className="w-5 h-5 rounded border-border-light text-brand focus:ring-brand"
                                             />
                                             <span className="text-sm font-medium text-text-secondary">
                                                 {service}
                                             </span>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                        )}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light p-6">
                        <button 
                            onClick={toggleMobileFilters}
                            className="w-full bg-brand text-white py-4 rounded-xl text-base font-bold shadow-lg active:scale-95 transition-transform"
                        >
                            Show {listings.length} Results
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
