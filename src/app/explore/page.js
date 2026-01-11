'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const Map = dynamic(() => import('@/app/components/Map'), { ssr: false });

function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialType = searchParams.get('type') || '';
    const initialSearch = searchParams.get('search') || '';
    const initialCategory = searchParams.get('category') || '';
    const initialServices = searchParams.get('services') ? searchParams.get('services').split(',') : [];

    const [listings, setListings] = useState([]);
    const [filter, setFilter] = useState(initialType);
    const [search, setSearch] = useState(initialSearch);
    const [categoryFilter, setCategoryFilter] = useState(initialCategory);
    const [serviceFilters, setServiceFilters] = useState(initialServices);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [distances, setDistances] = useState({});
    const [hydrated, setHydrated] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map' on mobile
    const [showFilters, setShowFilters] = useState(false);

    // Distance Calculator State
    const [calcPointA, setCalcPointA] = useState('My Location');
    const [calcPointB, setCalcPointB] = useState(null); // Selected Listing object
    const [calculatedDist, setCalculatedDist] = useState(null);

    // Get unique categories and services from listings for dynamic filtering
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        setFilter(initialType);
        setSearch(initialSearch);
        setCategoryFilter(initialCategory);
        setServiceFilters(initialServices);
    }, [initialType, initialSearch, initialCategory]);

    useEffect(() => {
        fetchListings();
    }, [filter, search, categoryFilter, serviceFilters]);

    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    let msg = "Unknown error";
                    if (error.code === 1) msg = "Permission denied. Please enable GPS.";
                    else if (error.code === 2) msg = "Position unavailable.";
                    else if (error.code === 3) msg = "Timeout.";
                    console.warn("Geolocation: " + msg);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, [hydrated]);

    useEffect(() => {
        if (userLocation && listings.length > 0) {
            const newDistances = {};
            listings.forEach(listing => {
                if (listing.lat && listing.lng) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, listing.lat, listing.lng);
                    newDistances[listing._id] = dist.toFixed(1);
                }
            });
            setDistances(newDistances);
        }
    }, [userLocation, listings]);

    // Recalculate manual distance when selection changes
    useEffect(() => {
        if (calcPointA === 'My Location' && userLocation && calcPointB) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, calcPointB.lat, calcPointB.lng);
            setCalculatedDist(dist.toFixed(2));
        } else if (calcPointA !== 'My Location' && calcPointA && calcPointB) {
            // If point A is also a listing (advanced feature not yet UI implemented, stick to My Location for now or improve)
            const dist = calculateDistance(calcPointA.lat, calcPointA.lng, calcPointB.lat, calcPointB.lng);
            setCalculatedDist(dist.toFixed(2));
        } else {
            setCalculatedDist(null);
        }
    }, [calcPointA, calcPointB, userLocation]);

    const fetchListings = async () => {
        setLoading(true);
        let url = '/api/listings?';
        if (filter) url += `type=${filter}&`;
        if (search) url += `search=${search}&`;
        if (categoryFilter) url += `category=${categoryFilter}&`;
        if (serviceFilters.length > 0) url += `services=${serviceFilters.join(',')}&`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const fetchedListings = data.listings || [];
            setListings(fetchedListings);

            // Extract unique categories and services
            const cats = new Set();
            const servs = new Set();
            fetchedListings.forEach(listing => {
                if (listing.category) cats.add(listing.category);
                if (listing.services && Array.isArray(listing.services)) {
                    listing.services.forEach(s => servs.add(s));
                }
                // Also extract from hotelData if it exists
                if (listing.hotelData) {
                    if (listing.hotelData.generalServices) listing.hotelData.generalServices.forEach(s => servs.add(s));
                    if (listing.hotelData.additionalServices) listing.hotelData.additionalServices.forEach(s => servs.add(s));
                    if (listing.hotelData.roomAmenities) listing.hotelData.roomAmenities.forEach(s => servs.add(s));
                }
            });
            setAvailableCategories(Array.from(cats).sort());
            setAvailableServices(Array.from(servs).sort());
        } catch (error) {
            console.error('Failed to fetch listings', error);
        }
        setLoading(false);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        updateURL({ type: newFilter, category: '', services: [] }); // Reset category when changing type
        setCategoryFilter('');
        setServiceFilters([]);
    };

    const updateURL = ({ type, category, services }) => {
        const params = new URLSearchParams(searchParams);

        // Update type
        if (type !== undefined) {
            if (type) params.set('type', type);
            else params.delete('type');
        }

        // Update category
        if (category !== undefined) {
            if (category) params.set('category', category);
            else params.delete('category');
        }

        // Update services
        if (services !== undefined) {
            if (services.length > 0) params.set('services', services.join(','));
            else params.delete('services');
        }

        router.push(`/explore?${params.toString()}`);
    };

    const handleCategoryChange = (category) => {
        setCategoryFilter(category);
        updateURL({ category, services: serviceFilters });
    };

    const toggleServiceFilter = (service) => {
        const newServices = serviceFilters.includes(service)
            ? serviceFilters.filter(s => s !== service)
            : [...serviceFilters, service];
        setServiceFilters(newServices);
        updateURL({ category: categoryFilter, services: newServices });
    };

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                },
                (error) => alert('Location permission denied. Please enable GPS in your settings.')
            );
        }
    };

    if (!hydrated) return null; // Avoid hydration mismatch

    return (
        <div className="explore-container">
            {/* View Toggle for Mobile */}
            <div className="view-toggle mobile-only glass">
                <button
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                >
                    List
                </button>
                <button
                    className={viewMode === 'map' ? 'active' : ''}
                    onClick={() => setViewMode('map')}
                >
                    Map
                </button>
            </div>

            {/* Filters Sidebar (Overlay on mobile) */}
            <div className={`sidebar ${showFilters ? 'mobile-visible' : 'mobile-hidden'}`}>
                <div className="sidebar-header">
                    <h2>Explore</h2>
                    <button className="mobile-only close-btn" onClick={() => setShowFilters(false)}>✕</button>
                </div>

                <div className="tool-section">
                    <h4>Type</h4>
                    <div className="filter-options">
                        {['', 'hotel', 'restaurant', 'bar', 'bujtina', 'rentcar'].map(t => (
                            <button
                                key={t}
                                className={`filter-btn ${filter === t ? 'active' : ''}`}
                                onClick={() => { handleFilterChange(t); if (window.innerWidth <= 768) setShowFilters(false); }}
                            >
                                {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {availableCategories.length > 0 && (
                    <div className="tool-section">
                        <h4>Category</h4>
                        <div className="filter-options">
                            <button className={`filter-btn ${categoryFilter === '' ? 'active' : ''}`} onClick={() => handleCategoryChange('')}>All Categories</button>
                            {availableCategories.map(cat => (
                                <button key={cat} className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`} onClick={() => handleCategoryChange(cat)}>{cat}</button>
                            ))}
                        </div>
                    </div>
                )}

                {availableServices.length > 0 && (
                    <div className="tool-section">
                        <h4>Services</h4>
                        <div className="checkbox-group">
                            {availableServices.map(service => (
                                <label key={service} className="checkbox-item">
                                    <input type="checkbox" checked={serviceFilters.includes(service)} onChange={() => toggleServiceFilter(service)} />
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="tool-section">
                    <h4>Distance Tool</h4>
                    <div className="input-group">
                        <label>Start (A)</label>
                        <select className="input" value={calcPointA === 'My Location' ? 'My Location' : calcPointA._id}
                            onChange={(e) => {
                                if (e.target.value === 'My Location') setCalcPointA('My Location');
                                else setCalcPointA(listings.find(l => l._id === e.target.value));
                            }}
                        >
                            <option value="My Location">My Location {userLocation ? '✅' : '(No GPS)'}</option>
                            {listings.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                        </select>
                        {!userLocation && calcPointA === 'My Location' && <button onClick={requestLocation} className="btn-small">📍 Enable GPS</button>}
                    </div>

                    <div className="input-group">
                        <label>End (B)</label>
                        <select className="input" value={calcPointB ? calcPointB._id : ''}
                            onChange={(e) => {
                                setCalcPointB(listings.find(l => l._id === e.target.value));
                                if (window.innerWidth <= 768) {
                                    setViewMode('map');
                                    setShowFilters(false);
                                    // Scroll to map
                                    document.getElementById('mobile-map-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                        >
                            <option value="">Select Destination...</option>
                            {listings.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                        </select>
                    </div>
                    {calculatedDist && <div className="dist-result">Distance: {calculatedDist} km</div>}
                </div>
            </div>

            {/* Middle Section: Search + Results */}
            <div className={`results-area ${viewMode === 'map' ? 'mobile-map-active' : ''}`}>
                <div className="search-header glass">
                    <input type="text" placeholder="Search places..." className="input search-input" value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateURL({ type: filter, category: categoryFilter, services: serviceFilters })}
                    />
                    <button className="mobile-only filter-toggle-btn" onClick={() => setShowFilters(true)}>
                        <span>⚙️</span>
                    </button>
                </div>

                {/* Mobile Map Section (Not full size, beautiful section) */}
                <div id="mobile-map-section" className={`mobile-map-container mobile-only ${viewMode === 'list' ? 'hidden' : ''}`}>
                    <div className="map-card glass">
                        <Map listings={listings} startPoint={(calcPointA === 'My Location' ? userLocation : calcPointA)} endPoint={calcPointB} />
                    </div>
                </div>

                {loading ? <div className="loader">Searching...</div> : (
                    <div className={`listings-list ${viewMode === 'map' ? 'mobile-hidden' : ''}`}>
                        {listings.map(listing => {
                            const stripHtml = (html) => {
                                if (typeof document === 'undefined') return '';
                                const tmp = document.createElement('div');
                                tmp.innerHTML = html;
                                return tmp.textContent || tmp.innerText || '';
                            };
                            return (
                                <div key={listing._id} className="listing-card glass" onClick={() => { setCalcPointB(listing); if (window.innerWidth <= 1024) { setViewMode('map'); document.getElementById('mobile-map-section')?.scrollIntoView({ behavior: 'smooth' }); } }}>
                                    <div className="listing-image" style={{ backgroundImage: `url(${listing.image || 'https://via.placeholder.com/200'})` }}></div>
                                    <div className="listing-info">
                                        <div className="listing-header">
                                            <div className="listing-title-row">
                                                <h3 className="listing-title">{listing.title}</h3>
                                                <div className="listing-meta">
                                                    <span className="badge">{listing.type}</span>
                                                    {listing.category && <span className="badge category-badge">{listing.category}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="description">{stripHtml(listing.description).substring(0, 70)}...</p>

                                        <div className="listing-footer">
                                            <div className="tags">
                                                {(listing.services || []).slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="action-row">
                                                {distances[listing._id] && <span className="distance-badge">🚶 {distances[listing._id]} km</span>}
                                                <Link href={`/${listing.type}/${listing.slug || listing._id}`} className="view-link-btn" onClick={e => e.stopPropagation()}>View Details</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {listings.length === 0 && <p className="no-res">No results found for your search.</p>}
                    </div>
                )}
            </div>

            {/* Desktop Map Area (Right Side) */}
            <div className="desktop-map-area desktop-only">
                <div className="map-glass-container glass">
                    <Map listings={listings} startPoint={(calcPointA === 'My Location' ? userLocation : calcPointA)} endPoint={calcPointB} />
                </div>
            </div>

            <style jsx>{`
                .explore-container {
                    display: grid;
                    grid-template-columns: 260px 420px 1fr;
                    height: calc(100vh - 80px);
                    width: 100%;
                    overflow: hidden;
                    background: #0f0f13;
                    position: relative;
                }
                
                .view-toggle {
                    display: none;
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2000;
                    padding: 8px;
                    border-radius: 50px;
                    gap: 8px;
                    background: rgba(26, 26, 36, 0.9);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }

                .view-toggle button {
                    padding: 10px 25px;
                    border-radius: 40px;
                    border: none;
                    background: transparent;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .view-toggle button.active {
                    background: var(--primary);
                    box-shadow: 0 5px 15px rgba(108, 92, 231, 0.4);
                }

                /* Sidebar */
                .sidebar {
                    height: 100%;
                    overflow-y: auto;
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 35px;
                    background: #0f0f13;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .sidebar::-webkit-scrollbar { width: 4px; }
                .sidebar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }

                .sidebar h2 { font-size: 1.6rem; color: white; margin-bottom: 5px; font-weight: 800; }
                .tool-section h4 { margin-bottom: 18px; color: #888; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }

                .filter-options { display: flex; flex-direction: column; gap: 8px; }
                .filter-btn {
                    padding: 12px 18px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(255,255,255,0.02);
                    color: #999;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                }
                .filter-btn:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(5px); }
                .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

                .checkbox-group { display: flex; flex-direction: column; gap: 15px; }
                .checkbox-item { display: flex; align-items: center; gap: 12px; cursor: pointer; font-size: 0.95rem; color: #999; transition: color 0.2s; }
                .checkbox-item:hover { color: white; }
                .checkbox-item input { width: 18px; height: 18px; accent-color: var(--primary); }

                /* Results Area */
                .results-area {
                    height: 100%;
                    overflow-y: auto;
                    padding: 30px;
                    background: #12121a;
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                .results-area::-webkit-scrollbar { width: 4px; }

                .search-header {
                    padding: 4px 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .search-input { background: transparent; border: none; color: white; width: 100%; padding: 12px 0; font-size: 1.05rem; }
                .search-input:focus { outline: none; }
                .filter-toggle-btn { background: var(--primary); border: none; border-radius: 10px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; cursor: pointer; }

                .listings-list { display: flex; flex-direction: column; gap: 20px; }
                .listing-card {
                    padding: 18px;
                    display: flex;
                    gap: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .listing-card:hover { transform: translateY(-5px) scale(1.01); border-color: var(--primary); background: rgba(255,255,255,0.03); box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
                .listing-image { width: 130px; height: 130px; border-radius: 16px; background-size: cover; background-position: center; flex-shrink: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
                
                .listing-info { flex: 1; display: flex; flex-direction: column; gap: 10px; }
                .listing-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
                .listing-title { font-size: 1.25rem; font-weight: 800; color: white; margin: 0; line-height: 1.2; }
                .listing-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
                .badge { font-size: 0.65rem; padding: 2px 10px; border-radius: 50px; color: white; background: var(--primary); font-weight: 600; text-transform: uppercase; }
                .badge.category-badge { background: #ff4757; }
                
                .action-row { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }
                .view-link-btn { background: var(--primary); color: white; padding: 6px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; text-decoration: none; transition: transform 0.2s; }
                .view-link-btn:hover { transform: scale(1.05); background: white; color: var(--primary); }
                
                .description { font-size: 0.85rem; color: #888; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .listing-footer { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
                .tags { display: flex; gap: 6px; flex-wrap: wrap; }
                .tag { font-size: 0.7rem; color: #aaa; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
                .distance-badge { font-size: 0.85rem; color: #00d2d3; font-weight: 800; display: flex; align-items: center; gap: 5px; }

                /* Map Area */
                .desktop-map-area { padding: 30px; height: 100%; width: 100%; }
                .map-glass-container { height: 100%; width: 100%; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }

                .desktop-only { display: block; }
                .mobile-only { display: none; }

                @media (max-width: 1200px) {
                    .explore-container { grid-template-columns: 240px 1fr; }
                    .listing-image { width: 110px; height: 110px; }
                    .desktop-map-area { display: none; }
                }

                @media (max-width: 1024px) {
                    .explore-container { display: flex; flex-direction: column; height: auto; overflow: visible; background: #0f0f13; }
                    .desktop-only { display: none; }
                    .mobile-only { display: block; }
                    
                    .results-area { padding: 20px; height: auto; background: transparent; width: 100%; }
                    .search-header { position: sticky; top: 15px; z-index: 100; backdrop-filter: blur(20px); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    
                    /* Mobile Map - Beautiful Section */
                    .mobile-map-container { padding: 10px 0 25px 0; width: 100%; height: 420px; transition: all 0.5s ease; }
                    .mobile-map-container.hidden { height: 0; padding: 0; opacity: 0; pointer-events: none; overflow: hidden; }
                    .map-card { height: 100%; width: 100%; border-radius: 25px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 45px rgba(0,0,0,0.4); }

                    .sidebar.mobile-hidden { display: none; }
                    .sidebar.mobile-visible {
                        display: flex;
                        position: fixed;
                        top: 0; left: 0; width: 100%; height: 100%;
                        z-index: 3000;
                        background: #0f0f13;
                        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .close-btn { background: transparent; border: none; color: white; font-size: 2rem; }
                    
                    .listing-card { flex-direction: column; gap: 15px; border-radius: 25px; background: rgba(255,255,255,0.02); overflow: hidden; }
                    .listing-image { width: 100%; height: 220px; border-radius: 20px 20px 0 0; }
                    .listing-title { font-size: 1.5rem; }
                    .listing-footer { flex-direction: column; align-items: flex-start; gap: 10px; }
                    
                    .mobile-hidden { display: none !important; }
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .loader, .no-res { text-align: center; color: #555; padding: 60px; font-size: 1.1rem; }
            `}</style>
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExploreContent />
        </Suspense>
    );
}
