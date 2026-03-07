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
    rentcar: ['Economy', 'Luxury', 'SUV', 'Electric', 'Family'],
    tour: ['Day Trip', 'Multi-day Tour', 'Adventure', 'Cultural', 'Walking Tour', 'Food Tour', 'Hiking']
};

// Predefined services (for non-hotel types)
const SERVICES = [
    'Free Wi-Fi',
    'Parking',
    'Reservations',
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
const ROOM_AMENITIES = ['Free Wi-Fi', 'TV', 'Air Conditioning', 'Mini-bar', 'Private Bathroom', 'Balcony'];
const GENERAL_SERVICES = ['24/7 Reception', 'Free Wi-Fi', 'Free Parking', 'Breakfast Included', 'Room Service', 'Bar / Restaurant'];
const ADDITIONAL_SERVICES = ['Airport Transfer', 'Laundry', 'Event Organization'];

// Bar-specific options
const BAR_ATMOSPHERE = ['Relax', 'Modern', 'Traditional', 'Romantic', 'Nightlife'];
const BAR_SERVICES = ['Free Wi-Fi', 'Outdoor Terrace', 'Live Music / DJ', 'Themed Events', 'Reservations', 'Card Payments'];
const SUITABLE_FOR = ['Couples', 'Groups', 'Tourists'];

// Bujtina-specific options
const BUJTINA_TYPES = ['Guesthouse', 'Farmhouse', 'Agritourism'];
const BUJTINA_STYLES = ['Traditional', 'Rustic', 'Family-run'];
const BUJTINA_ROOM_TYPES = ['Double', 'Triple', 'Family Room'];
const BUJTINA_AMENITIES = ['Heating', 'Private Bathroom', 'Wi-Fi', 'Fireplace (optional)'];
const BUJTINA_FACILITIES = ['Free Parking', 'Outdoor Area', 'Fireplace', 'Local Guides (optional)'];
const BIO_PRODUCTS = ['Cheese', 'Milk', 'Jam', 'Homemade Bread'];

// Rent Car specific options
const CAR_CATEGORIES = ['Economy', 'Compact', 'SUV', 'Luxury', '4x4', 'Van'];
const FUEL_TYPES = ['Diesel', 'Gasoline', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const CAR_INCLUSIONS = ['Basic Insurance', 'Unlimited Miles', 'Roadside Assistance'];
const REQUIRED_DOCS = ['ID / Passport', 'Driving Licence'];
const CAR_PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer'];
const CAR_EXTRA_SERVICES = ['Child Seat', 'GPS / Navigation', 'Additional Driver', 'Full Kasko Insurance'];
// Tour specific options
const TOUR_INCLUSIONS = ['Transport', 'Lunch', 'Dinner', 'Guide', 'Entrance Fees', 'Hotel Pickup'];

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
        city: '',
        country: '',
        whatsappNumber: '',
    });
    const [availableCategories, setAvailableCategories] = useState([]);

    useEffect(() => {
        if (type) {
            fetch(`/api/categories?type=${type}`)
                .then(res => res.json())
                .then(data => {
                    if (data.categories) setAvailableCategories(data.categories);
                });
        }
    }, [type]);

    const [imageFile, setImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]); // Multiple files for gallery
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
            cancellation: 'Free cancellation up to 24h before arrival',
            children: 'Welcome',
            pets: 'Not allowed',
            payment: 'Cash / Card'
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
        accommodationType: 'Guesthouse',
        style: [],
        totalRooms: '',
        roomTypes: [],
        roomAmenities: [],
        facilities: [],
        food: {
            breakfast: 'Yes (homemade products)',
            meals: 'Traditional local food',
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
            status: 'Available',
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

    // Tour specific state
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

        if (formData.category === 'custom' && formData.customCategory) {
            // Save category to DB
            try {
                await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, name: formData.customCategory })
                });
            } catch (err) {
                console.error('Failed to save custom category', err);
            }
        }

        // Create FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('address', formData.address);
        data.append('type', type);
        data.append('lat', formData.lat);
        data.append('lng', formData.lng);
        data.append('city', formData.city);
        data.append('country', formData.country);
        data.append('whatsappNumber', formData.whatsappNumber);
        if (finalCategory) {
            data.append('category', finalCategory);
        }
        data.append('services', JSON.stringify(selectedServices));

        if (type === 'hotel') data.append('hotelData', JSON.stringify(hotelData));
        if (type === 'bar') {
            const barDataToSave = { ...barData, category: finalCategory };
            data.append('barData', JSON.stringify(barDataToSave));
        }
        if (type === 'bujtina') data.append('bujtinaData', JSON.stringify(bujtinaData));
        if (type === 'rentcar') data.append('rentCarData', JSON.stringify(rentCarData));
        if (type === 'tour') data.append('tourData', JSON.stringify(tourData));

        if (imageFile) data.append('image', imageFile);

        // Append Gallery Files
        if (galleryFiles.length > 0) {
            for (let i = 0; i < galleryFiles.length; i++) {
                data.append('gallery', galleryFiles[i]);
            }
        }

        try {
            const res = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
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

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const toggleService = (service) => {
        setSelectedServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
    };

    const addCustomService = () => {
        if (customService.trim() && !selectedServices.includes(customService.trim())) {
            setSelectedServices([...selectedServices, customService.trim()]);
            setCustomService('');
        }
    };

    // Helper functions for Hotel, Bar, Bujtina, RentCar (omitted for brevity, assume they exist or use previous implementation)
    // ... (Keep existing helpers) ...

    // --- RE-ADD HELPERS TO ENSURE THEY EXIST (Prev block replacement might have cut them off) ---
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
        setHotelData(prev => ({ ...prev, policies: { ...prev.policies, [policyName]: value } }));
    };

    const toggleBarArray = (arrayName, item) => {
        setBarData(prev => ({ ...prev, [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item] }));
    };

    const toggleBarRuleArray = (arrayName, item) => {
        setBarData(prev => ({ ...prev, rules: { ...prev.rules, [arrayName]: prev.rules[arrayName].includes(item) ? prev.rules[arrayName].filter(i => i !== item) : [...prev.rules[arrayName], item] } }));
    };

    const updateBarFeature = (featureName, value) => {
        setBarData(prev => ({ ...prev, features: { ...prev.features, [featureName]: value } }));
    };

    const updateBarRule = (ruleName, value) => {
        setBarData(prev => ({ ...prev, rules: { ...prev.rules, [ruleName]: value } }));
    };

    const addCustomBarItem = (arrayName, customFieldName) => {
        const customValue = barData[customFieldName]?.trim();
        if (customValue && !barData[arrayName].includes(customValue)) {
            setBarData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], customValue], [customFieldName]: '' }));
        }
    };

    const addCustomBarRuleItem = (arrayName, customFieldName) => {
        const customValue = barData[customFieldName]?.trim();
        if (customValue && !barData.rules[arrayName].includes(customValue)) {
            setBarData(prev => ({ ...prev, rules: { ...prev.rules, [arrayName]: [...prev.rules[arrayName], customValue] }, [customFieldName]: '' }));
        }
    };

    const toggleBujtinaArray = (arrayName, item) => {
        setBujtinaData(prev => ({ ...prev, [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item] }));
    };

    const toggleBujtinaBio = (item) => {
        setBujtinaData(prev => ({ ...prev, food: { ...prev.food, bioProducts: prev.food.bioProducts.includes(item) ? prev.food.bioProducts.filter(i => i !== item) : [...prev.food.bioProducts, item] } }));
    };

    const addCustomBujtinaItem = (arrayName, customFieldName) => {
        const customValue = bujtinaData[customFieldName]?.trim();
        if (customValue && !bujtinaData[arrayName].includes(customValue)) {
            setBujtinaData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], customValue], [customFieldName]: '' }));
        }
    };

    const addCustomBujtinaBio = () => {
        const customValue = bujtinaData.customBioProduct?.trim();
        if (customValue && !bujtinaData.food.bioProducts.includes(customValue)) {
            setBujtinaData(prev => ({ ...prev, food: { ...prev.food, bioProducts: [...prev.food.bioProducts, customValue] }, customBioProduct: '' }));
        }
    };

    const toggleRentCarArray = (arrayName, item) => {
        setRentCarData(prev => ({ ...prev, [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item] }));
    };

    const toggleRentCarNestedArray = (parent, arrayName, item) => {
        setRentCarData(prev => ({ ...prev, [parent]: { ...prev[parent], [arrayName]: prev[parent][arrayName].includes(item) ? prev[parent][arrayName].filter(i => i !== item) : [...prev[parent][arrayName], item] } }));
    };

    const addCustomRentCarItem = (arrayName, customFieldName) => {
        const customValue = rentCarData[customFieldName]?.trim();
        if (customValue && !rentCarData[arrayName].includes(customValue)) {
            setRentCarData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], customValue], [customFieldName]: '' }));
        }
    };

    const addCustomRentCarNestedItem = (parent, arrayName, customFieldName) => {
        const customValue = rentCarData[customFieldName]?.trim();
        if (customValue && !rentCarData[parent][arrayName].includes(customValue)) {
            setRentCarData(prev => ({ ...prev, [parent]: { ...prev[parent], [arrayName]: [...prev[parent][arrayName], customValue] }, [customFieldName]: '' }));
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

    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    return (
        <div className="glass card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Add {capitalize(type)}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Name</label>
                    <input name="title" placeholder="Business Name" className="input" onChange={handleChange} />
                </div>

                {/* Main Image Upload */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Main Image</label>
                    <input type="file" onChange={(e) => setImageFile(e.target.files[0])} className="input" />
                </div>

                {/* Gallery Upload - For all listings */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Gallery (Select multiple photos)</label>
                    <input type="file" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files))} className="input" />
                    {galleryFiles.length > 0 && <p style={{ fontSize: '0.8rem', color: '#aaa' }}>{galleryFiles.length} files selected</p>}
                </div>

                {/* Category Selection */}
                {availableCategories.length > 0 && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Category</label>
                        <select name="category" className="input" value={formData.category} onChange={handleChange}>
                            <option value="">Select a category...</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">+ Add Custom Category</option>
                        </select>
                        {formData.category === 'custom' && (
                            <input name="customCategory" placeholder="Enter custom category" className="input" value={formData.customCategory} onChange={handleChange} style={{ marginTop: '10px' }} />
                        )}
                    </div>
                )}

                {/* Description */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Description</label>
                    <textarea name="description" placeholder="Describe your business..." className="input" value={formData.description} onChange={handleChange} rows={8} style={{ minHeight: '200px', resize: 'vertical' }} />
                </div>

                {/* Location Details & Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>City</label>
                        <input name="city" placeholder="e.g. Korça" className="input" value={formData.city} onChange={handleChange} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Country</label>
                        <input name="country" placeholder="e.g. Albania" className="input" value={formData.country} onChange={handleChange} />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Business WhatsApp Number</label>
                    <input name="whatsappNumber" placeholder="e.g. +355 69 00 00 000" className="input" value={formData.whatsappNumber} onChange={handleChange} />
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Include prefix (e.g. +355) so customers can message you easily.</p>
                </div>

                {/* Tour Specific Fields */}
                {type === 'tour' && (
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
                                <input placeholder="Write something excluded (e.g. Flights)" className="input" value={tourData.customExclusion} onChange={e => setTourData({ ...tourData, customExclusion: e.target.value })} style={{ margin: 0 }} />
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
                    </div>
                )}


                {/* Hotel-Specific Fields */}
                {type === 'hotel' && (
                    <>
                        {/* Dhoma & Akomodimi */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Rooms & Accommodation</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Numri total i dhomave</label>
                                <input
                                    type="number"
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

                        {/* Room Amenities */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Room Amenities</h3>
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

                        {/* Services & Facilities */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Services & Facilities</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>General Services</label>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Additional Services</label>
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

                        {/* Policies */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#fd79a8' }}>Policies</h3>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Cancellation Policy</label>
                                <input
                                    type="text"
                                    placeholder="Free cancellation up to 24h before arrival"
                                    className="input"
                                    value={hotelData.policies.cancellation}
                                    onChange={(e) => updateHotelPolicy('cancellation', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Children Policy</label>
                                <input
                                    type="text"
                                    placeholder="Welcome"
                                    className="input"
                                    value={hotelData.policies.children}
                                    onChange={(e) => updateHotelPolicy('children', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Pets Policy</label>
                                <input
                                    type="text"
                                    placeholder="Not allowed"
                                    className="input"
                                    value={hotelData.policies.pets}
                                    onChange={(e) => updateHotelPolicy('pets', e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Payment Methods</label>
                                <input
                                    type="text"
                                    placeholder="Cash / Card"
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
                        {/* Style / Atmosphere */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Style / Atmosphere</h3>
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

                        {/* Services & Facilities */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Services & Facilities</h3>
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

                        {/* Crowd & Rules */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#00d2d3' }}>Crowd & Rules</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Minimum Age</label>
                                <input
                                    placeholder="e.g. 18+"
                                    className="input"
                                    value={barData.rules.minAge}
                                    onChange={(e) => updateBarRule('minAge', e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Suitable for:</label>
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
                                    <span>📍 Open Late</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={barData.features.liveMusicTonight}
                                        onChange={(e) => updateBarFeature('liveMusicTonight', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>🎶 Live Music Tonight</span>
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
                        {/* Accommodation Type */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Accommodation Type</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Type</label>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Style</label>
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

                        {/* Rooms & Accommodation */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Rooms & Accommodation</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Number of Rooms</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={bujtinaData.totalRooms}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, totalRooms: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Room Types</label>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Room Amenities</label>
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

                        {/* Services & Facilities */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Services & Facilities</h3>
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

                        {/* Food */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#6ab04c' }}>Food & Dining</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Breakfast</label>
                                <input
                                    className="input"
                                    value={bujtinaData.food.breakfast}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, food: { ...bujtinaData.food, breakfast: e.target.value } })}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Lunch / Dinner</label>
                                <input
                                    className="input"
                                    value={bujtinaData.food.meals}
                                    onChange={(e) => setBujtinaData({ ...bujtinaData, food: { ...bujtinaData.food, meals: e.target.value } })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Bio / Organic Products</label>
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
                        {/* Car Details */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Car Details</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Brand & Model</label>
                                    <input
                                        placeholder="e.g. Volkswagen Golf"
                                        className="input"
                                        value={rentCarData.brandModel}
                                        onChange={(e) => setRentCarData({ ...rentCarData, brandModel: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Year of Manufacture</label>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Category</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Fuel Type</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Transmission</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Number of Seats</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={rentCarData.seats}
                                        onChange={(e) => setRentCarData({ ...rentCarData, seats: e.target.value })}
                                        placeholder="5"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Fuel Consumption (L/100km)</label>
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
                                <span>Air Conditioning (AC)</span>
                            </label>
                        </div>

                        {/* Price & Inclusions */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Price & Inclusions</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Daily Price (from)</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.daily}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, daily: e.target.value } })}
                                        placeholder="e.g. 30 € / day"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Weekly / Monthly Price</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.weekly}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, weekly: e.target.value } })}
                                        placeholder="e.g. 180 € / week"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Security Deposit</label>
                                    <input
                                        className="input"
                                        value={rentCarData.prices.deposit}
                                        onChange={(e) => setRentCarData({ ...rentCarData, prices: { ...rentCarData.prices, deposit: e.target.value } })}
                                        placeholder="200 €"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>What's Included</label>
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

                        {/* Terms & Availability */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Terms & Availability</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Minimum Age</label>
                                    <input
                                        className="input"
                                        value={rentCarData.conditions.minAge}
                                        onChange={(e) => setRentCarData({ ...rentCarData, conditions: { ...rentCarData.conditions, minAge: e.target.value } })}
                                        placeholder="e.g. 21 years old"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Driver's License Experience</label>
                                    <input
                                        className="input"
                                        value={rentCarData.conditions.licenseExperience}
                                        onChange={(e) => setRentCarData({ ...rentCarData, conditions: { ...rentCarData.conditions, licenseExperience: e.target.value } })}
                                        placeholder="e.g. 2 years"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Required Documents</label>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Payment Methods</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Status</label>
                                    <select
                                        className="input"
                                        value={rentCarData.availability.status}
                                        onChange={(e) => setRentCarData({ ...rentCarData, availability: { ...rentCarData.availability, status: e.target.value } })}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Reserved">Reserved</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Booking / Rental Dates</label>
                                    <input
                                        className="input"
                                        value={rentCarData.availability.dates}
                                        onChange={(e) => setRentCarData({ ...rentCarData, availability: { ...rentCarData.availability, dates: e.target.value } })}
                                        placeholder="e.g. 15 Jan - 20 Jan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Extra Services */}
                        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#ff9f43' }}>Extra Services</h3>
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

                {/* Services (for non-hotel, non-bujtina, non-rentcar, non-tour types) */}
                {type !== 'hotel' && type !== 'bujtina' && type !== 'rentcar' && type !== 'tour' && (
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

                {/* Main Image */}
                <div>
                    <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Upload Main Image: *</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="input"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        required={type !== 'tour'} // Make it optional for tours if they prefer gallery only, or just keep it required if you want consistency. Actually, better make it required for all for consistency in listing cards.
                    />
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
