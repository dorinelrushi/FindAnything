'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const formatDescription = (text) => {
    if (!text) return '';
    return text
        .replace(/\r?\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

export default function ListingPage({ params }) {
    const { slug, type } = use(params);

    const [listing, setListing] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('€');
    const [selectedImage, setSelectedImage] = useState(null);
    const [menu, setMenu] = useState(null);
    const [selectedTourDate, setSelectedTourDate] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [openItineraryDays, setOpenItineraryDays] = useState([1]);
    const [bookingType, setBookingType] = useState('person'); // person or group
    const [numAdults, setNumAdults] = useState(1);
    const [numChildren, setNumChildren] = useState(0);
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [promoCode, setPromoCode] = useState('');
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [priceBreakdown, setPriceBreakdown] = useState({
        adultTotal: 0,
        childTotal: 0,
        extrasTotal: 0,
        discountAmount: 0,
        isPrivateApplied: false
    });

    // Touch handlers for mobile gallery swipe
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEndEvent = () => {
        if (!touchStart || touchEnd === null) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const currentIndex = listing?.gallery?.indexOf(selectedImage);
            if (currentIndex > -1) {
                if (isLeftSwipe) {
                    // Swipe left -> Next image
                    const nextIndex = (currentIndex === listing.gallery.length - 1) ? 0 : currentIndex + 1;
                    setSelectedImage(listing.gallery[nextIndex]);
                } else {
                    // Swipe right -> Previous image
                    const prevIndex = (currentIndex <= 0) ? listing.gallery.length - 1 : currentIndex - 1;
                    setSelectedImage(listing.gallery[prevIndex]);
                }
            }
        }
    };

    useEffect(() => {
        if (listing?.tourData) {
            // Detect currency
            const priceStr = listing.tourData.price || '';
            if (priceStr.includes('$')) setCurrency('$');
            else if (priceStr.toLowerCase().includes('lek')) setCurrency('LEK');
            else setCurrency('€');

            const pricing = listing.tourData.pricing || {};
            let { adultPrice = 0, childPrice = 0, fixedPrice = 0, isGroupWise = false } = pricing;

            // Handle fallback to "Primary Price" field if pricing object is incomplete
            if (listing.tourData.price) {
                const match = listing.tourData.price.match(/(\d+(\.\d+)?)/);
                if (match) {
                    const parsedPrice = parseFloat(match[1]);
                    if (!isNaN(parsedPrice)) {
                        if (!adultPrice) adultPrice = parsedPrice;
                        if (!childPrice && !pricing.hasOwnProperty('childPrice')) childPrice = adultPrice * 0.5;
                    }
                }
            }

            // Extras data - Use business-defined extras if available
            const businessExtras = listing.tourData.extras || [];

            let extrasTotal = 0;
            (selectedExtras || []).forEach(name => {
                const extra = businessExtras.find(e => e.name === name);
                if (extra) {
                    extrasTotal += extra.price;
                }
            });

            let total = 0;
            let adultTotal = 0;
            let childTotal = 0;
            let isPrivateApplied = false;

            if (bookingType === 'group' && isGroupWise) {
                total = fixedPrice + extrasTotal;
            } else {
                adultTotal = numAdults * adultPrice;
                childTotal = numChildren * childPrice;
                total = adultTotal + childTotal + extrasTotal;

                if (isPrivate) {
                    const privateBase = (adultPrice * 2) + extrasTotal;
                    if (total < privateBase) {
                        total = privateBase;
                        isPrivateApplied = true;
                    }
                }
            }

            // Discount logic
            let discountAmount = 0;
            if (promoCode.toUpperCase() === 'WORLD10') {
                discountAmount = total * 0.1;
                total -= discountAmount;
            }

            setCalculatedPrice(total);
            setPriceBreakdown({
                adultTotal,
                childTotal,
                extrasTotal,
                discountAmount,
                isPrivateApplied,
                baseSubtotal: adultTotal + childTotal // Combined primary price
            });
        }
    }, [bookingType, numAdults, numChildren, listing, isPrivate, promoCode, selectedExtras]);

    useEffect(() => {
        fetchListing();
    }, [slug]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedImage || !listing?.gallery) return;
            const currentIndex = listing.gallery.indexOf(selectedImage);
            if (e.key === 'Escape') setSelectedImage(null);
            if (e.key === 'ArrowLeft') {
                const prevIndex = (currentIndex === 0) ? listing.gallery.length - 1 : currentIndex - 1;
                setSelectedImage(listing.gallery[prevIndex]);
            }
            if (e.key === 'ArrowRight') {
                const nextIndex = (currentIndex === listing.gallery.length - 1) ? 0 : currentIndex + 1;
                setSelectedImage(listing.gallery[nextIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, listing]);

    const fetchListing = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/listings/${slug}`);
            const data = await res.json();
            if (data.listing) {
                setListing(data.listing);
                fetchReviews(data.listing._id);
                fetchMenu(data.listing._id);
            }
        } catch (error) {
            console.error('Error fetching listing:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenu = async (listingId) => {
        try {
            const res = await fetch(`/api/menu?listingId=${listingId}`);
            const data = await res.json();
            setMenu(data.menu || null);
        } catch (error) {
            console.error('Failed to fetch menu');
            setMenu(null);
        }
    };

    const fetchReviews = async (listingId) => {
        try {
            const res = await fetch(`/api/reviews?listingId=${listingId}`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
                const total = data.reviews.reduce((acc, r) => acc + r.rating, 0);
                setAverageRating(data.reviews.length ? (total / data.reviews.length).toFixed(1) : 0);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('listingId', listing._id);
        formData.append('rating', newReview.rating);
        formData.append('comment', newReview.comment);
        if (newReview.image) {
            formData.append('image', newReview.image);
        }

        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (res.ok) {
            setNewReview({ rating: 5, comment: '', image: null });
            fetchReviews(listing._id);
        } else {
            alert('Failed to post review');
        }
    };

    const toggleDay = (day) => {
        setOpenItineraryDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    if (loading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
    if (!listing) return <div className="container" style={{ textAlign: "center", marginTop: "100px", padding: '100px' }}>Listing not found</div>;

    const isTour = listing.type === 'tour';

    return (
        <div className="container listing-container" style={{ paddingTop: '80px', paddingBottom: '100px' }}>
            {isTour && (
                <div className="tour-header" style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '15px', color: '#fff' }}>
                        {listing.title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', flexWrap: 'wrap' }}>
                        <span><span style={{ color: '#a29bfe' }}>📍</span> {listing.address}</span>
                        {(listing.city || listing.country) && (
                            <span><span style={{ color: '#a29bfe', marginLeft: '10px' }}>🌍</span> {listing.city}{listing.city && listing.country ? ', ' : ''}{listing.country}</span>
                        )}
                    </div>
                </div>
            )}

            {isTour && (
                <div className="tour-stats-bar" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '40px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    {[
                        { icon: '⏳', label: 'Duration', value: listing.tourData?.duration },
                        { icon: '🌍', label: 'Country', value: listing.tourData?.country },
                        { icon: '👥', label: 'Max Travellers', value: listing.tourData?.maxTravelers },
                        { icon: '🛋️', label: 'Min Pax', value: '1' }
                    ].map((stat, idx) => (
                        <div key={idx} style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(20, 20, 25, 0.7)', backdropFilter: 'blur(20px)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: '600' }}>{stat.label}</div>
                            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>{stat.value || 'N/A'}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="listing-main-content" style={{
                display: isTour ? 'grid' : 'block',
                gridTemplateColumns: isTour ? '1fr 400px' : 'none',
                gap: '40px',
                alignItems: 'start'
            }}>
                <div className="main-column">
                    <div className={`glass card ${isTour ? 'is-tour-card' : 'non-tour-card'}`} style={{ overflow: 'hidden', marginBottom: '40px', borderRadius: '24px' }}>
                        <div className="main-hero-image" style={{
                            height: isTour ? '550px' : '400px',
                            backgroundImage: `url(${listing.image || 'https://via.placeholder.com/800x400'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}></div>

                        {!isTour && (
                            <div className="non-tour-content">
                                <h1>{listing.title}</h1>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                                    <span style={{ background: 'var(--primary)', padding: '5px 15px', borderRadius: '20px' }}>{listing.type}</span>
                                    {averageRating > 0 && <span style={{ color: 'gold', fontSize: '1.2rem' }}>★ {averageRating}</span>}
                                </div>
                                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: formatDescription(listing.description) }} />

                                {listing.services && listing.services.length > 0 && (
                                    <div style={{ marginTop: '25px', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Services & Amenities</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {listing.services.map((service, idx) => (
                                                <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid rgba(255, 255, 255, 0.2)' }}>✓ {service}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isTour && (
                            <div className="tour-info-tabs">
                                <div className="tabs-header" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {['overview', 'itinerary', 'include', 'gallery'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                flex: 1,
                                                padding: '25px',
                                                background: activeTab === tab ? 'rgba(162, 155, 254, 0.1)' : 'transparent',
                                                border: 'none',
                                                borderBottom: activeTab === tab ? '4px solid #a29bfe' : '4px solid transparent',
                                                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                fontSize: '0.9rem',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            {tab === 'include' ? 'What\'s Included' : tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="tabs-body" style={{ padding: '50px' }}>
                                    {activeTab === 'overview' && (
                                        <div className="tab-pane">
                                            <h2 style={{ marginBottom: '25px', fontSize: '2.2rem', fontWeight: '800' }}>Overview</h2>
                                            <div style={{ fontSize: '1.15rem', lineHeight: '1.9', color: 'rgba(255,255,255,0.8)' }} dangerouslySetInnerHTML={{ __html: formatDescription(listing.description) }} />

                                            {listing.services && listing.services.length > 0 && (
                                                <div style={{ marginTop: '40px' }}>
                                                    <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#a29bfe' }}>Tour Highlights</h3>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                                        {listing.services.map((service, idx) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
                                                                <span style={{ color: '#a29bfe' }}>⭐</span> {service}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'itinerary' && (
                                        <div className="tab-pane">
                                            <h2 style={{ marginBottom: '30px', fontSize: '2.2rem', fontWeight: '800' }}>Full Itinerary</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {listing.tourData?.itinerary?.map((item, idx) => (
                                                    <div key={idx} style={{
                                                        background: 'rgba(255,255,255,0.04)',
                                                        borderRadius: '20px',
                                                        border: '1px solid rgba(255,255,255,0.06)',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        <button
                                                            className="itinerary-header"
                                                            onClick={() => toggleDay(item.day)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '25px 30px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#fff',
                                                                fontSize: '1.3rem',
                                                                fontWeight: '700',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <span style={{ background: '#a29bfe', color: '#000', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{item.day}</span>
                                                                Day {item.day}
                                                            </span>
                                                            <span style={{ transition: 'transform 0.4s', transform: openItineraryDays.includes(item.day) ? 'rotate(180deg)' : 'none', color: '#a29bfe' }}>▼</span>
                                                        </button>
                                                        {openItineraryDays.includes(item.day) && (
                                                            <div className="itinerary-content" style={{
                                                                padding: '0 30px 30px 80px',
                                                                color: 'rgba(255,255,255,0.7)',
                                                                lineHeight: '1.8',
                                                                fontSize: '1.1rem',
                                                                whiteSpace: 'pre-line'
                                                            }}>
                                                                {item.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'include' && (
                                        <div className="tab-pane">
                                            <h2 style={{ marginBottom: '35px', fontSize: '2.2rem', fontWeight: '800' }}>Inclusions & Exclusions</h2>

                                            <div style={{ marginBottom: '40px' }}>
                                                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2ecc71' }}>What's Included</h3>
                                                <div className="inclusions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                                    {(listing.tourData?.inclusions || []).map((inc, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '15px',
                                                            padding: '25px',
                                                            background: 'rgba(46, 204, 113, 0.05)',
                                                            border: '1px solid rgba(46, 204, 113, 0.2)',
                                                            borderRadius: '20px'
                                                        }}>
                                                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                                                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{inc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {listing.tourData?.exclusions?.length > 0 && (
                                                <div>
                                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#e74c3c' }}>What's Excluded</h3>
                                                    <div className="exclusions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                                        {listing.tourData.exclusions.map((exc, idx) => (
                                                            <div key={idx} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '15px',
                                                                padding: '25px',
                                                                background: 'rgba(231, 76, 60, 0.05)',
                                                                border: '1px solid rgba(231, 76, 60, 0.2)',
                                                                borderRadius: '20px'
                                                            }}>
                                                                <span style={{ fontSize: '1.5rem' }}>❌</span>
                                                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{exc}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'gallery' && (
                                        <div className="tab-pane">
                                            <h2 style={{ marginBottom: '35px', fontSize: '2.2rem', fontWeight: '800' }}>Gallery</h2>
                                            {listing.gallery && listing.gallery.length > 0 ? (
                                                <div className="gallery-layout">
                                                    {/* Featured Large Image */}
                                                    <div
                                                        onClick={() => setSelectedImage(listing.gallery[0])}
                                                        style={{
                                                            width: '100%',
                                                            height: '400px',
                                                            backgroundImage: `url(${listing.gallery[0]})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            borderRadius: '20px',
                                                            cursor: 'pointer',
                                                            marginBottom: '15px',
                                                            transition: 'transform 0.3s ease',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                                        }}
                                                        className="hover-scale"
                                                    />

                                                    {/* Thumbnails Grid */}
                                                    {listing.gallery.length > 1 && (
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                            gap: '15px'
                                                        }}>
                                                            {listing.gallery.slice(1).map((img, idx) => (
                                                                <div
                                                                    key={idx + 1}
                                                                    onClick={() => setSelectedImage(img)}
                                                                    style={{
                                                                        width: '100%',
                                                                        aspectRatio: '1',
                                                                        backgroundImage: `url(${img})`,
                                                                        backgroundSize: 'cover',
                                                                        backgroundPosition: 'center',
                                                                        borderRadius: '16px',
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.3s ease'
                                                                    }}
                                                                    className="hover-scale"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No photos available yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Restoring Detailed logic for other listing types */}
                        {!isTour && (
                            <div className="non-tour-details">
                                {listing.type === 'hotel' && listing.hotelData && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Rooms & Accommodation</h3>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                                    <p style={{ marginBottom: '10px' }}><strong>Total number of rooms:</strong> {listing.hotelData.totalRooms || '18'}</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {(listing.hotelData.roomTypes || []).map((room, idx) => (
                                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>{room}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Room Amenities</h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {(listing.hotelData.roomAmenities || []).map((amenity, idx) => (
                                                        <span key={idx} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>✓ {amenity}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Policies</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    {listing.hotelData.policies && Object.entries(listing.hotelData.policies).map(([key, val], idx) => (
                                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                                            <p style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'capitalize' }}>{key}:</p>
                                                            <p><strong>{val || 'N/A'}</strong></p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {listing.type === 'bar' && listing.barData && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#00d2d3', marginBottom: '15px' }}>Style / Atmosphere</h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {(listing.barData.atmosphere || []).map((item, idx) => (
                                                        <span key={idx} style={{ background: 'rgba(0, 210, 211, 0.1)', border: '1px solid #00d2d3', color: '#00d2d3', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>{item}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#00d2d3', marginBottom: '15px' }}>Crowd & Rules</h3>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                                    <p><strong>Min Age:</strong> {listing.barData.rules?.minAge || '18+'}</p>
                                                    <p><strong>Smoking:</strong> {listing.barData.rules?.smokingArea || 'No'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {listing.type === 'bujtina' && listing.bujtinaData && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Rooms & Guesthouse</h3>
                                                <p><strong>Type:</strong> {listing.bujtinaData.accommodationType}</p>
                                                <p><strong>Total Rooms:</strong> {listing.bujtinaData.totalRooms}</p>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Food & Bio Products</h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {(listing.bujtinaData.food?.bioProducts || []).map((prod, idx) => (
                                                        <span key={idx} style={{ background: 'rgba(106, 176, 76, 0.1)', padding: '5px 12px', borderRadius: '15px', color: '#6ab04c' }}>🥗 {prod}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {listing.type === 'rentcar' && listing.rentCarData && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#ff9f43', marginBottom: '15px' }}>Car Details</h3>
                                                <p><strong>Brand:</strong> {listing.rentCarData.brandModel}</p>
                                                <p><strong>Year:</strong> {listing.rentCarData.year}</p>
                                                <p><strong>Fuel:</strong> {listing.rentCarData.fuelType}</p>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', color: '#ff9f43', marginBottom: '15px' }}>Price</h3>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{listing.rentCarData.prices?.daily} / day</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Gallery (for non-tours) */}
                                {listing.gallery && listing.gallery.length > 0 && (
                                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>Gallery</h3>
                                        <div className="gallery-layout">
                                            {/* Featured Large Image */}
                                            <div
                                                onClick={() => setSelectedImage(listing.gallery[0])}
                                                style={{
                                                    width: '100%',
                                                    height: '350px',
                                                    backgroundImage: `url(${listing.gallery[0]})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    marginBottom: '15px',
                                                    transition: 'transform 0.3s ease',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                                }}
                                                className="hover-scale"
                                            />

                                            {/* Thumbnails Grid */}
                                            {listing.gallery.length > 1 && (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                                    gap: '15px'
                                                }}>
                                                    {listing.gallery.slice(1).map((img, idx) => (
                                                        <div
                                                            key={idx + 1}
                                                            onClick={() => setSelectedImage(img)}
                                                            style={{
                                                                width: '100%',
                                                                aspectRatio: '1',
                                                                backgroundImage: `url(${img})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                borderRadius: '16px',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.3s ease'
                                                            }}
                                                            className="hover-scale"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                                    <p><strong>📍 Location:</strong> {listing.address}</p>
                                    {(listing.city || listing.country) && (
                                        <p><strong>🌍 City:</strong> {listing.city}{listing.city && listing.country ? ', ' : ''}{listing.country}</p>
                                    )}
                                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {listing.owner?.phoneNumber && (
                                            <a
                                                href={`tel:${(listing.owner.phonePrefix + listing.owner.phoneNumber).replace(/\+/g, '')}`}
                                                className="btn"
                                                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}
                                            >
                                                📞 {(listing.owner.phonePrefix || '') + ' ' + listing.owner.phoneNumber}
                                            </a>
                                        )}
                                        {(listing.whatsappNumber || listing.owner?.phoneNumber) && (
                                            <a
                                                href={`https://wa.me/${(listing.whatsappNumber || (listing.owner.phonePrefix + listing.owner.phoneNumber)).replace(/\+/g, '')}?text=${encodeURIComponent(`Hello, I saw your listing "${listing.title}" and I'm interested!`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn"
                                                style={{ background: '#2ecc71', color: '#fff', textDecoration: 'none' }}
                                            >
                                                💬 Contact on WhatsApp
                                            </a>
                                        )}
                                        {menu && (
                                            <Link
                                                href={`/${listing.type}/${slug}/menu`}
                                                className="btn"
                                                style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
                                            >
                                                🍽️ View Menu
                                            </Link>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isTour && (
                    <div className="sidebar-column">
                        <div className="glass card sticky sidebar-sticky" style={{ padding: '35px', position: 'sticky', top: '100px', borderRadius: '24px', border: '1px solid rgba(162, 155, 254, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '10px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    {calculatedPrice > 0 ? 'Total Booking Price' : 'Price from'}
                                </div>
                                <div style={{ fontSize: '3.2rem', fontWeight: '900', color: '#a29bfe', textShadow: '0 10px 20px rgba(162, 155, 254, 0.3)' }}>
                                    {calculatedPrice > 0 ? `${currency}${calculatedPrice.toFixed(2)}` : (listing.tourData?.price || `${currency}0`)}
                                </div>
                                {calculatedPrice > 0 && bookingType === 'person' && (
                                    <div style={{ fontSize: '1rem', color: '#2ecc71', fontWeight: '600', marginTop: '5px' }}>
                                        Avg. {currency}{(calculatedPrice / (numAdults + numChildren)).toFixed(2)} / person
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontWeight: '600' }}>📅 Select Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={selectedTourDate}
                                    onChange={(e) => setSelectedTourDate(e.target.value)}
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </div>

                            {listing.tourData?.pricing?.isGroupWise && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <button
                                        onClick={() => setBookingType('person')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '10px',
                                            background: bookingType === 'person' ? '#a29bfe' : 'rgba(255,255,255,0.05)',
                                            color: bookingType === 'person' ? '#000' : '#fff',
                                            border: 'none', cursor: 'pointer', fontWeight: '600'
                                        }}
                                    >
                                        Personal
                                    </button>
                                    <button
                                        onClick={() => setBookingType('group')}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '10px',
                                            background: bookingType === 'group' ? '#a29bfe' : 'rgba(255,255,255,0.05)',
                                            color: bookingType === 'group' ? '#000' : '#fff',
                                            border: 'none', cursor: 'pointer', fontWeight: '600'
                                        }}
                                    >
                                        Group
                                    </button>
                                </div>
                            )}

                            {bookingType === 'person' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '5px' }}>Adults</label>
                                        <input
                                            type="number" min="1" className="input"
                                            value={numAdults} onChange={e => setNumAdults(parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '5px' }}>Children</label>
                                        <input
                                            type="number" min="0" className="input"
                                            value={numChildren} onChange={e => setNumChildren(parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '15px', background: 'rgba(162, 155, 254, 0.1)', borderRadius: '12px', marginBottom: '25px', textAlign: 'center' }}>
                                    <span style={{ color: '#a29bfe', fontWeight: '600' }}>Group Booking</span>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>Fixed price for the entire group</p>
                                </div>
                            )}

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontWeight: '600' }}>✨ Select Extras</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(listing.tourData.extras || []).map((extra, idx) => (
                                        <label key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 15px',
                                            background: (selectedExtras || []).includes(extra.name) ? 'rgba(162, 155, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            border: (selectedExtras || []).includes(extra.name) ? '1px solid #a29bfe' : '1px solid rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedExtras || []).includes(extra.name)}
                                                    onChange={() => {
                                                        const current = selectedExtras || [];
                                                        setSelectedExtras(current.includes(extra.name) ? current.filter(e => e !== extra.name) : [...current, extra.name]);
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>{extra.name}</span>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: '#a29bfe', fontWeight: '700' }}>+{currency}{extra.price}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', marginBottom: '15px' }}>
                                    <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                    <span>Private Individual Tour?</span>
                                </label>

                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Promo Code (e.g. WORLD10)"
                                        className="input"
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', paddingRight: '40px' }}
                                    />
                                    {promoCode.toUpperCase() === 'WORLD10' && (
                                        <div style={{ marginTop: '10px', color: '#55efc4', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>✓</span> WORLD10 applied (-10%)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {calculatedPrice > 0 && (
                                <div style={{
                                    padding: '25px',
                                    background: 'rgba(162, 155, 254, 0.05)',
                                    borderRadius: '20px',
                                    marginBottom: '30px',
                                    border: '1px solid rgba(162, 155, 254, 0.2)',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Booking Total</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#a29bfe' }}>{currency}{calculatedPrice.toFixed(2)}</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '5px', opacity: 0.8 }}>Calculation Results:</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '8px' }}>
                                            <span style={{ color: '#fff', fontWeight: '700' }}>Base Tour Price</span>
                                            <span style={{ color: '#fff', fontWeight: '700' }}>{currency}{priceBreakdown.baseSubtotal.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>• adults ({numAdults})</span>
                                            <span>{currency}{priceBreakdown.adultTotal.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>• children ({numChildren})</span>
                                            <span>{currency}{priceBreakdown.childTotal.toFixed(2)}</span>
                                        </div>
                                        {priceBreakdown.extrasTotal > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '5px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>• Selected Extras</span>
                                                <span style={{ fontWeight: '600' }}>{currency}{priceBreakdown.extrasTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {priceBreakdown.discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#2ecc71' }}>
                                                <span style={{ fontWeight: '600' }}>• Discount applied</span>
                                                <span style={{ fontWeight: '600' }}>- {currency}{priceBreakdown.discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid rgba(162, 155, 254, 0.3)' }}>
                                            <span style={{ fontWeight: '800', color: '#fff' }}>TOTAL PRICE</span>
                                            <span style={{ fontWeight: '800', color: '#a29bfe' }}>{currency}{calculatedPrice.toFixed(2)}</span>
                                        </div>
                                        {priceBreakdown.isPrivateApplied && (
                                            <div style={{ padding: '8px', background: 'rgba(162, 155, 254, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: '#a29bfe', textAlign: 'center', marginTop: '5px' }}>
                                                ✨ Private Tour Rate Applied
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(listing.tourData?.whatsappNumber || listing.owner?.phoneNumber) && (
                                <a
                                    href={`https://wa.me/${(listing.tourData?.whatsappNumber || (listing.owner.phonePrefix + listing.owner.phoneNumber)).replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(`Hello, I would like to book the tour: ${listing.title}
Date: ${selectedTourDate || 'Not selected'}
Type: ${bookingType}${isPrivate ? ' (Private)' : ''}
${bookingType === 'person' ? `Adults: ${numAdults}, Children: ${numChildren}` : ''}
${selectedExtras.length > 0 ? `Extras: ${selectedExtras.join(', ')}\n` : ''}${promoCode ? `Promo Code: ${promoCode}\n` : ''}TOTAL PRICE: ${currency}${calculatedPrice.toFixed(2)}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                    style={{
                                        background: selectedTourDate ? '#2ecc71' : 'rgba(255,255,255,0.1)',
                                        width: '100%',
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '22px',
                                        textDecoration: 'none',
                                        color: '#fff',
                                        fontWeight: '800',
                                        borderRadius: '18px',
                                        fontSize: '1.2rem',
                                        transition: 'all 0.3s ease',
                                        pointerEvents: selectedTourDate ? 'auto' : 'none',
                                        boxShadow: selectedTourDate ? '0 10px 20px rgba(46, 204, 113, 0.3)' : 'none'
                                    }}
                                >
                                    {selectedTourDate ? '⚡ Instant Booking' : 'Select Date First'}
                                </a>
                            )}

                            {menu && (
                                <Link
                                    href={`/${listing.type}/${slug}/menu`}
                                    className="btn"
                                    style={{
                                        background: 'var(--accent)',
                                        width: '100%',
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '18px',
                                        marginTop: '15px',
                                        textDecoration: 'none',
                                        color: '#fff',
                                        fontWeight: '700',
                                        borderRadius: '18px',
                                        fontSize: '1rem'
                                    }}
                                >
                                    🍽️ Shiko Menunë
                                </Link>
                            )}


                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                                No credit card required. Pay on the spot.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="glass card" style={{ marginTop: '60px', padding: '40px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '30px' }}>Visitor Reviews ({reviews.length})</h3>
                {reviews.length > 0 ? (
                    <div style={{ display: 'grid', gap: '30px' }}>
                        {reviews.map(review => (
                            <div key={review._id} style={{ paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#a29bfe', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {review.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{review.user?.name || 'Verified Explorer'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ color: 'gold' }}>{'★'.repeat(review.rating)}</div>
                                </div>
                                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No reviews yet. Share your experience!</p>
                )}

                {user && (
                    <form onSubmit={submitReview} className="review-form" style={{ marginTop: '40px', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                        <h4 style={{ marginBottom: '20px' }}>Write a Review</h4>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <select className="input" value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}>
                                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                <option value="4">⭐⭐⭐⭐ Good</option>
                                <option value="3">⭐⭐⭐ Average</option>
                                <option value="2">⭐⭐ Poor</option>
                                <option value="1">⭐ Terrible</option>
                            </select>
                            <textarea className="input" placeholder="Tell us about your trip..." value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
                            <button className="btn" style={{ background: '#a29bfe', color: '#000', fontWeight: 'bold' }}>Submit Review</button>
                        </div>
                    </form>
                )}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', touchAction: 'none' }}
                    onClick={() => setSelectedImage(null)}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEndEvent}
                >
                    <button
                        className="lightbox-close-btn"
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '45px', height: '45px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        ✕
                    </button>

                    <img src={selectedImage} className="lightbox-image" style={{ maxWidth: '95%', maxHeight: '85vh', borderRadius: '15px', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', transition: 'transform 0.3s ease' }} onClick={e => e.stopPropagation()} draggable="false" />

                    {listing.gallery && listing.gallery.length > 1 && (
                        <>
                            <button
                                className="lightbox-nav-left"
                                style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '55px', height: '55px', borderRadius: '50%', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = listing.gallery.indexOf(selectedImage);
                                    const prevIndex = (currentIndex <= 0) ? listing.gallery.length - 1 : currentIndex - 1;
                                    setSelectedImage(listing.gallery[prevIndex]);
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                ‹
                            </button>
                            <button
                                className="lightbox-nav-right"
                                style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '55px', height: '55px', borderRadius: '50%', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = listing.gallery.indexOf(selectedImage);
                                    const nextIndex = (currentIndex === listing.gallery.length - 1) ? 0 : currentIndex + 1;
                                    setSelectedImage(listing.gallery[nextIndex]);
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                ›
                            </button>

                            <div className="lightbox-counter" style={{ position: 'absolute', bottom: '30px', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '20px', color: '#fff', fontSize: '1rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px', fontWeight: '600' }} onClick={e => e.stopPropagation()}>
                                {listing.gallery.indexOf(selectedImage) + 1} / {listing.gallery.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
