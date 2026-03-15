'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cleanPhoneNumber } from '@/lib/utils';

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
    const { toggleFavorite, isFavorite } = useFavorites();
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
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentLightboxSlide, setCurrentLightboxSlide] = useState(0);
    const [priceBreakdown, setPriceBreakdown] = useState({
        adultTotal: 0,
        childTotal: 0,
        extrasTotal: 0,
        discountAmount: 0,
        isPrivateApplied: false
    });
    const [activeMenuTab, setActiveMenuTab] = useState(0);

    useEffect(() => {
        if (listing?.tourData) {
            const priceStr = listing.tourData.price || '';
            if (priceStr.includes('$')) setCurrency('$');
            else if (priceStr.toLowerCase().includes('lek')) setCurrency('LEK');
            else setCurrency('€');

            const pricing = listing.tourData.pricing || {};
            let { adultPrice = 0, childPrice = 0, fixedPrice = 0, isGroupWise = false } = pricing;

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

            const businessExtras = listing.tourData.extras || [];
            let extrasTotal = 0;
            (selectedExtras || []).forEach(name => {
                const extra = businessExtras.find(e => e.name === name);
                if (extra) extrasTotal += extra.price;
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
                baseSubtotal: adultTotal + childTotal
            });
        }
    }, [bookingType, numAdults, numChildren, listing, isPrivate, promoCode, selectedExtras]);

    useEffect(() => {
        fetchListing();
    }, [slug]);

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
        if (newReview.image) formData.append('image', newReview.image);

        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
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
            prev.includes(day) ? [] : [day]
        );
    };

    if (loading) return <div className="container-wide py-20 text-center text-text-secondary font-bold">Loading...</div>;
    if (!listing) return notFound();

    const isTour = listing.type === 'tour';
    const allImages = [listing.image, ...(listing.gallery || [])].filter(Boolean);

    const nextLightboxSlide = () => setCurrentLightboxSlide(prev => (prev + 1) % allImages.length);
    const prevLightboxSlide = () => setCurrentLightboxSlide(prev => (prev - 1 + allImages.length) % allImages.length);

    return (
        <main className="bg-white min-h-screen">
            <div className="container-wide py-6 md:py-10 space-y-6 md:space-y-8">
                {/* 1. Header Section */}
                <div className="space-y-4">
                    <h1 className="text-2xl md:text-5xl font-extrabold text-text-primary tracking-tight">
                        {listing.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                        <div className="flex items-center gap-1">
                            <span className="text-brand text-lg">★</span>
                            <span>{averageRating > 0 ? averageRating : '0'}</span>
                            <span className="text-text-secondary font-normal underline cursor-pointer ml-1">
                                💬 {reviews.length} reviews
                            </span>
                        </div>
                        <span className="text-text-secondary">·</span>
                        <div className="flex items-center gap-1 text-text-secondary underline cursor-pointer">
                            <span className="text-brand">📍</span>
                            {listing.address}, {listing.city}
                        </div>
                    </div>
                </div>

                {/* 2. Photo Gallery Airbnb Style Grid */}
                <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden mt-6 mb-8 bg-bg-light">
                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-2 h-full">
                        {/* Main large image */}
                        <div
                            className={`cursor-pointer group relative overflow-hidden h-full ${allImages.length === 1 ? 'col-span-1 md:col-span-3 row-span-2' : allImages.length === 2 ? 'col-span-1 md:col-span-2 row-span-2' : 'col-span-1 md:col-span-2 md:row-span-2'}`}
                            onClick={() => { setCurrentLightboxSlide(0); setShowLightbox(true); }}
                        >
                            {allImages[0] && (
                                <div className="w-full h-full relative group-hover:brightness-90 transition-all duration-300">
                                    <img src={allImages[0]} className="w-full h-full object-cover" alt="Main" />
                                    {/* Video play icon overlay for aesthetics */}
                                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white text-2xl pl-1">
                                            ▶
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Up to 2 smaller images */}
                        {allImages.slice(1, 3).map((img, idx) => (
                            <div
                                key={idx}
                                className="hidden md:block cursor-pointer group relative overflow-hidden h-full col-span-1 row-span-1"
                                onClick={() => { setCurrentLightboxSlide(idx + 1); setShowLightbox(true); }}
                            >
                                <img src={img} className="w-full h-full object-cover group-hover:brightness-90 transition-all" alt={`Secondary ${idx}`} />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => { setCurrentLightboxSlide(0); setShowLightbox(true); }}
                        className="absolute bottom-6 right-6 bg-white border border-text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-soft hover:bg-bg-light transition-colors flex items-center gap-2 z-10"
                    >
                        <span className="grid grid-cols-3 gap-[2px]">
                            {Array.from({ length: 9 }).map((_, i) => <span key={i} className="w-1 h-1 bg-text-primary rounded-full transition-colors group-hover:bg-brand" />)}
                        </span>
                        Show all photos
                    </button>

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
                        className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-10 group"
                    >
                        <svg
                            width="24" height="24" viewBox="0 0 24 24"
                            fill={isFavorite(listing._id) ? "#FF385C" : "none"}
                            stroke={isFavorite(listing._id) ? "#FF385C" : "currentColor"}
                            strokeWidth="2"
                            className="transition-colors"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                {/* 3. Main Content Two-Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                    <div className="md:col-span-2 space-y-12 pb-20">
                        {/* Description Section */}
                        <section className="space-y-4 md:space-y-6 pt-4 border-t">
                            <h2 className="text-xl md:text-2xl font-bold">Description</h2>
                            <div
                                className="text-base md:text-lg text-text-secondary leading-relaxed space-y-4"
                                dangerouslySetInnerHTML={{ __html: formatDescription(listing.description) }}
                            />
                        </section>

                        {/* Amenities / Services */}
                        {listing.services?.length > 0 && (
                            <section className="space-y-2 md:space-y-3 pt-6 md:pt-10 border-t">
                                <h2 className="text-xl md:text-2xl font-bold">What this place offers</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 md:gap-y-4 gap-x-8">
                                    {listing.services.map((service, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-base md:text-lg text-text-secondary font-medium">
                                            <span className="text-brand">✓</span>
                                            {service}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Dynamic Listing Info Section */}
                        <section className="space-y-6 md:space-y-10 pt-4 md:pt-5 border-t">
                            {Object.entries(listing)
                                .filter(([key]) => {
                                    const basicExcludes = [
                                        '_id', 'slug', 'title', 'description', 'image', 'gallery', 'services',
                                        'createdAt', 'updatedAt', '__v', 'password', 'owner', 'lat', 'lng',
                                        'type', 'id', 'address', 'city', 'country', 'category', 'whatsappNumber',
                                        'Price', 'price', 'phone'
                                    ];
                                    const dataKeys = ['hotelData', 'restaurantData', 'barData', 'rentCarData', 'bujtinaData', 'tourData'];
                                    const activeDataKey = listing.type === 'rentcar' ? 'rentCarData' : `${listing.type}Data`;

                                    if (basicExcludes.includes(key)) return false;
                                    if (dataKeys.includes(key) && key !== activeDataKey) return false;

                                    return true;
                                })
                                .filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : (typeof value === 'object' ? Object.keys(value).length > 0 : true)))
                                .map(([key, value]) => {
                                    let formattedTitle = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                    // Force English Translations for data keys
                                    const titleTranslations = {
                                        'bujtinaData': 'Guesthouse Data',
                                        'rentCarData': 'Rent Car Data',
                                        'hotelData': 'Hotel Data',
                                        'restaurantData': 'Restaurant Data',
                                        'barData': 'Bar Data',
                                        'tourData': 'Tour Data'
                                    };
                                    if (titleTranslations[key]) {
                                        formattedTitle = titleTranslations[key];
                                    }

                                    return (
                                        <div key={key} className="space-y-4 md:space-y-8 border-b border-border-light pb-4 md:pb-8 last:border-0 last:pb-0">
                                            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">{formattedTitle}</h2>

                                            {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                                                <div className="space-y-4 md:space-y-8">
                                                    {Object.entries(value).map(([subKey, subVal], i) => {
                                                        const subKeyFormatted = subKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                                        let displayItems = [];
                                                        if (typeof subVal === 'boolean' && subVal === true) displayItems.push('Yes');
                                                        else if (typeof subVal === 'string' && subVal.trim() !== '') displayItems.push(...subVal.split(',').map(s => s.trim()));
                                                        else if (typeof subVal === 'number') displayItems.push(String(subVal));
                                                        else if (Array.isArray(subVal)) displayItems = subVal.filter(item => typeof item === 'string' && item.trim() !== '');
                                                        else if (typeof subVal === 'object' && subVal !== null) {
                                                            Object.entries(subVal).forEach(([k, v]) => {
                                                                const kFormatted = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                                                if (v === true) displayItems.push(kFormatted);
                                                                else if (typeof v === 'string' && v.trim() !== '') displayItems.push(`${kFormatted}: ${v}`);
                                                                else if (typeof v === 'number') displayItems.push(`${kFormatted}: ${v}`);
                                                            });
                                                        }

                                                        if (displayItems.length === 0) return null;

                                                        return (
                                                            <div key={i} className="space-y-2 md:space-y-4">
                                                                <h3 className="text-lg md:text-xl font-bold text-text-primary capitalize">{subKeyFormatted}</h3>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 md:gap-y-3 gap-x-6">
                                                                    {displayItems.map((item, idx) => (
                                                                        <div key={idx} className="flex items-start gap-3 text-base md:text-lg text-text-secondary">
                                                                            <span className="text-brand text-lg md:text-xl leading-none mt-[2px]">✓</span>
                                                                            <span className="font-medium text-text-primary">{item}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 md:gap-y-4 gap-x-6 mt-2 md:mt-4">
                                                    {Array.isArray(value) ? value.filter(i => i).map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 text-base md:text-lg text-text-secondary">
                                                            <span className="text-brand text-lg md:text-xl leading-none mt-[2px]">✓</span>
                                                            <span className="font-medium text-text-primary">{item}</span>
                                                        </div>
                                                    )) : (
                                                        <div className="flex items-start gap-3 text-base md:text-lg text-text-secondary">
                                                            <span className="text-brand text-lg md:text-xl leading-none mt-[2px]">✓</span>
                                                            <span className="font-medium text-text-primary">{String(value)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </section>

                        {/* Specific Content for Tours */}
                        {isTour && listing.tourData?.itinerary?.length > 0 && (
                            <section className="space-y-6 pt-10 border-t">
                                <h2 className="text-2xl font-bold">Trip Itinerary</h2>
                                <div className="space-y-4">
                                    {listing.tourData.itinerary.map((day) => (
                                        <div key={day.day} className="border border-border-light rounded-2xl overflow-hidden">
                                            <button
                                                onClick={() => toggleDay(day.day)}
                                                className="w-full flex items-center justify-between p-6 bg-white hover:bg-bg-light transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl font-bold">Day {day.day}</span>
                                                </div>
                                                <span className={`text-brand transform transition-transform ${openItineraryDays.includes(day.day) ? 'rotate-180' : ''}`}>
                                                    ▼
                                                </span>
                                            </button>
                                            {openItineraryDays.includes(day.day) && (
                                                <div className="p-6 pt-0 text-text-secondary leading-relaxed text-lg border-t border-border-light bg-bg-light/30">
                                                    {day.content}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Menu Section */}
                        {menu && menu.categories && menu.categories.length > 0 && (
                            <section className="space-y-6 pt-10 border-t">
                                <h2 className="text-2xl font-bold">Menu</h2>

                                {/* Tabs */}
                                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                                    {menu.categories.map((cat, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveMenuTab(idx)}
                                            className={`whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm transition-all ${activeMenuTab === idx
                                                ? 'bg-text-primary text-white shadow-md'
                                                : 'bg-bg-light text-text-secondary hover:bg-border-light hover:text-text-primary'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                    {menu.categories[activeMenuTab]?.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-border-light bg-white hover:shadow-airbnb hover:border-brand/30 transition-all group">
                                            {item.photo && (
                                                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-bg-light">
                                                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className="font-extrabold text-text-primary group-hover:text-brand transition-colors text-lg leading-tight">{item.name}</h4>
                                                    {item.price && (
                                                        <span className="font-bold text-brand whitespace-nowrap bg-brand/10 px-2 py-1 rounded-lg text-sm">
                                                            {item.price.includes('€') || item.price.toLowerCase().includes('lek') ? item.price : `${item.price} €`}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-text-secondary text-sm leading-snug line-clamp-2 mt-auto">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Reviews Section */}
                        <section className="space-y-10 pt-10 border-t">
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <span>★</span>
                                <span>{averageRating > 0 ? averageRating : '0'}</span>
                                <span className="ml-2">💬 {reviews.length} reviews</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                {reviews.map((review) => (
                                    <div key={review._id} className="space-y-4 p-6 rounded-2xl bg-bg-light/40 border border-border-light">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-brand">
                                                {review.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold">{review.user?.name || 'Guest'}</div>
                                                <div className="text-xs text-text-secondary">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex text-brand text-xs">
                                            {Array.from({ length: review.rating }).map((_, i) => <span key={i}>★</span>)}
                                        </div>
                                        <p className="text-text-secondary leading-relaxed italic border-l-2 border-brand/20 pl-4">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Add Review Form */}
                            {user && (
                                <form onSubmit={submitReview} className="p-8 bg-bg-light rounded-3xl space-y-6 border border-border-light shadow-soft">
                                    <h3 className="text-xl font-bold">Leave a review</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border-light">
                                            <span className="font-bold text-sm">Rating:</span>
                                            <select
                                                className="bg-transparent font-bold text-brand outline-none"
                                                value={newReview.rating}
                                                onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                                            >
                                                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                            </select>
                                        </div>
                                        <textarea
                                            placeholder="Share your experience here..."
                                            className="w-full bg-white p-6 rounded-xl border border-border-light focus:ring-2 focus:ring-brand focus:border-transparent outline-none min-h-[150px] text-lg"
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                            required
                                        />
                                        <button type="submit" className="btn-primary w-full py-4 text-lg">
                                            Publish review
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>
                    </div>

                    {/* Booking/Contact Sidebar */}
                    <aside className="hidden md:block">
                        <div className="sticky top-28 p-8 border border-border-light rounded-3xl shadow-airbnb bg-white space-y-8">
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-black text-text-primary">
                                    {listing.price ? (
                                        typeof listing.price === 'string' && (listing.price.includes('€') || listing.Price?.includes('Lek') || listing.price.includes('$'))
                                            ? listing.price
                                            : `€${listing.price}`
                                    ) : ''}
                                </div>
                                <div className="flex items-center gap-1 text-sm font-bold">
                                    <span>★</span>
                                    <span>{averageRating > 0 ? averageRating : '0'}</span>
                                    <span className="ml-1 text-text-secondary">💬 {reviews.length}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold">Request Details</h3>
                                    <p className="text-sm text-text-secondary">Direct contact with the host</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <a
                                        href={`tel:${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`}
                                        className="w-full bg-brand hover:brightness-90 text-white py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-soft transition-all active:scale-95"
                                    >
                                        <span>📞</span> Call Host
                                    </a>
                                    <a
                                        href={`https://wa.me/${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}?text=Hello, I am interested in ${listing.title}`}
                                        target="_blank"
                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-soft transition-all active:scale-95"
                                    >
                                        <span>💬</span> WhatsApp Message
                                    </a>
                                </div>
                                <p className="text-xs text-text-secondary text-center">You won't be charged yet</p>
                                <div className="pt-4 border-t border-border-light text-center">
                                    <button className="text-sm text-text-secondary underline hover:text-text-primary transition-colors flex items-center justify-center gap-2 w-full">
                                        <span>⚑</span> Report this listing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Lightbox Component */}
            {showLightbox && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
                >
                    <div className="absolute top-0 w-full p-6 flex justify-between items-center text-white z-50">
                        <div className="text-sm font-bold tracking-widest">
                            {currentLightboxSlide + 1} / {allImages.length}
                        </div>
                        <button
                            onClick={() => setShowLightbox(false)}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            Close
                        </button>
                    </div>

                    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                        {allImages.length > 1 && (
                            <button
                                onClick={prevLightboxSlide}
                                className="absolute left-4 md:left-8 bg-white/10 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 font-bold text-xl backdrop-blur-sm"
                            >
                                ←
                            </button>
                        )}

                        <img
                            src={allImages[currentLightboxSlide]}
                            className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-400 select-none"
                        />

                        {allImages.length > 1 && (
                            <button
                                onClick={nextLightboxSlide}
                                className="absolute right-4 md:right-8 bg-white/10 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 font-bold text-xl backdrop-blur-sm"
                            >
                                →
                            </button>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
