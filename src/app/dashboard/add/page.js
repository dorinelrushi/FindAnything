'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

// Bujtina-specific options
const BUJTINA_TYPES = ['Bujtinë', 'Guesthouse', 'Agroturizëm'];
const BUJTINA_STYLES = ['Tradicional', 'Rustik', 'Familjar'];
const BUJTINA_ROOM_TYPES = ['Double', 'Triple', 'Family Room'];
const BUJTINA_AMENITIES = ['Ngrohje', 'Banjo private', 'Wi-Fi', 'Oxhak (opsionale)'];
const BUJTINA_FACILITIES = ['Parkim falas', 'Ambient i jashtëm', 'Zjarr/oxhak', 'Guides lokale (opsionale)'];
const BIO_PRODUCTS = ['Djathë', 'Qumësht', 'Reçel', 'Bukë shtëpie'];

// Rent Car specific options
const CAR_CATEGORIES = ['Ekonomike', 'Kompakte', 'SUV', 'Luksoze', '4x4', 'Furgon'];
const FUEL_TYPES = ['Naftë', 'Benzinë', 'Elektrike', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatik'];
const CAR_INCLUSIONS = ['Siguracion bazë', 'Kilometra pa limit', 'Asistencë rrugore'];
const REQUIRED_DOCS = ['ID / Pasaportë', 'Patentë'];
const CAR_PAYMENT_METHODS = ['Cash', 'Kartë', 'Transfertë Bankare'];
const CAR_EXTRA_SERVICES = ['GPS', 'Karrige për fëmijë', 'Shofer privat', 'Dorëzim jashtë qytetit'];



function AddListingForm() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        lat: '40.6186',
        lng: '20.7808',
        category: '',
        customCategory: '',
    });
    const [imageFile, setImageFile] = useState(null);
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
        // Custom fields inputs
        customCategory: '',
        customInclusion: '',
        customDocument: '',
        customPayment: '',
        customExtraService: ''
    });



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
        if (!token) {
            alert('Ju lutem hyni përsëri në llogari (Token missing)');
            router.push('/login');
            return;
        }

        // Determine final category
        const finalCategory = formData.category === 'custom' ? formData.customCategory : formData.category;

        // Create FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('address', formData.address);
        data.append('type', type);
        data.append('lat', formData.lat);
        data.append('lng', formData.lng);
        if (finalCategory) {
            data.append('category', finalCategory);
        }
        data.append('services', JSON.stringify(selectedServices));

        // Add hotel-specific data if type is hotel
        if (type === 'hotel') {
            data.append('hotelData', JSON.stringify(hotelData));
        }

        // Add bar-specific data if type is bar
        if (type === 'bar') {
            // Include main category in barData for completeness
            const barDataToSave = {
                ...barData,
                category: finalCategory
            };
            data.append('barData', JSON.stringify(barDataToSave));
        }

        // Add bujtina-specific data if type is bujtina
        if (type === 'bujtina') {
            data.append('bujtinaData', JSON.stringify(bujtinaData));
        }

        // Add rentcar-specific data if type is rentcar
        if (type === 'rentcar') {
            data.append('rentCarData', JSON.stringify(rentCarData));
        }

        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const res = await fetch('/api/listings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data,
            });

            if (res.ok) {
                alert('Listing created successfully!');
                router.push('/dashboard');
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to create listing');
            }
        } catch (err) {
            alert('Error creating listing');
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

    // Bujtina-specific helper functions
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

    // Rent Car specific helper functions
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

    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';



    const availableCategories = CATEGORIES[type] || [];

    return (
        <div className="glass card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Add {capitalize(type)}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Name *</label>
                    <input name="title" placeholder="Business Name" className="input" onChange={handleChange} required />
                </div>

                {/* Category Selection */}
                {availableCategories.length > 0 && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Category</label>
                        <select
                            name="category"
                            className="input"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Select a category...</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">+ Add Custom Category</option>
                        </select>

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
                {type === 'hotel' && (
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
                {type === 'bar' && (
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
                {type === 'bujtina' && (
                    <>
                        {/* Lloji i Akomodimit */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Lloji i Akomodimit</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Tipi</label>
                                <select
                                    className="input"
                                    value={bujtinaData.accommodationType}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, accommodationType: e.target.value })}
                                >
                                    {BUJTINA_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Stili</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {BUJTINA_STYLES.map(style => (
                                        <label key={style} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={bujtinaData.style.includes(style)}
                                                onChange={() => toggleBujtinaArray('style', style)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{style}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom style..."
                                        className="input"
                                        value={bujtinaData.customStyle}
                                        onChange={(e) => setBujtinaData({ ...bujtinaData, customStyle: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomBujtinaItem('style', 'customStyle')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#6ab04c' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {bujtinaData.style.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {bujtinaData.style.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(106, 176, 76, 0.2)', border: '1px solid #6ab04c', color: '#6ab04c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleBujtinaArray('style', item)} style={{ background: 'none', border: 'none', color: '#6ab04c', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dhoma & Akomodimi */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>5. Dhoma & Akomodimi</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Numri i dhomave</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 6"
                                    className="input"
                                    value={bujtinaData.totalRooms}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, totalRooms: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Llojet e dhomave</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {BUJTINA_ROOM_TYPES.map(type => (
                                        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={bujtinaData.roomTypes.includes(type)}
                                                onChange={() => toggleBujtinaArray('roomTypes', type)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom room type..."
                                        className="input"
                                        value={bujtinaData.customRoomType}
                                        onChange={(e) => setBujtinaData({ ...bujtinaData, customRoomType: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomBujtinaItem('roomTypes', 'customRoomType')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#6ab04c' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {bujtinaData.roomTypes.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {bujtinaData.roomTypes.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(106, 176, 76, 0.2)', border: '1px solid #6ab04c', color: '#6ab04c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleBujtinaArray('roomTypes', item)} style={{ background: 'none', border: 'none', color: '#6ab04c', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Pajisjet në dhomë</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {BUJTINA_AMENITIES.map(amenity => (
                                        <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={bujtinaData.roomAmenities.includes(amenity)}
                                                onChange={() => toggleBujtinaArray('roomAmenities', amenity)}
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
                                        value={bujtinaData.customAmenity}
                                        onChange={(e) => setBujtinaData({ ...bujtinaData, customAmenity: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomBujtinaItem('roomAmenities', 'customAmenity')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#6ab04c' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {bujtinaData.roomAmenities.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {bujtinaData.roomAmenities.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(106, 176, 76, 0.2)', border: '1px solid #6ab04c', color: '#6ab04c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleBujtinaArray('roomAmenities', item)} style={{ background: 'none', border: 'none', color: '#6ab04c', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shërbime & Facilitetet */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Shërbime & Facilitetet</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                {BUJTINA_FACILITIES.map(fac => (
                                    <label key={fac} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={bujtinaData.facilities.includes(fac)}
                                            onChange={() => toggleBujtinaArray('facilities', fac)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span>{fac}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    placeholder="Add custom facility..."
                                    className="input"
                                    value={bujtinaData.customFacility}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, customFacility: e.target.value })}
                                    style={{ margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addCustomBujtinaItem('facilities', 'customFacility')}
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap', background: '#6ab04c' }}
                                >
                                    + Add
                                </button>
                            </div>
                            {bujtinaData.facilities.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {bujtinaData.facilities.map(item => (
                                        <span key={item} className="badge" style={{ background: 'rgba(106, 176, 76, 0.2)', border: '1px solid #6ab04c', color: '#6ab04c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {item}
                                            <button type="button" onClick={() => toggleBujtinaArray('facilities', item)} style={{ background: 'none', border: 'none', color: '#6ab04c', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ushqimi */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Ushqimi (shumë e rëndësishme)</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Mëngjes tradicional</label>
                                <input
                                    className="input"
                                    value={bujtinaData.food.breakfast}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, food: { ...bujtinaData.food, breakfast: e.target.value } })}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Drekë / Darkë</label>
                                <input
                                    className="input"
                                    value={bujtinaData.food.meals}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, food: { ...bujtinaData.food, meals: e.target.value } })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Produkte bio</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                    {BIO_PRODUCTS.map(prod => (
                                        <label key={prod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={bujtinaData.food.bioProducts.includes(prod)}
                                                onChange={() => toggleBujtinaBio(prod)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>{prod}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom bio product..."
                                        className="input"
                                        value={bujtinaData.customBioProduct}
                                        onChange={(e) => setBujtinaData({ ...bujtinaData, customBioProduct: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomBujtinaBio}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#6ab04c' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {bujtinaData.food.bioProducts.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {bujtinaData.food.bioProducts.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(106, 176, 76, 0.2)', border: '1px solid #6ab04c', color: '#6ab04c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleBujtinaBio(item)} style={{ background: 'none', border: 'none', color: '#6ab04c', cursor: 'pointer', padding: '0 2px', fontSize: '1rem' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}



                {/* Rent Car Specific Fields */}
                {type === 'rentcar' && (
                    <>
                        {/* Detajet e Makinës */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Detajet e Makinës</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Marka & Modeli</label>
                                    <input
                                        placeholder="e.g. Volkswagen Golf"
                                        className="input"
                                        value={rentCarData.brandModel}
                                        onChange={(e) => setRentCarData({ ...rentCarData, brandModel: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Viti i prodhimit</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 2018"
                                        className="input"
                                        value={rentCarData.year}
                                        onChange={(e) => setRentCarData({ ...rentCarData, year: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Kategoria</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                                    {CAR_CATEGORIES.map(cat => (
                                        <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={rentCarData.category.includes(cat)}
                                                onChange={() => toggleRentCarArray('category', cat)}
                                            />
                                            <span>{cat}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom category..."
                                        className="input"
                                        value={rentCarData.customCategory}
                                        onChange={(e) => setRentCarData({ ...rentCarData, customCategory: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomRentCarItem('category', 'customCategory')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#ff9f43' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {rentCarData.category.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {rentCarData.category.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(255, 159, 67, 0.2)', border: '1px solid #ff9f43', color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleRentCarArray('category', item)} style={{ background: 'none', border: 'none', color: '#ff9f43', cursor: 'pointer', padding: '0 2px' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Karburanti</label>
                                    <select
                                        className="input"
                                        value={rentCarData.fuelType}
                                        onChange={(e) => setRentCarData({ ...rentCarData, fuelType: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Transmetimi</label>
                                    <select
                                        className="input"
                                        value={rentCarData.transmission}
                                        onChange={(e) => setRentCarData({ ...rentCarData, transmission: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Numri i vendeve</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={rentCarData.seats}
                                        onChange={(e) => setRentCarData({ ...rentCarData, seats: e.target.value })}
                                        placeholder="5"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Konsumi (L/100km)</label>
                                    <input
                                        className="input"
                                        value={rentCarData.fuelConsumption}
                                        onChange={(e) => setRentCarData({ ...rentCarData, fuelConsumption: e.target.value })}
                                        placeholder="5.5L"
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={rentCarData.airConditioning}
                                    onChange={(e) => setRentCarData({ ...rentCarData, airConditioning: e.target.checked })}
                                />
                                <span>Kondicioner (AC)</span>
                            </label>
                        </div>

                        {/* Çmimi & Përfshirjet */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Çmimi & Përfshirjet</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Çmimi ditor (nga)</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.daily}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, daily: e.target.value } })}
                                        placeholder="30 € / ditë"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Çmime javore / mujore</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.weekly}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, weekly: e.target.value } })}
                                        placeholder="180 € / javë"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Depozita (Garancia)</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.deposit}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, deposit: e.target.value } })}
                                        placeholder="200 €"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Çfarë përfshihet</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                    {CAR_INCLUSIONS.map(inc => (
                                        <label key={inc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={rentCarData.prices.inclusions.includes(inc)}
                                                onChange={() => toggleRentCarNestedArray('prices', 'inclusions', inc)}
                                            />
                                            <span>{inc}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom inclusion..."
                                        className="input"
                                        value={rentCarData.customInclusion}
                                        onChange={(e) => setRentCarData({ ...rentCarData, customInclusion: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomRentCarNestedItem('prices', 'inclusions', 'customInclusion')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#ff9f43' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {rentCarData.prices.inclusions.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {rentCarData.prices.inclusions.map(item => (
                                            <span key={item} className="badge" style={{ background: 'rgba(255, 159, 67, 0.2)', border: '1px solid #ff9f43', color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {item}
                                                <button type="button" onClick={() => toggleRentCarNestedArray('prices', 'inclusions', item)} style={{ background: 'none', border: 'none', color: '#ff9f43', cursor: 'pointer', padding: '0 2px' }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kushtet dhe Disponueshmëria */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Kushtet & Disponueshmëria</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Mosha minimale</label>
                                    <input
                                        className="input"
                                        value={rentCarData.conditions.minAge}
                                        onChange={(e) => setRentCarData({ ...rentCarData, conditions: { ...rentCarData.conditions, minAge: e.target.value } })}
                                        placeholder="e.g. 21 vjeç"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Eksperiencë patente</label>
                                    <input
                                        className="input"
                                        value={rentCarData.conditions.licenseExperience}
                                        onChange={(e) => setRentCarData({ ...rentCarData, conditions: { ...rentCarData.conditions, licenseExperience: e.target.value } })}
                                        placeholder="e.g. 2 vite"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Dokumente të nevojshme</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                    {REQUIRED_DOCS.map(doc => (
                                        <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={rentCarData.conditions.requiredDocuments.includes(doc)}
                                                onChange={() => toggleRentCarNestedArray('conditions', 'requiredDocuments', doc)}
                                            />
                                            <span>{doc}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        placeholder="Add custom document..."
                                        className="input"
                                        value={rentCarData.customDocument}
                                        onChange={(e) => setRentCarData({ ...rentCarData, customDocument: e.target.value })}
                                        style={{ margin: 0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCustomRentCarNestedItem('conditions', 'requiredDocuments', 'customDocument')}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', background: '#ff9f43' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Metodat e Pagesës</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                    {CAR_PAYMENT_METHODS.map(pay => (
                                        <label key={pay} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={rentCarData.conditions.paymentMethods.includes(pay)}
                                                onChange={() => toggleRentCarNestedArray('conditions', 'paymentMethods', pay)}
                                            />
                                            <span>{pay}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Statusi</label>
                                    <select
                                        className="input"
                                        value={rentCarData.availability.status}
                                        onChange={(e) => setRentCarData({ ...rentCarData, availability: { ...rentCarData.availability, status: e.target.value } })}
                                    >
                                        <option value="E lirë">E lirë</option>
                                        <option value="E rezervuar">E rezervuar</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Datat e rezervimit / qirasë</label>
                                    <input
                                        className="input"
                                        value={rentCarData.availability.dates}
                                        onChange={(e) => setRentCarData({ ...rentCarData, availability: { ...rentCarData.availability, dates: e.target.value } })}
                                        placeholder="e.g. 15 Jan - 20 Jan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shërbime Shtesë */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Shërbime Shtesë</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                {CAR_EXTRA_SERVICES.map(srv => (
                                    <label key={srv} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={rentCarData.extraServices.includes(srv)}
                                            onChange={() => toggleRentCarArray('extraServices', srv)}
                                        />
                                        <span>{srv}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    placeholder="Add custom extra service..."
                                    className="input"
                                    value={rentCarData.customExtraService}
                                    onChange={(e) => setRentCarData({ ...rentCarData, customExtraService: e.target.value })}
                                    style={{ margin: 0 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addCustomRentCarItem('extraServices', 'customExtraService')}
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap', background: '#ff9f43' }}
                                >
                                    + Add
                                </button>
                            </div>
                            {rentCarData.extraServices.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {rentCarData.extraServices.map(item => (
                                        <span key={item} className="badge" style={{ background: 'rgba(255, 159, 67, 0.2)', border: '1px solid #ff9f43', color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {item}
                                            <button type="button" onClick={() => toggleRentCarArray('extraServices', item)} style={{ background: 'none', border: 'none', color: '#ff9f43', cursor: 'pointer', padding: '0 2px' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Services (for non-hotel, non-bujtina, non-rentcar types) */}
                {type !== 'hotel' && type !== 'bujtina' && type !== 'rentcar' && (
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
                                style={{ margin: 0 }}
                            />
                            <button
                                type="button"
                                onClick={addCustomService}
                                className="btn"
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                + Add
                            </button>
                        </div>

                        {selectedServices.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedServices.map(service => (
                                    <span
                                        key={service}
                                        style={{
                                            background: 'var(--primary)',
                                            padding: '5px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        {service}
                                        <button
                                            type="button"
                                            onClick={() => toggleService(service)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                padding: '0 5px'
                                            }}
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
                    <input name="address" placeholder="Address (Optional if Lat/Lng provided)" className="input" onChange={handleChange} style={{ flex: 1 }} />
                    <button type="button" onClick={handleAddressSearch} className="btn" style={{ background: 'var(--accent)', whiteSpace: 'nowrap' }}>Locate on Map</button>
                </div>

                <div>
                    <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Upload Image: *</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="input"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        required
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

                <button type="submit" className="btn">Upload Listing</button>
            </form>
        </div>
    );
}

export default function AddListingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddListingForm />
        </Suspense>
    );
}
