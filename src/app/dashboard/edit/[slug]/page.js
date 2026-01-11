'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Predefined categories for different business types
const CATEGORIES = {
    restaurant: ['Traditional', 'Fast Food', 'Pizzeria', 'Bar & Grill', 'Seafood', 'Vegan/Vegetarian'],
    bar: ['Cocktail Bar', 'Lounge Bar', 'Wine Bar', 'Beer Bar', 'Cafe Bar', 'Night Bar'],
    hotel: ['Hotel', 'Boutique Hotel', 'Guesthouse', 'Hostel', 'Resort'],
    bujtina: ['Traditional', 'Modern', 'Family-Run', 'Mountain', 'Lake View'],
    rentcar: ['Economy', 'Luxury', 'SUV', 'Electric', 'Family']
};

// Predefined services (for non-hotel types)
const SERVICES = [
    'Wi-Fi falas',
    'Parkim',
    'Rezervime',
    'Delivery',
    'Live Music',
    'Outdoor Seating',
    'Pet Friendly',
    'Wheelchair Access',
    'Air Conditioning',
    'Heating'
];

// Hotel-specific options
const ROOM_TYPES = ['Single', 'Double', 'Twin', 'Triple', 'Family Room', 'Suite'];
const ROOM_AMENITIES = ['Wi-Fi falas', 'TV', 'Ajër i kondicionuar', 'Mini-bar', 'Banjo private', 'Ballkon'];
const GENERAL_SERVICES = ['Reception 24/7', 'Wi-Fi falas', 'Parkim falas', 'Mëngjes i përfshirë', 'Shërbim dhome', 'Bar / Restorant'];
const ADDITIONAL_SERVICES = ['Transfer aeroporti', 'Laundry', 'Organizim eventesh'];

// Bar-specific options
const BAR_ATMOSPHERE = ['Relax', 'Modern', 'Traditional', 'Romantic', 'Nightlife'];
const BAR_SERVICES = ['Wi-Fi falas', 'Ambient i jashtëm (verandë)', 'Live Music / DJ', 'Evente tematike', 'Rezervime', 'Pagesa me kartë'];
const SUITABLE_FOR = ['Çifte', 'Grupe shoqërore', 'Turistë'];

export default function EditListingPage({ params }) {
    const { slug } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        type: 'hotel',
        lat: '',
        lng: '',
        currentImage: '',
        category: '',
        customCategory: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedServices, setSelectedServices] = useState([]);
    const [customService, setCustomService] = useState('');

    // Hotel-specific state
    const [hotelData, setHotelData] = useState({
        totalRooms: '',
        roomTypes: [],
        customRoomType: '',
        roomAmenities: [],
        customRoomAmenity: '',
        generalServices: [],
        customGeneralService: '',
        additionalServices: [],
        customAdditionalService: '',
        policies: {
            cancellation: 'Anulim falas deri 24 orë para mbërritjes',
            children: 'Të mirëpritur',
            pets: 'Nuk lejohen',
            payment: 'Cash / Kartë'
        }
    });

    // Bar-specific state
    const [barData, setBarData] = useState({
        atmosphere: [],
        customAtmosphere: '',
        services: [],
        customService: '',
        customSuitableFor: '',
        rules: {
            minAge: '18+',
            suitableFor: [],
            smokingArea: 'Non-smoking'
        },
        features: {
            featuredDrinks: false,
            openLate: false,
            liveMusicTonight: false,
            cocktailOfWeek: ''
        }
    });

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        fetchListing();
    }, [slug]);

    const fetchListing = async () => {
        try {
            const res = await fetch(`/api/listings/${slug}`);
            const data = await res.json();
            if (data.listing) {
                const listing = data.listing;
                setFormData({
                    title: listing.title,
                    description: listing.description,
                    address: listing.address,
                    type: listing.type,
                    lat: listing.lat,
                    lng: listing.lng,
                    currentImage: listing.image,
                    category: listing.category || '',
                    customCategory: ''
                });
                setSelectedServices(listing.services || []);
                if (listing.hotelData) {
                    setHotelData(prev => ({
                        ...prev,
                        ...listing.hotelData,
                        policies: {
                            ...prev.policies,
                            ...(listing.hotelData.policies || {})
                        }
                    }));
                }
                if (listing.barData) {
                    setBarData(prev => ({
                        ...prev,
                        ...listing.barData,
                        rules: {
                            ...prev.rules,
                            ...(listing.barData.rules || {})
                        },
                        features: {
                            ...prev.features,
                            ...(listing.barData.features || {})
                        }
                    }));
                }
            } else {
                alert('Listing not found');
                router.push('/dashboard');
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // Hotel-specific helper functions
    const toggleHotelArray = (arrayName, item) => {
        setHotelData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].includes(item)
                ? prev[arrayName].filter(i => i !== item)
                : [...prev[arrayName], item]
        }));
    };

    const addCustomHotelItem = (arrayName, customFieldName) => {
        const customValue = hotelData[customFieldName]?.trim();
        if (customValue && !hotelData[arrayName].includes(customValue)) {
            setHotelData(prev => ({
                ...prev,
                [arrayName]: [...prev[arrayName], customValue],
                [customFieldName]: ''
            }));
        }
    };

    const updateHotelPolicy = (policyName, value) => {
        setHotelData(prev => ({
            ...prev,
            policies: {
                ...prev.policies,
                [policyName]: value
            }
        }));
    };

    // Bar-specific helper functions
    const toggleBarArray = (arrayName, item) => {
        setBarData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].includes(item)
                ? prev[arrayName].filter(i => i !== item)
                : [...prev[arrayName], item]
        }));
    };

    const toggleBarRuleArray = (arrayName, item) => {
        setBarData(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                [arrayName]: prev.rules[arrayName].includes(item)
                    ? prev.rules[arrayName].filter(i => i !== item)
                    : [...prev.rules[arrayName], item]
            }
        }));
    };

    const updateBarFeature = (featureName, value) => {
        setBarData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [featureName]: value
            }
        }));
    };

    const updateBarRule = (ruleName, value) => {
        setBarData(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                [ruleName]: value
            }
        }));
    };

    const addCustomBarItem = (arrayName, customFieldName) => {
        const customValue = barData[customFieldName]?.trim();
        if (customValue && !barData[arrayName].includes(customValue)) {
            setBarData(prev => ({
                ...prev,
                [arrayName]: [...prev[arrayName], customValue],
                [customFieldName]: ''
            }));
        }
    };

    const addCustomBarRuleItem = (arrayName, customFieldName) => {
        const customValue = barData[customFieldName]?.trim();
        if (customValue && !barData.rules[arrayName].includes(customValue)) {
            setBarData(prev => ({
                ...prev,
                rules: {
                    ...prev.rules,
                    [arrayName]: [...prev.rules[arrayName], customValue]
                },
                [customFieldName]: ''
            }));
        }
    };

    const handleAddressSearch = async () => {
        if (!formData.address) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ' Korce Albania')}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, lat: data[0].lat, lng: data[0].lon }));
                alert(`Found location! Lat: ${data[0].lat}, Lng: ${data[0].lon}`);
            } else {
                alert('Address not found on map.');
            }
        } catch (e) {
            alert('Error searching address.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Determine final category
        const finalCategory = formData.category === 'custom' ? formData.customCategory : formData.category;

        // Create FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('address', formData.address);
        data.append('type', formData.type);
        data.append('lat', formData.lat);
        data.append('lng', formData.lng);
        if (finalCategory) {
            data.append('category', finalCategory);
        }
        data.append('services', JSON.stringify(selectedServices));

        // Add hotel-specific data if type is hotel
        if (formData.type === 'hotel') {
            data.append('hotelData', JSON.stringify(hotelData));
        }

        // Add bar-specific data if type is bar
        if (formData.type === 'bar') {
            const barDataToSave = {
                ...barData,
                category: finalCategory
            };
            data.append('barData', JSON.stringify(barDataToSave));
        }

        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const res = await fetch(`/api/listings/${slug}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (res.ok) {
                alert('Listing updated successfully!');
                router.push('/dashboard');
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to update listing');
            }
        } catch (err) {
            alert('Error updating listing');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleService = (service) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const addCustomService = () => {
        if (customService.trim() && !selectedServices.includes(customService.trim())) {
            setSelectedServices([...selectedServices, customService.trim()]);
            setCustomService('');
        }
    };

    if (loading || authLoading) return <div className="container">Loading...</div>;

    const availableCategories = CATEGORIES[formData.type] || [];
    const isCategoryInList = availableCategories.includes(formData.category);

    return (
        <div className="glass card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Edit Listing</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Name *</label>
                    <input name="title" placeholder="Business Name" className="input" value={formData.title} onChange={handleChange} required />
                </div>

                {/* Category Selection */}
                {availableCategories.length > 0 && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Category</label>
                        <select
                            name="category"
                            className="input"
                            value={isCategoryInList ? formData.category : 'custom'}
                            onChange={handleChange}
                        >
                            <option value="">Select a category...</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">+ Add Custom Category</option>
                        </select>

                        {(!isCategoryInList && formData.category) && (
                            <input
                                name="customCategory"
                                placeholder="Enter custom category"
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                style={{ marginTop: '10px' }}
                            />
                        )}

                        {formData.category === 'custom' && (
                            <input
                                name="customCategory"
                                placeholder="Enter custom category"
                                className="input"
                                value={formData.customCategory}
                                onChange={handleChange}
                                style={{ marginTop: '10px' }}
                            />
                        )}
                    </div>
                )}

                {/* Description */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Description *</label>
                    <textarea
                        name="description"
                        placeholder="Describe your business..."
                        className="input"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={8}
                        style={{ minHeight: '200px', resize: 'vertical' }}
                    />
                </div>

                {/* Hotel-Specific Fields */}
                {formData.type === 'hotel' && (
                    <>
                        {/* Dhoma & Akomodimi */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Dhoma & Akomodimi</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Numri total i dhomave</label>
                                <input
                                    type="number"
                                    placeholder="18"
                                    className="input"
                                    value={hotelData.totalRooms}
                                    onChange={(e) => setHotelData({ ...hotelData, totalRooms: e.target.value })}
                                    min="1"
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Llojet e dhomave</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {ROOM_TYPES.map(roomType => (
                                        <label key={roomType} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={hotelData.roomTypes.includes(roomType)}
                                                onChange={() => toggleHotelArray('roomTypes', roomType)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{roomType}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom room type..."
                                        className="input"
                                        value={hotelData.customRoomType}
                                        onChange={(e) => setHotelData({ ...hotelData, customRoomType: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomHotelItem('roomTypes', 'customRoomType')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {hotelData.roomTypes.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {hotelData.roomTypes.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(253, 121, 168, 0.2)', border: '1px solid #fd79a8', color: '#fd79a8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleHotelArray('roomTypes', item)} style={{ background: 'none', border: 'none', color: '#fd79a8', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pajisjet në dhomë */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Pajisjet në dhomë</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {ROOM_AMENITIES.map(amenity => (
                                    <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={hotelData.roomAmenities.includes(amenity)}
                                            onChange={() => toggleHotelArray('roomAmenities', amenity)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{amenity}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    placeholder="Add custom amenity..."
                                    className="input"
                                    value={hotelData.customRoomAmenity}
                                    onChange={(e) => setHotelData({ ...hotelData, customRoomAmenity: e.target.value })}
                                    style={{ margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addCustomHotelItem('roomAmenities', 'customRoomAmenity')}
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    + Add
                                </button>
                            </div>
                            {hotelData.roomAmenities.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {hotelData.roomAmenities.map(item => (
                                        <span key={item} className="badge" style={{ background: 'rgba(253, 121, 168, 0.2)', border: '1px solid #fd79a8', color: '#fd79a8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {item}
                                            <button type="button" onClick={() => toggleHotelArray('roomAmenities', item)} style={{ background: 'none', border: 'none', color: '#fd79a8', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Shërbimet & Facilitetet */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Shërbimet & Facilitetet</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Shërbime të përgjithshme</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {GENERAL_SERVICES.map(service => (
                                        <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={hotelData.generalServices.includes(service)}
                                                onChange={() => toggleHotelArray('generalServices', service)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{service}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom service..."
                                        className="input"
                                        value={hotelData.customGeneralService}
                                        onChange={(e) => setHotelData({ ...hotelData, customGeneralService: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomHotelItem('generalServices', 'customGeneralService')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {hotelData.generalServices.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {hotelData.generalServices.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(253, 121, 168, 0.2)', border: '1px solid #fd79a8', color: '#fd79a8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleHotelArray('generalServices', item)} style={{ background: 'none', border: 'none', color: '#fd79a8', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Shërbime shtesë</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {ADDITIONAL_SERVICES.map(service => (
                                        <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={hotelData.additionalServices.includes(service)}
                                                onChange={() => toggleHotelArray('additionalServices', service)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{service}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom additional service..."
                                        className="input"
                                        value={hotelData.customAdditionalService}
                                        onChange={(e) => setHotelData({ ...hotelData, customAdditionalService: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomHotelItem('additionalServices', 'customAdditionalService')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {hotelData.additionalServices.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {hotelData.additionalServices.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(253, 121, 168, 0.2)', border: '1px solid #fd79a8', color: '#fd79a8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleHotelArray('additionalServices', item)} style={{ background: 'none', border: 'none', color: '#fd79a8', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Politikat */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Politikat</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Politika e anulimit</label>
                                <input
                                    type="text"
                                    placeholder="Anulim falas deri 24 orë para mbërritjes"
                                    className="input"
                                    value={hotelData.policies.cancellation}
                                    onChange={(e) => updateHotelPolicy('cancellation', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Fëmijët</label>
                                <input
                                    type="text"
                                    placeholder="Të mirëpritur"
                                    className="input"
                                    value={hotelData.policies.children}
                                    onChange={(e) => updateHotelPolicy('children', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Kafshët shtëpiake</label>
                                <input
                                    type="text"
                                    placeholder="Nuk lejohen"
                                    className="input"
                                    value={hotelData.policies.pets}
                                    onChange={(e) => updateHotelPolicy('pets', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Pagesa</label>
                                <input
                                    type="text"
                                    placeholder="Cash / Kartë"
                                    className="input"
                                    value={hotelData.policies.payment}
                                    onChange={(e) => updateHotelPolicy('payment', e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Bar-Specific Fields */}
                {formData.type === 'bar' && (
                    <>
                        {/* Stili / Atmosfera */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Stili / Atmosfera</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {BAR_ATMOSPHERE.map(item => (
                                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={barData.atmosphere.includes(item)}
                                            onChange={() => toggleBarArray('atmosphere', item)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{item}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    placeholder="Add custom atmosphere..."
                                    className="input"
                                    value={barData.customAtmosphere}
                                    onChange={(e) => setBarData({ ...barData, customAtmosphere: e.target.value })}
                                    style={{ margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addCustomBarItem('atmosphere', 'customAtmosphere')}
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap', background: '#00d2d3' }}
                                >
                                    + Add
                                </button>
                            </div>
                            {barData.atmosphere.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {barData.atmosphere.map(item => (
                                        <span key={item} className="badge" style={{ background: 'rgba(0, 210, 211, 0.2)', border: '1px solid #00d2d3', color: '#00d2d3', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {item}
                                            <button type="button" onClick={() => toggleBarArray('atmosphere', item)} style={{ background: 'none', border: 'none', color: '#00d2d3', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Shërbime & Facilitetet */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Shërbime & Facilitetet</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {BAR_SERVICES.map(service => (
                                    <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={barData.services.includes(service)}
                                            onChange={() => toggleBarArray('services', service)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{service}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    placeholder="Add custom service..."
                                    className="input"
                                    value={barData.customService}
                                    onChange={(e) => setBarData({ ...barData, customService: e.target.value })}
                                    style={{ margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addCustomBarItem('services', 'customService')}
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap', background: '#00d2d3' }}
                                >
                                    + Add
                                </button>
                            </div>
                            {barData.services.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {barData.services.map(item => (
                                        <span key={item} className="badge" style={{ background: 'rgba(0, 210, 211, 0.2)', border: '1px solid #00d2d3', color: '#00d2d3', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {item}
                                            <button type="button" onClick={() => toggleBarArray('services', item)} style={{ background: 'none', border: 'none', color: '#00d2d3', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Publiku & Rregullat */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Publiku & Rregullat</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Mosha minimale</label>
                                <input
                                    placeholder="e.g. 18+"
                                    className="input"
                                    value={barData.rules.minAge}
                                    onChange={(e) => updateBarRule('minAge', e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>I përshtatshëm për:</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {SUITABLE_FOR.map(item => (
                                        <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={barData.rules.suitableFor.includes(item)}
                                                onChange={() => toggleBarRuleArray('suitableFor', item)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{item}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom preference..."
                                        className="input"
                                        value={barData.customSuitableFor}
                                        onChange={(e) => setBarData({ ...barData, customSuitableFor: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomBarRuleItem('suitableFor', 'customSuitableFor')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#00d2d3' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {barData.rules.suitableFor.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {barData.rules.suitableFor.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(0, 210, 211, 0.2)', border: '1px solid #00d2d3', color: '#00d2d3', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleBarRuleArray('suitableFor', item)} style={{ background: 'none', border: 'none', color: '#00d2d3', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Smoking / Non-smoking area</label>
                                <select
                                    className="input"
                                    value={barData.rules.smokingArea}
                                    onChange={(e) => updateBarRule('smokingArea', e.target.value)}
                                >
                                    <option value="Non-smoking">Non-smoking</option>
                                    <option value="Smoking">Smoking Area</option>
                                    <option value="Both">Both areas available</option>
                                </select>
                            </div>
                        </div>

                        {/* Highlights & Features */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Highlights & Features</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={barData.features.featuredDrinks}
                                        onChange={(e) => updateBarFeature('featuredDrinks', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>🔥 Featured Drinks</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={barData.features.openLate}
                                        onChange={(e) => updateBarFeature('openLate', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>📍 Bar i hapur deri vonë</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={barData.features.liveMusicTonight}
                                        onChange={(e) => updateBarFeature('liveMusicTonight', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>🎶 Muzikë live sonte</span>
                                </label>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>🍸 Cocktail of the Week</label>
                                <input
                                    placeholder="e.g. Negroni Sbagliato"
                                    className="input"
                                    value={barData.features.cocktailOfWeek}
                                    onChange={(e) => updateBarFeature('cocktailOfWeek', e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Services (for non-hotel types) */}
                {formData.type !== 'hotel' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Services & Amenities</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                            {SERVICES.map(service => (
                                <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedServices.includes(service)}
                                        onChange={() => toggleService(service)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <input
                                placeholder="Add custom service..."
                                className="input"
                                value={customService}
                                onChange={(e) => setCustomService(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCustomService();
                                    }
                                }}
                                style={{ flex: 1 }}
                            />
                            <button type="button" onClick={addCustomService} className="btn" style={{ background: 'var(--accent)' }}>
                                + Add
                            </button>
                        </div>

                        {selectedServices.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedServices.map(service => (
                                    <span key={service} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {service}
                                        <button
                                            type="button"
                                            onClick={() => toggleService(service)}
                                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 4px' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input name="address" placeholder="Address (Optional)" className="input" value={formData.address || ''} onChange={handleChange} style={{ flex: 1 }} />
                    <button type="button" onClick={handleAddressSearch} className="btn" style={{ background: 'var(--accent)', whiteSpace: 'nowrap' }}>Locate on Map</button>
                </div>

                <div>
                    <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Change Image (Optional):</label>
                    {formData.currentImage && <div style={{ marginBottom: '10px' }}><img src={formData.currentImage} alt="Current" style={{ height: '100px', borderRadius: '8px' }} /></div>}
                    <input
                        type="file"
                        accept="image/*"
                        className="input"
                        onChange={(e) => setImageFile(e.target.files[0])}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Latitude: *</label>
                        <input name="lat" placeholder="Latitude" className="input" value={formData.lat} onChange={handleChange} required />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Longitude: *</label>
                        <input name="lng" placeholder="Longitude" className="input" value={formData.lng} onChange={handleChange} required />
                    </div>
                </div>

                <button type="submit" className="btn">Update Listing</button>
            </form>
        </div>
    );
}
