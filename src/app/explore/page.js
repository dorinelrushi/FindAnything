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
                    console.error("Error getting location", error);
                }
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
                    if (listing.hotelData.generalServices) {
                        listing.hotelData.generalServices.forEach(s => servs.add(s));
                    }
                    if (listing.hotelData.additionalServices) {
                        listing.hotelData.additionalServices.forEach(s => servs.add(s));
                    }
                    if (listing.hotelData.roomAmenities) {
                        listing.hotelData.roomAmenities.forEach(s => servs.add(s));
                    }
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

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

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
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    alert('Please allow location access to use this feature.');
                }
            );
        }
    };

    if (!hydrated) return null; // Avoid hydration mismatch

    return (
        <div className="explore-container">
            {/* Left Sidebar - Filters & Tools */}
            <div className="sidebar glass">
                <h3>Explore</h3>

                <div className="tool-section">
                    <h4>Type</h4>
                    <div className="filter-options">
                        <button className={`filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => handleFilterChange('')}>All</button>
                        <button className={`filter-btn ${filter === 'hotel' ? 'active' : ''}`} onClick={() => handleFilterChange('hotel')}>Hotels</button>
                        <button className={`filter-btn ${filter === 'restaurant' ? 'active' : ''}`} onClick={() => handleFilterChange('restaurant')}>Restaurants</button>
                        <button className={`filter-btn ${filter === 'bar' ? 'active' : ''}`} onClick={() => handleFilterChange('bar')}>Bars</button>
                        <button className={`filter-btn ${filter === 'bujtina' ? 'active' : ''}`} onClick={() => handleFilterChange('bujtina')}>Bujtinas</button>
                        <button className={`filter-btn ${filter === 'rentcar' ? 'active' : ''}`} onClick={() => handleFilterChange('rentcar')}>Rent Car</button>
                    </div>
                </div>

                {/* Category Filter - Only show if we have categories */}
                {availableCategories.length > 0 && (
                    <div className="tool-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h4>Category</h4>
                        <div className="filter-options">
                            <button
                                className={`filter-btn ${categoryFilter === '' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('')}
                            >
                                All Categories
                            </button>
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services Filter - Only show if we have services */}
                {availableServices.length > 0 && (
                    <div className="tool-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h4>Services</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableServices.map(service => (
                                <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={serviceFilters.includes(service)}
                                        onChange={() => toggleServiceFilter(service)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="tool-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    <h4>Distance Calculator</h4>
                    <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '10px' }}>
                        Select a listing to calculate distance from your location.
                    </div>

                    <div className="input-group">
                        <label>Start (A)</label>
                        <select
                            className="input"
                            style={{ padding: '8px' }}
                            value={calcPointA === 'My Location' ? 'My Location' : calcPointA._id}
                            onChange={(e) => {
                                if (e.target.value === 'My Location') setCalcPointA('My Location');
                                else {
                                    const loc = listings.find(l => l._id === e.target.value);
                                    setCalcPointA(loc);
                                }
                            }}
                        >
                            <option value="My Location">My Location {userLocation ? '✅' : '(No GPS)'}</option>
                            {listings.map(l => (
                                <option key={'opt-a-' + l._id} value={l._id}>{l.title}</option>
                            ))}
                        </select>
                        {!userLocation && calcPointA === 'My Location' && (
                            <button onClick={requestLocation} className="btn-small">📍 Enable GPS</button>
                        )}
                    </div>

                    <div className="input-group">
                        <label>End (B)</label>
                        <select
                            className="input"
                            style={{ padding: '8px' }}
                            value={calcPointB ? calcPointB._id : ''}
                            onChange={(e) => {
                                const loc = listings.find(l => l._id === e.target.value);
                                setCalcPointB(loc);
                            }}
                        >
                            <option value="">Select Destination...</option>
                            {listings.map(l => (
                                <option key={'opt-b-' + l._id} value={l._id}>{l.title}</option>
                            ))}
                        </select>
                    </div>

                    {calculatedDist && (
                        <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '8px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                            Distance: {calculatedDist} km
                        </div>
                    )}
                </div>
            </div>

            {/* Middle - Results */}
            <div className="results-area">
                <div className="search-header glass">
                    <input
                        type="text"
                        placeholder="Search places..."
                        className="input"
                        style={{ margin: 0, border: 'none', background: 'transparent' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const params = new URLSearchParams(searchParams);
                                if (search) params.set('search', search);
                                else params.delete('search');
                                router.push(`/explore?${params.toString()}`);
                            }
                        }}
                    />
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="listings-list">
                        {listings.map(listing => {
                            // Strip HTML tags for preview
                            const stripHtml = (html) => {
                                const tmp = document.createElement('div');
                                tmp.innerHTML = html;
                                return tmp.textContent || tmp.innerText || '';
                            };

                            return (
                                <div key={listing._id} className="listing-card glass" onClick={() => setCalcPointB(listing)} style={{ cursor: 'pointer' }}>
                                    <div className="listing-image" style={{ backgroundImage: `url(${listing.image || 'https://via.placeholder.com/200'})` }}></div>
                                    <div className="listing-info">
                                        <h3>{listing.title}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span className="badge">{listing.type}</span>
                                                {listing.category && (
                                                    <span className="badge" style={{ background: 'var(--accent)', fontSize: '0.7rem' }}>
                                                        {listing.category}
                                                    </span>
                                                )}
                                            </div>
                                            <Link href={`/${listing.type}/${listing.slug || listing._id}`} style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>View Details &rarr;</Link>
                                        </div>

                                        <p>{stripHtml(listing.description).substring(0, 60)}...</p>

                                        {/* Service/Amenity Tags */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                                            {(listing.type === 'hotel' && listing.hotelData
                                                ? [
                                                    ...(listing.hotelData.generalServices || []),
                                                    ...(listing.hotelData.roomAmenities || [])
                                                ]
                                                : (listing.services || [])
                                            ).slice(0, 3).map((tag, i) => (
                                                <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#aaa' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {(listing.type === 'hotel' && listing.hotelData && (listing.hotelData.generalServices?.length + listing.hotelData.roomAmenities?.length > 3)) && (
                                                <span style={{ fontSize: '0.65rem', color: '#666' }}>+{(listing.hotelData.generalServices.length + listing.hotelData.roomAmenities.length) - 3}</span>
                                            )}
                                        </div>

                                        {/* Quick Distance display if user location is known */}
                                        {distances[listing._id] && (
                                            <p style={{ color: '#fd79a8', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '8px' }}>
                                                🚶 {distances[listing._id]} km away
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {listings.length === 0 && <p>No results found.</p>}
                    </div>
                )}
            </div>

            {/* Right - Map */}
            <div className="map-area glass">
                <Map
                    listings={listings}
                    startPoint={(calcPointA === 'My Location' ? userLocation : calcPointA)}
                    endPoint={calcPointB}
                />
            </div>

            <style jsx>{`
                .explore-container {
                    display: grid;
                    grid-template-columns: 280px 380px 1fr;
                    gap: 20px;
                    height: calc(100vh - 80px); 
                    padding: 20px;
                    width: 100%;
                    max-width: 100%;
                    margin: 0;
                    overflow: hidden; 
                }
                
                @media (max-width: 1200px) {
                    .explore-container {
                        grid-template-columns: 250px 1fr;
                    }
                    .map-area {
                        display: none; /* Hide map on medium screens to focus on list/filters? Or stack */
                    }
                }

                @media (max-width: 768px) {
                    .explore-container {
                        display: flex;
                        flex-direction: column;
                        height: auto;
                        overflow-y: auto;
                        padding-bottom: 80px; /* Space for nav if sticky bottom */
                    }
                    .map-area {
                        display: block;
                        height: 300px;
                        order: -1;
                        flex-shrink: 0;
                    }
                    .sidebar {
                        order: 0;
                    }
                    .results-area {
                        order: 1;
                        overflow: visible; /* Let it grow */
                    }
                }

                .sidebar {
                    padding: 20px;
                    height: 100%;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }

                .tool-section {
                    margin-bottom: 15px;
                }

                .filter-options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .filter-btn {
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: transparent;
                    color: white;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }

                .filter-btn:hover, .filter-btn.active {
                    background: var(--primary);
                    border-color: var(--primary);
                }
                
                .btn-small {
                    font-size: 0.8rem;
                    background: var(--card-bg);
                    color: white;
                    border: 1px solid var(--primary);
                    padding: 5px;
                    border-radius: 4px;
                    margin-top: 5px;
                    cursor: pointer;
                }

                .results-area {
                    height: 100%;
                    overflow-y: auto;
                    padding-right: 10px;
                    display: flex;
                    flex-direction: column;
                }
                
                .results-area::-webkit-scrollbar {
                    width: 5px;
                }
                .results-area::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 5px;
                }

                .search-header {
                    padding: 15px;
                    margin-bottom: 20px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .listings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding-bottom: 20px;
                }

                .listing-card {
                    display: flex;
                    gap: 15px;
                    padding: 15px;
                    text-decoration: none;
                    color: white;
                    transition: transform 0.2s;
                }
                
                .listing-card:hover {
                    transform: translateX(5px);
                    background: rgba(255,255,255,0.1);
                }

                .listing-image {
                    width: 100px;
                    height: 100px;
                    border-radius: 8px;
                    background-size: cover;
                    background-position: center;
                    flex-shrink: 0;
                }

                .listing-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .listing-info h3 {
                    margin: 0 0 5px 0;
                    font-size: 1.1rem;
                }

                .badge {
                    font-size: 0.75rem;
                    background: var(--primary);
                    padding: 2px 8px;
                    border-radius: 10px;
                    display: inline-block;
                    margin-bottom: 5px;
                    width: fit-content;
                }
                
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    margin-bottom: 10px;
                }

                .map-area {
                    height: 100%;
                    border-radius: 16px;
                    overflow: hidden;
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
