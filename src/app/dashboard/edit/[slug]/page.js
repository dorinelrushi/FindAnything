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
    rentcar: ['Economy', 'Luxury', 'SUV', 'Electric', 'Family'],
    tour: ['Day Trip', 'Multi-day Tour', 'Adventure', 'Cultural', 'Walking Tour', 'Food Tour', 'Hiking']
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

const CAR_CATEGORIES = ['Ekonomike', 'Kompakte', 'SUV', 'Luksoze', '4x4', 'Furgon'];
const FUEL_TYPES = ['Naftë', 'Benzinë', 'Elektrike', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatik'];
const CAR_INCLUSIONS = ['Siguracion bazë', 'Kilometra pa limit', 'Asistencë rrugore'];
const REQUIRED_DOCS = ['ID / Pasaportë', 'Patentë'];
const CAR_PAYMENT_METHODS = ['Cash', 'Kartë', 'Transfertë Bankare'];
const CAR_EXTRA_SERVICES = ['Sedilje fëmijësh', 'GPS / Navigacion', 'Shofer shtesë', 'Siguracion Full Kasko'];

// Bujtina-specific options
const BUJTINA_TYPES = ['Bujtinë', 'Guesthouse', 'Agroturizëm'];
const BUJTINA_STYLES = ['Tradicional', 'Rustik', 'Familjar'];
const BUJTINA_ROOM_TYPES = ['Double', 'Triple', 'Family Room'];
const BUJTINA_AMENITIES = ['Ngrohje', 'Banjo private', 'Wi-Fi', 'Oxhak (opsionale)'];
const BUJTINA_FACILITIES = ['Parkim falas', 'Ambient i jashtëm', 'Zjarr/oxhak', 'Guides lokale (opsionale)'];
const BIO_PRODUCTS = ['Djathë', 'Qumësht', 'Reçel', 'Bukë shtëpie'];

// Tour specific options
const TOUR_INCLUSIONS = ['Transport', 'Lunch', 'Dinner', 'Guide', 'Entrance Fees', 'Hotel Pickup'];

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
    const [existingGallery, setExistingGallery] = useState([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState([]);

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

    // Bujtina-specific state
    const [bujtinaData, setBujtinaData] = useState({
        accommodationType: 'Bujtinë',
        style: [],
        totalRooms: '',
        roomTypes: [],
        roomAmenities: [],
        facilities: [],
        food: {
            breakfast: 'Po (produkte shtëpie)',
            meals: 'Ushqim tradicional korçar',
            bioProducts: []
        },
        customStyle: '',
        customRoomType: '',
        customAmenity: '',
        customFacility: '',
        customBioProduct: ''
    });

    // Rent Car specific state
    const [rentCarData, setRentCarData] = useState({
        brandModel: '',
        year: '',
        category: [],
        fuelType: '',
        transmission: '',
        seats: '',
        airConditioning: true,
        fuelConsumption: '',
        prices: {
            daily: '',
            weekly: '',
            deposit: '',
            inclusions: []
        },
        conditions: {
            minAge: '',
            licenseExperience: '',
            requiredDocuments: [],
            paymentMethods: []
        },
        availability: {
            status: 'E lirë',
            dates: ''
        },
        extraServices: [],
        customCategory: '',
        customInclusion: '',
        customDocument: '',
        customPayment: '',
        customExtraService: ''
    });

    // Tour specific state
    const [tourData, setTourData] = useState({
        duration: '',
        country: '',
        maxTravelers: '',
        itinerary: [{ day: 1, content: '' }],
        inclusions: [],
        exclusions: [],
        calendar: '',
        price: '',
        pricing: {
            adultPrice: 0,
            childPrice: 0,
            fixedPrice: 0,
            isGroupWise: false
        },
        extras: [],
        customExtraName: '',
        customExtraPrice: '',
        customInclusion: '',
        customExclusion: '',
        whatsappNumber: ''
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
                setExistingGallery(listing.gallery || []);
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
                            ...(listing.barData.features || {})
                        }
                    }));
                }
                if (listing.bujtinaData) {
                    setBujtinaData(prev => ({
                        ...prev,
                        ...listing.bujtinaData,
                        food: {
                            ...prev.food,
                            ...(listing.bujtinaData.food || {})
                        }
                    }));
                }
                if (listing.rentCarData) {
                    setRentCarData(prev => ({
                        ...prev,
                        ...listing.rentCarData,
                        prices: {
                            ...prev.prices,
                            ...(listing.rentCarData.prices || {})
                        },
                        conditions: {
                            ...prev.conditions,
                            ...(listing.rentCarData.conditions || {})
                        },
                        availability: {
                            ...prev.availability,
                            ...(listing.rentCarData.availability || {})
                        }
                    }));
                }
                if (listing.tourData) {
                    setTourData(prev => ({
                        ...prev,
                        ...listing.tourData,
                        pricing: {
                            ...prev.pricing,
                            ...(listing.tourData.pricing || {})
                        },
                        extras: listing.tourData.extras || []
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

    // Tour helpers
    const toggleTourInclusion = (item) => {
        setTourData(prev => ({
            ...prev,
            inclusions: prev.inclusions.includes(item) ? prev.inclusions.filter(i => i !== item) : [...prev.inclusions, item]
        }));
    };

    const addCustomTourInclusion = () => {
        const val = tourData.customInclusion.trim();
        if (val && !tourData.inclusions.includes(val)) {
            setTourData(prev => ({ ...prev, inclusions: [...prev.inclusions, val], customInclusion: '' }));
        }
    };

    const addItineraryDay = () => {
        setTourData(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, content: '' }]
        }));
    };

    const updateItineraryDay = (index, content) => {
        setTourData(prev => ({
            ...prev,
            itinerary: prev.itinerary.map((item, i) => i === index ? { ...item, content } : item)
        }));
    };

    const toggleBujtinaArray = (arrayName, item) => {
        setBujtinaData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].includes(item)
                ? prev[arrayName].filter(i => i !== item)
                : [...prev[arrayName], item]
        }));
    };

    const toggleBujtinaBio = (item) => {
        setBujtinaData(prev => ({
            ...prev,
            food: {
                ...prev.food,
                bioProducts: prev.food.bioProducts.includes(item)
                    ? prev.food.bioProducts.filter(i => i !== item)
                    : [...prev.food.bioProducts, item]
            }
        }));
    };

    const addCustomBujtinaItem = (arrayName, customFieldName) => {
        const customValue = bujtinaData[customFieldName]?.trim();
        if (customValue && !bujtinaData[arrayName].includes(customValue)) {
            setBujtinaData(prev => ({
                ...prev,
                [arrayName]: [...prev[arrayName], customValue],
                [customFieldName]: ''
            }));
        }
    };

    const addCustomBujtinaBio = () => {
        const customValue = bujtinaData.customBioProduct?.trim();
        if (customValue && !bujtinaData.food.bioProducts.includes(customValue)) {
            setBujtinaData(prev => ({
                ...prev,
                food: {
                    ...prev.food,
                    bioProducts: [...prev.food.bioProducts, customValue]
                },
                customBioProduct: ''
            }));
        }
    };

    const toggleRentCarArray = (arrayName, item) => {
        setRentCarData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].includes(item)
                ? prev[arrayName].filter(i => i !== item)
                : [...prev[arrayName], item]
        }));
    };

    const toggleRentCarNestedArray = (parent, arrayName, item) => {
        setRentCarData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [arrayName]: prev[parent][arrayName].includes(item)
                    ? prev[parent][arrayName].filter(i => i !== item)
                    : [...prev[parent][arrayName], item]
            }
        }));
    };

    const addCustomRentCarItem = (arrayName, customFieldName) => {
        const customValue = rentCarData[customFieldName]?.trim();
        if (customValue && !rentCarData[arrayName].includes(customValue)) {
            setRentCarData(prev => ({
                ...prev,
                [arrayName]: [...prev[arrayName], customValue],
                [customFieldName]: ''
            }));
        }
    };

    const addCustomRentCarNestedItem = (parent, arrayName, customFieldName) => {
        const customValue = rentCarData[customFieldName]?.trim();
        if (customValue && !rentCarData[parent][arrayName].includes(customValue)) {
            setRentCarData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [arrayName]: [...prev[parent][arrayName], customValue]
                },
                [customFieldName]: ''
            }));
        }
    };

    const removeItineraryDay = (index) => {
        setTourData(prev => {
            const newItinerary = prev.itinerary.filter((_, i) => i !== index);
            // Re-index days
            return {
                ...prev,
                itinerary: newItinerary.map((item, i) => ({ ...item, day: i + 1 }))
            };
        });
    };

    const removeExistingImage = (index) => {
        setExistingGallery(prev => prev.filter((_, i) => i !== index));
    };

    const handleNewGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        setNewGalleryFiles(prev => [...prev, ...files]);
    };

    const removeNewGalleryFile = (index) => {
        setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
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

        if (formData.type === 'bujtina') {
            data.append('bujtinaData', JSON.stringify(bujtinaData));
        }

        if (formData.type === 'rentcar') {
            data.append('rentCarData', JSON.stringify(rentCarData));
        }

        if (formData.type === 'tour') {
            data.append('tourData', JSON.stringify(tourData));
        }

        // Add Gallery Data
        data.append('remainingGallery', JSON.stringify(existingGallery));
        if (newGalleryFiles && newGalleryFiles.length > 0) {
            newGalleryFiles.forEach(file => {
                data.append('newGallery', file);
            });
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

                {/* Bujtina-Specific Fields */}
                {formData.type === 'bujtina' && (
                    <>
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Lloji i Akomodimit</h3>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Tipi</label>
                                <select className="input" value={bujtinaData.accommodationType} onChange={(e) => setBujtinaData({ ...bujtinaData, accommodationType: e.target.value })}>
                                    {BUJTINA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Stili</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                    {BUJTINA_STYLES.map(style => (
                                        <label key={style} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={bujtinaData.style.includes(style)} onChange={() => toggleBujtinaArray('style', style)} />
                                            <span>{style}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Dhoma & Akomodimi</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Numri i dhomave</label>
                                    <input type="number" className="input" value={bujtinaData.totalRooms} onChange={(e) => setBujtinaData({ ...bujtinaData, totalRooms: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Ushqimi</h3>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Mëngjes tradicional</label>
                                <input className="input" value={bujtinaData.food.breakfast} onChange={(e) => setBujtinaData({ ...bujtinaData, food: { ...bujtinaData.food, breakfast: e.target.value } })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Produkte bio</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                    {BIO_PRODUCTS.map(prod => (
                                        <label key={prod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={bujtinaData.food.bioProducts.includes(prod)} onChange={() => toggleBujtinaBio(prod)} />
                                            <span>{prod}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Rent Car Specific Fields */}
                {formData.type === 'rentcar' && (
                    <>
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Detajet e Makinës</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Marka & Modeli</label>
                                    <input className="input" value={rentCarData.brandModel} onChange={(e) => setRentCarData({ ...rentCarData, brandModel: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Viti</label>
                                    <input type="number" className="input" value={rentCarData.year} onChange={(e) => setRentCarData({ ...rentCarData, year: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Karburanti</label>
                                    <select className="input" value={rentCarData.fuelType} onChange={(e) => setRentCarData({ ...rentCarData, fuelType: e.target.value })}>
                                        <option value="">Select...</option>
                                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Transmetimi</label>
                                    <select className="input" value={rentCarData.transmission} onChange={(e) => setRentCarData({ ...rentCarData, transmission: e.target.value })}>
                                        <option value="">Select...</option>
                                        {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Çmimi & Përfshirjet</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Çmimi ditor</label>
                                    <input className="input" value={rentCarData.prices.daily} onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, daily: e.target.value } })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Depozita</label>
                                    <input className="input" value={rentCarData.prices.deposit} onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, deposit: e.target.value } })} />
                                </div>
                            </div>
                        </div>

                        {/* Shërbime Shtesë */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Shërbime Shtesë</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                {CAR_EXTRA_SERVICES.map(srv => (
                                    <label key={srv} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={rentCarData.extraServices.includes(srv)} onChange={() => toggleRentCarArray('extraServices', srv)} />
                                        <span>{srv}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Tour Specific Fields */}
                {formData.type === 'tour' && (
                    <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h3 style={{ marginBottom: '20px', color: '#a29bfe' }}>Tour Details</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Duration</label>
                                <input placeholder="e.g. 3 Days" className="input" value={tourData.duration} onChange={e => setTourData({ ...tourData, duration: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Country / Location</label>
                                <input placeholder="e.g. Albania" className="input" value={tourData.country} onChange={e => setTourData({ ...tourData, country: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Max Travelers</label>
                                <input type="number" placeholder="e.g. 15" className="input" value={tourData.maxTravelers} onChange={e => setTourData({ ...tourData, maxTravelers: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Price</label>
                                <input placeholder="e.g. 50 EUR / person" className="input" value={tourData.price} onChange={e => setTourData({ ...tourData, price: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Itinerary</label>
                            {tourData.itinerary.map((item, index) => (
                                <div key={index} style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa' }}>Day {item.day}</label>
                                        <button
                                            type="button"
                                            onClick={() => removeItineraryDay(index)}
                                            style={{ background: 'transparent', border: 'none', color: '#ff7675', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            Delete Day
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder={`Describe activities for Day ${item.day}...`}
                                        className="input"
                                        rows={3}
                                        value={item.content}
                                        onChange={(e) => updateItineraryDay(index, e.target.value)}
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addItineraryDay}
                                className="btn"
                                style={{ background: '#a29bfe', marginTop: '5px' }}
                            >
                                + Add Day
                            </button>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>✅ What is Included?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                                {TOUR_INCLUSIONS.map(inc => (
                                    <label key={inc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: tourData.inclusions.includes(inc) ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: tourData.inclusions.includes(inc) ? '1px solid #2ecc71' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                                        <input type="checkbox" checked={tourData.inclusions.includes(inc)} onChange={() => toggleTourInclusion(inc)} style={{ cursor: 'pointer' }} />
                                        <span style={{ fontSize: '0.9rem' }}>{inc}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input placeholder="Write something included..." className="input" value={tourData.customInclusion} onChange={e => setTourData({ ...tourData, customInclusion: e.target.value })} style={{ margin: 0 }} />
                                <button type="button" onClick={addCustomTourInclusion} className="btn" style={{ whiteSpace: 'nowrap', background: '#2ecc71', color: '#fff' }}>+ Add</button>
                            </div>
                            {tourData.inclusions.filter(inc => !TOUR_INCLUSIONS.includes(inc)).length > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {tourData.inclusions.filter(inc => !TOUR_INCLUSIONS.includes(inc)).map((inc, idx) => (
                                        <span key={idx} className="badge" style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ✅ {inc}
                                            <button type="button" onClick={() => toggleTourInclusion(inc)} style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer', fontSize: '1.1rem', padding: '0' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Exclusions */}
                        <div style={{ marginTop: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>❌ What is Excluded?</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input placeholder="Write something excluded (e.g. Flights)" className="input" value={tourData.customExclusion || ''} onChange={e => setTourData({ ...tourData, customExclusion: e.target.value })} style={{ margin: 0 }} />
                                <button type="button" onClick={() => {
                                    if (tourData.customExclusion?.trim()) {
                                        setTourData({ ...tourData, exclusions: [...(tourData.exclusions || []), tourData.customExclusion.trim()], customExclusion: '' });
                                    }
                                }} className="btn" style={{ whiteSpace: 'nowrap', background: '#e74c3c', color: '#fff' }}>+ Add</button>
                            </div>
                            {tourData.exclusions?.length > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {tourData.exclusions.map((exc, idx) => (
                                        <span key={idx} className="badge" style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ❌ {exc}
                                            <button type="button" onClick={() => setTourData({ ...tourData, exclusions: tourData.exclusions.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.1rem', padding: '0' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pricing Calculator Setup */}
                        <div style={{ marginTop: '25px', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(162, 155, 254, 0.2)' }}>
                            <h4 style={{ marginBottom: '20px', color: '#a29bfe', fontSize: '1.2rem' }}>💰 Pricing Calculator Configuration</h4>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '20px' }}>Set your prices here. Use the same currency as your Primary Price (e.g. $, €, or LEK).</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Adult Price</label>
                                    <input type="number" placeholder="150" className="input" value={tourData.pricing?.adultPrice} onChange={e => setTourData({ ...tourData, pricing: { ...tourData.pricing, adultPrice: Number(e.target.value) } })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Child Price</label>
                                    <input type="number" placeholder="75" className="input" value={tourData.pricing?.childPrice} onChange={e => setTourData({ ...tourData, pricing: { ...tourData.pricing, childPrice: Number(e.target.value) } })} />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                                    <input type="checkbox" checked={tourData.pricing?.isGroupWise} onChange={e => setTourData({ ...tourData, pricing: { ...tourData.pricing, isGroupWise: e.target.checked } })} style={{ width: '20px', height: '20px' }} />
                                    <span>Enable Fixed Group Price Option</span>
                                </label>
                                {tourData.pricing?.isGroupWise && (
                                    <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Fixed Group Price</label>
                                        <input type="number" placeholder="1000" className="input" value={tourData.pricing?.fixedPrice} onChange={e => setTourData({ ...tourData, pricing: { ...tourData.pricing, fixedPrice: Number(e.target.value) } })} />
                                    </div>
                                )}
                            </div>

                            {/* Custom Extras Section */}
                            <div style={{ marginTop: '30px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <h5 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>✨ Manage Booking Extras</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', marginBottom: '15px' }}>
                                    <input
                                        placeholder="Extra name (e.g. Lunch)"
                                        className="input"
                                        value={tourData.customExtraName}
                                        onChange={e => setTourData({ ...tourData, customExtraName: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        className="input"
                                        value={tourData.customExtraPrice}
                                        onChange={e => setTourData({ ...tourData, customExtraPrice: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (tourData.customExtraName && tourData.customExtraPrice) {
                                                setTourData({
                                                    ...tourData,
                                                    extras: [...(tourData.extras || []), { name: tourData.customExtraName, price: Number(tourData.customExtraPrice) }],
                                                    customExtraName: '',
                                                    customExtraPrice: ''
                                                });
                                            }
                                        }}
                                        className="btn"
                                    >
                                        Add
                                    </button>
                                </div>

                                {tourData.extras?.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {tourData.extras.map((extra, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                                <span>{extra.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{ color: '#a29bfe', fontWeight: 'bold' }}>+{extra.price}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTourData({ ...tourData, extras: tourData.extras.filter((_, i) => i !== idx) })}
                                                        style={{ background: 'none', border: 'none', color: '#ff7675', cursor: 'pointer' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>WhatsApp Number for Bookings (Include prefix, e.g. +355...)</label>
                            <input placeholder="e.g. +355 69 00 00 000" className="input" value={tourData.whatsappNumber} onChange={e => setTourData({ ...tourData, whatsappNumber: e.target.value })} />
                        </div>

                        {/* Gallery Management for Tours */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#a29bfe' }}>Gallery Management</h3>

                            {/* Existing Images */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Existing Images:</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                                    {existingGallery.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ff7675',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '16px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {existingGallery.length === 0 && (
                                        <p style={{ color: '#666', fontSize: '0.9rem' }}>No images in gallery.</p>
                                    )}
                                </div>
                            </div>

                            {/* New Uploads */}
                            <div>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Add New Images:</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="input"
                                    onChange={handleNewGalleryUpload}
                                    style={{ marginBottom: '10px' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                                    {newGalleryFiles.map((file, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '100%',
                                                height: '100px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                overflow: 'hidden',
                                                padding: '5px',
                                                textAlign: 'center',
                                                border: '1px dashed rgba(255,255,255,0.2)'
                                            }}>
                                                <span style={{ fontSize: '20px', marginBottom: '5px' }}>📄</span>
                                                <span style={{ wordBreak: 'break-all' }}>{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewGalleryFile(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ff7675',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '16px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Services (for non-hotel, non-bujtina, non-rentcar, non-tour types) */}
                {formData.type !== 'hotel' && formData.type !== 'bujtina' && formData.type !== 'rentcar' && formData.type !== 'tour' && (
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
                    <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Change Main Image (Optional):</label>
                    {formData.currentImage && <div style={{ marginBottom: '10px' }}><img src={formData.currentImage} alt="Current" style={{ height: '100px', borderRadius: '8px' }} /></div>}
                    <input
                        type="file"
                        accept="image/*"
                        className="input"
                        onChange={(e) => setImageFile(e.target.files[0])}
                    />
                </div>

                {/* Removed Global Lat/Lng Fields */}

                <button type="submit" className="btn">Update Listing</button>
            </form>
        </div>
    );
}
