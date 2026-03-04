'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Map component removed per user request

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
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // Added viewMode state

    // Get unique categories and services from listings for dynamic filtering
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
        let url = '/api/listings?';
        if (filter) url += `type=${filter}&`;
        if (search) url += `search=${search}&`;
        if (categoryFilter) url += `category=${categoryFilter}&`;
        if (cityFilter) url += `city=${cityFilter}&`;
        if (serviceFilters.length > 0) url += `services=${serviceFilters.join(',')}&`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const fetchedListings = data.listings || [];
            setListings(fetchedListings);

            // Extract unique categories and services from the visible listings
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

            // Set cities from the global backend list, ignoring client filters so users can always see all cities
            if (data.allCities) {
                setAvailableCities(data.allCities.sort());
            }
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
        updateURL({ type: newFilter, category: '', services: [], city: cityFilter }); // Reset category when changing type
        setCategoryFilter('');
        setServiceFilters([]);
    };

    const updateURL = ({ type, category, services, city }) => {
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

        // Update city
        if (city !== undefined) {
            if (city) params.set('city', city);
            else params.delete('city');
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
        updateURL({ category, services: serviceFilters, city: cityFilter });
    };

    const handleCityChange = (city) => {
        setCityFilter(city);
        updateURL({ city, category: categoryFilter, services: serviceFilters, type: filter });
    };

    const toggleServiceFilter = (service) => {
        const newServices = serviceFilters.includes(service)
            ? serviceFilters.filter(s => s !== service)
            : [...serviceFilters, service];
        setServiceFilters(newServices);
        updateURL({ category: categoryFilter, services: newServices, city: cityFilter });
    };



    if (!hydrated) return null; // Avoid hydration mismatch

    return (
        <div className="explore-page">
            <div className="explore-container">
                {/* Filters Sidebar */}
                <div className={`sidebar glass ${showFilters ? 'mobile-visible' : 'mobile-hidden'}`}>
                    <div className="sidebar-header">
                        <h2>Filters</h2>
                        <button className="mobile-only close-btn" onClick={() => setShowFilters(false)}>✕</button>
                    </div>

                    <div className="filter-scroll">
                        <div className="tool-section">
                            <h4 className="section-label">Business Type</h4>
                            <div className="filter-options">
                                {['', 'city', 'hotel', 'restaurant', 'bar', 'bujtina', 'tour', 'rentcar'].map(t => (
                                    <button
                                        key={t}
                                        className={`filter-btn ${filter === t ? 'active' : ''}`}
                                        onClick={() => { handleFilterChange(t); if (window.innerWidth <= 1024) setShowFilters(false); }}
                                    >
                                        <span className="dot"></span>
                                        {t === '' ? 'All Services' : t === 'city' ? 'Cities' : t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {availableCities.length > 0 && (
                            <div className="tool-section">
                                <h4 className="section-label">Cities</h4>
                                <div className="category-scroll">
                                    <button className={`cat-tag ${cityFilter === '' ? 'active' : ''}`} onClick={() => handleCityChange('')}>All Cities</button>
                                    {availableCities.map(city => (
                                        <button key={city} className={`cat-tag ${cityFilter === city ? 'active' : ''}`} onClick={() => handleCityChange(city)}>{city}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableCategories.length > 0 && (
                            <div className="tool-section">
                                <h4 className="section-label">Categories</h4>
                                <div className="category-scroll">
                                    <button className={`cat-tag ${categoryFilter === '' ? 'active' : ''}`} onClick={() => handleCategoryChange('')}>All</button>
                                    {availableCategories.map(cat => (
                                        <button key={cat} className={`cat-tag ${categoryFilter === cat ? 'active' : ''}`} onClick={() => handleCategoryChange(cat)}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableServices.length > 0 && (
                            <div className="tool-section">
                                <h4 className="section-label">Amenities</h4>
                                <div className="checkbox-group">
                                    {availableServices.map(service => (
                                        <label key={service} className="checkbox-item">
                                            <input type="checkbox" checked={serviceFilters.includes(service)} onChange={() => toggleServiceFilter(service)} />
                                            <span className="checkmark"></span>
                                            <span className="service-name">{service}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Results Area */}
                <div className="results-wrapper">
                    <div className="top-search-bar glass">
                        <div className="search-input-group">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Where would you like to go?"
                                className="main-search-input"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && updateURL({ type: filter, category: categoryFilter, services: serviceFilters, city: cityFilter })}
                            />
                        </div>
                        <button className="mobile-only filter-trigger" onClick={() => setShowFilters(true)}>
                            <span>Filters</span>
                            <span className="filter-count">{serviceFilters.length + (filter ? 1 : 0) + (categoryFilter ? 1 : 0) + (cityFilter ? 1 : 0)}</span>
                        </button>
                    </div>

                    <div className="results-content">
                        <div className="results-header">
                            <h2 className="results-title">
                                {loading ? 'Searching...' : filter === 'city' ? `${availableCities.length} cities available` : `${listings.length} places found`}
                            </h2>
                            {filter !== 'city' && (
                                <div className="sort-placeholder">
                                    <span>Sorted by: <b>Relevance</b></span>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="pulse-loader"></div>
                                <p>Discovering the world...</p>
                            </div>
                        ) : (
                            <div className="listings-grid">
                                {listings.map(listing => {
                                    const stripHtml = (html) => {
                                        if (typeof document === 'undefined') return '';
                                        const tmp = document.createElement('div');
                                        tmp.innerHTML = html;
                                        return tmp.textContent || tmp.innerText || '';
                                    };
                                    return (
                                        <Link href={`/${listing.type}/${listing.slug || listing._id}`} key={listing._id} className="premium-card glass">
                                            <div className="card-image-box">
                                                <div className="card-img" style={{ backgroundImage: `url(${listing.image || 'https://via.placeholder.com/400x300?text=TryToFindEverything'})` }}></div>
                                                <div className="card-overlay">
                                                    <span className="type-pill">{listing.type}</span>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                <div className="card-title-row">
                                                    <h3 className="card-name">{listing.title}</h3>
                                                    {listing.category && <span className="cat-pill">{listing.category}</span>}
                                                </div>
                                                <p className="card-desc">{stripHtml(listing.description).substring(0, 90)}...</p>

                                                <div className="card-tags">
                                                    {(listing.services || []).slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="service-tag">{tag}</span>
                                                    ))}
                                                    {(listing.services || []).length > 2 && <span className="service-tag">+{listing.services.length - 2}</span>}
                                                </div>

                                                <div className="card-action">
                                                    <span className="price-hint">Discover more</span>
                                                    <div className="arrow-btn">→</div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && filter === 'city' && availableCities.length > 0 && (
                            <div className="listings-grid">
                                {availableCities.map(city => (
                                    <div
                                        key={city}
                                        className="premium-card glass"
                                        style={{ cursor: 'pointer', textAlign: 'center', justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', minHeight: '200px' }}
                                        onClick={() => {
                                            setFilter('');
                                            setCityFilter(city);
                                            updateURL({ type: '', city: city, category: categoryFilter, services: serviceFilters });
                                        }}
                                    >
                                        <h3 style={{ fontSize: '2rem', marginBottom: '15px' }}>{city}</h3>
                                        <span className="btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Explore Places</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && listings.length === 0 && filter !== 'city' && (
                            <div className="empty-results">
                                <div className="empty-icon">📍</div>
                                <h3>No matching places found</h3>
                                <p>Try adjusting your filters or search term to see more results.</p>
                                <button className="btn" onClick={() => { setFilter(''); setSearch(''); setCategoryFilter(''); setCityFilter(''); setServiceFilters([]); updateURL({ type: '', category: '', city: '', services: [] }); }}>Clear all filters</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .explore-page {
                    background: #0b0b0f;
                    min-height: 100vh;
                    color: white;
                }
                
                .explore-container {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    min-height: calc(100vh - 80px);
                    width: 100%;
                    align-items: start;
                    position: relative;
                }

                /* Sidebar Redesign */
                .sidebar {
                    position: sticky;
                    top: 80px;
                    height: calc(100vh - 100px);
                    background: rgba(15, 15, 20, 0.4);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    margin: 0;
                    z-index: 100;
                }

                .sidebar-header {
                    padding: 40px 30px 20px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .sidebar-header h2 {
                    font-size: 1.6rem;
                    font-weight: 900;
                    letter-spacing: -1px;
                    margin: 0;
                    background: linear-gradient(135deg, #fff 0%, #a29bfe 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .filter-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 30px 40px 30px;
                }
                .filter-scroll::-webkit-scrollbar { width: 6px; }
                .filter-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }

                .tool-section { margin-bottom: 45px; }
                .section-label {
                    color: rgba(255,255,255,0.3);
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 25px;
                    display: block;
                }

                .filter-options { display: flex; flex-direction: column; gap: 6px; }
                .filter-btn {
                    padding: 14px 18px;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: rgba(255,255,255,0.5);
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .filter-btn .dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    transition: all 0.3s;
                }

                .filter-btn:hover {
                    background: rgba(255,255,255,0.03);
                    color: white;
                    transform: translateX(5px);
                }

                .filter-btn.active {
                    background: rgba(108, 92, 231, 0.12);
                    color: #a29bfe;
                    border-color: rgba(108, 92, 231, 0.2);
                    font-weight: 700;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }

                .filter-btn.active .dot {
                    background: #a29bfe;
                    box-shadow: 0 0 12px #a29bfe;
                    transform: scale(1.4);
                }

                .category-scroll { display: flex; flex-wrap: wrap; gap: 10px; }
                .cat-tag {
                    padding: 8px 16px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.6);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .cat-tag:hover { 
                    border-color: rgba(255,255,255,0.2); 
                    color: white;
                    transform: translateY(-2px);
                }
                .cat-tag.active { 
                    background: white; 
                    color: black; 
                    border-color: white; 
                    font-weight: 700;
                    box-shadow: 0 10px 20px rgba(255,255,255,0.1);
                }

                .checkbox-group { display: flex; flex-direction: column; gap: 14px; }
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    cursor: pointer;
                    position: relative;
                }
                .checkbox-item input { position: absolute; opacity: 0; }
                .checkmark {
                    height: 22px; width: 22px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .checkbox-item:hover .checkmark { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.07); }
                .checkbox-item input:checked ~ .checkmark { 
                    background: var(--primary); 
                    border-color: var(--primary);
                    box-shadow: 0 0 15px rgba(108, 92, 231, 0.4);
                    transform: scale(1.1);
                }
                .checkmark:after {
                    content: "";
                    display: none;
                    width: 5px; height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }
                .checkbox-item input:checked ~ .checkmark:after { display: block; }
                .service-name { color: rgba(255,255,255,0.5); font-size: 0.95rem; transition: color 0.3s; }
                .checkbox-item:hover .service-name { color: white; }

                /* Results Area */
                .results-wrapper {
                    display: flex;
                    flex-direction: column;
                    min-height: 100%;
                    background: #0b0b0f;
                    background-image: radial-gradient(circle at 50% -20%, rgba(108, 92, 231, 0.08) 0%, transparent 70%);
                }

                .top-search-bar {
                    margin: 30px;
                    padding: 10px 25px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                }

                .search-input-group {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    gap: 15px;
                }

                .search-icon { font-size: 1.3rem; opacity: 0.4; }
                .main-search-input {
                    background: transparent;
                    border: none;
                    color: white;
                    width: 100%;
                    padding: 12px 0;
                    font-size: 1.15rem;
                    font-weight: 500;
                    letter-spacing: -0.3px;
                }
                .main-search-input:focus { outline: none; }
                .main-search-input::placeholder { color: rgba(255,255,255,0.2); }

                .filter-trigger {
                    display: none;
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 14px;
                    font-weight: 700;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(108, 92, 231, 0.3);
                }

                .results-content {
                    flex: 1;
                    padding: 0 30px 80px 30px;
                }

                .results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .results-title { font-size: 1.1rem; color: rgba(255,255,255,0.4); font-weight: 500; }
                .sort-placeholder { font-size: 0.95rem; color: rgba(255,255,255,0.3); }
                .sort-placeholder b { color: #a29bfe; }

                /* Premium Cards */
                .listings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 30px;
                }

                .premium-card {
                    display: flex;
                    flex-direction: column;
                    border-radius: 24px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                    text-decoration: none;
                    color: white;
                    height: 100%;
                }

                .premium-card:hover {
                    transform: translateY(-12px);
                    border-color: rgba(108, 92, 231, 0.4);
                    background: rgba(255,255,255,0.04);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                }

                .card-image-box {
                    position: relative;
                    height: 240px;
                    width: 100%;
                    overflow: hidden;
                }

                .card-img {
                    width: 100%; height: 100%;
                    background-size: cover; background-position: center;
                    transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1);
                }

                .premium-card:hover .card-img { transform: scale(1.15); }

                .card-overlay {
                    position: absolute;
                    top: 20px; left: 20px;
                    display: flex; gap: 10px;
                }

                .type-pill {
                    background: rgba(15, 15, 20, 0.7);
                    backdrop-filter: blur(10px);
                    padding: 8px 18px;
                    border-radius: 40px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .card-body {
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .card-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                    gap: 15px;
                }

                .card-name {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin: 0;
                    line-height: 1.1;
                    letter-spacing: -0.5px;
                    flex: 1;
                }

                .cat-pill {
                    font-size: 0.7rem;
                    background: rgba(108, 92, 231, 0.15);
                    color: #a29bfe;
                    padding: 5px 12px;
                    border-radius: 8px;
                    font-weight: 800;
                    white-space: nowrap;
                    border: 1px solid rgba(162, 155, 254, 0.1);
                }

                .card-desc {
                    color: rgba(255,255,255,0.45);
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 25px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-tags {
                    display: flex; gap: 8px;
                    margin-top: auto;
                    margin-bottom: 25px;
                }

                .service-tag {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.04);
                    padding: 5px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.04);
                }

                .card-action {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }

                .price-hint { font-size: 0.9rem; font-weight: 700; color: #a29bfe; }
                .arrow-btn {
                    width: 40px; height: 40px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .premium-card:hover .arrow-btn { 
                    background: var(--primary); 
                    color: white; 
                    transform: translateX(8px);
                    box-shadow: 0 0 20px rgba(108, 92, 231, 0.5);
                }

                /* Responsiveness */
                @media (max-width: 1024px) {
                    .explore-container { grid-template-columns: 1fr; }
                    .sidebar {
                        position: fixed;
                        top: 0; left: 0; width: 100%; height: 100%;
                        background: #0b0b0f;
                        transform: translateY(100%);
                        transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                    }
                    .sidebar.mobile-visible { transform: translateY(0); }
                    .mobile-only { display: block; }
                    .close-btn { 
                        background: rgba(255,255,255,0.05); 
                        border: none; color: white; 
                        width: 50px; height: 50px; border-radius: 50%;
                        font-size: 1.5rem; cursor: pointer;
                    }
                    .filter-trigger { display: flex; }
                    .results-content { padding: 0 20px 40px 20px; }
                    .top-search-bar { margin: 20px; }
                    .listings-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                }

                @media (max-width: 640px) {
                    .listings-grid { grid-template-columns: 1fr; gap: 15px; }
                    .premium-card { border-radius: 16px; margin: 0 10px; }
                    .card-body { padding: 15px; }
                    .card-name { font-size: 1.2rem; }
                    .card-desc { font-size: 0.9rem; margin-bottom: 15px; }
                    .top-search-bar { border-radius: 12px; margin: 10px; padding: 8px 15px; }
                    .main-search-input { font-size: 1rem; }
                    .sidebar-header { padding: 20px; }
                    .filter-scroll { padding: 0 20px 30px 20px; }
                    .cat-tag { padding: 6px 12px; font-size: 0.8rem; }
                    .results-content { padding: 0 10px 30px 10px; }
                }

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
