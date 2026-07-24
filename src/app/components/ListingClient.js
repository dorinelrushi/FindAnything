'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { cleanPhoneNumber } from '@/lib/utils';
import ListingQRCode from '@/app/components/ListingQRCode';

const formatDescription = (text) => {
    if (!text) return '';
    return text
        .replace(/\r?\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

/** Google Maps search URL from business name + street address (preferred over default lat/lng). */
function buildMapUrl(listing) {
    if (!listing) return null;
    const parts = [listing.title, listing.address, listing.city, listing.country]
        .map((v) => (v || '').toString().trim())
        .filter(Boolean);
    const unique = [];
    for (const p of parts) {
        if (!unique.some((u) => u.toLowerCase() === p.toLowerCase())) unique.push(p);
    }
    if (!unique.length) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unique.join(', '))}`;
}

export default function ListingClient({ initialListing, initialReviews, initialMenu, slug }) {
    const [listing, setListing] = useState(initialListing);
    const [reviews, setReviews] = useState(initialReviews || []);
    const [averageRating, setAverageRating] = useState(0);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const { user } = useAuth();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [currency, setCurrency] = useState('€');
    const [menu, setMenu] = useState(initialMenu);
    const [openItineraryDays, setOpenItineraryDays] = useState([1]);
    const [bookingType, setBookingType] = useState('person'); 
    const [numAdults, setNumAdults] = useState(1);
    const [numChildren, setNumChildren] = useState(0);
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [promoCode, setPromoCode] = useState('');
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentLightboxSlide, setCurrentLightboxSlide] = useState(0);
    const [activeMenuTab, setActiveMenuTab] = useState(0);

    useEffect(() => {
        if (reviews.length) {
            const total = reviews.reduce((acc, r) => acc + r.rating, 0);
            setAverageRating((total / reviews.length).toFixed(1));
        } else {
            setAverageRating(0);
        }
    }, [reviews]);

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
            if (bookingType === 'group' && isGroupWise) {
                total = fixedPrice + extrasTotal;
            } else {
                const adultTotal = numAdults * adultPrice;
                const childTotal = numChildren * childPrice;
                total = adultTotal + childTotal + extrasTotal;

                if (isPrivate) {
                    const privateBase = (adultPrice * 2) + extrasTotal;
                    if (total < privateBase) {
                        total = privateBase;
                    }
                }
            }

            if (promoCode.toUpperCase() === 'WORLD10') {
                total -= total * 0.1;
            }

            setCalculatedPrice(total);
        }
    }, [bookingType, numAdults, numChildren, listing, isPrivate, promoCode, selectedExtras]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?listingId=${listing._id}`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
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
            fetchReviews();
        } else {
            alert('Failed to post review');
        }
    };

    const toggleDay = (day) => {
        setOpenItineraryDays(prev => prev.includes(day) ? [] : [day]);
    };

    const isTour = listing.type === 'tour';
    const allImages = [listing.image, ...(listing.gallery || [])].filter(Boolean);

    const nextLightboxSlide = () => setCurrentLightboxSlide(prev => (prev + 1) % allImages.length);
    const prevLightboxSlide = () => setCurrentLightboxSlide(prev => (prev - 1 + allImages.length) % allImages.length);

    return (
        <main className="bg-surface min-h-screen pb-24 md:pb-0">
            <div className="container-wide py-6 md:py-10 space-y-6 md:space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <h1 className="text-2xl md:text-5xl font-extrabold text-text-primary tracking-tight">
                        {listing.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                        <div className="flex items-center gap-1">
                            <span className="text-brand text-lg">★</span>
                            <span>{averageRating > 0 ? averageRating : '0'}</span>
                            <span className="text-text-secondary font-normal underline cursor-pointer ml-1">
                                🗨️ {reviews.length} reviews
                            </span>
                        </div>
                        <span className="text-text-secondary">·</span>
                        <div className="flex items-center gap-1 text-text-secondary underline cursor-pointer">
                            <span className="text-brand">📍</span>
                            {listing.address}, {listing.city}
                        </div>
                    </div>
                </div>

                {/* Photo Gallery */}
                <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden mt-6 mb-8 bg-bg-light">
                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-2 h-full">
                        <div
                            className={`cursor-pointer group relative overflow-hidden h-full ${allImages.length === 1 ? 'col-span-1 md:col-span-3 row-span-2' : allImages.length === 2 ? 'col-span-1 md:col-span-2 row-span-2' : 'col-span-1 md:col-span-2 md:row-span-2'}`}
                            onClick={() => { setCurrentLightboxSlide(0); setShowLightbox(true); }}
                        >
                            {allImages[0] && (
                                <div className="w-full h-full relative group-hover:brightness-90 transition-all duration-300">
                                    <img src={allImages[0]} className="w-full h-full object-cover" alt="Main" />
                                </div>
                            )}
                        </div>
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
                        className="absolute bottom-6 right-6 bg-surface border border-text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-soft hover:bg-bg-light transition-colors flex items-center gap-2 z-10"
                    >
                        Show all photos
                    </button>

                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
                        className="absolute top-6 right-6 bg-surface/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
                    >
                        <svg
                            width="24" height="24" viewBox="0 0 24 24"
                            fill={isFavorite(listing._id) ? "#FF385C" : "none"}
                            stroke={isFavorite(listing._id) ? "#FF385C" : "currentColor"}
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                    <div className="md:col-span-2 space-y-12 pb-20">
                        <section className="space-y-4 md:space-y-6 pt-4 border-t">
                            <h2 className="text-xl md:text-2xl font-bold">Description</h2>
                            <div
                                className="text-base md:text-lg text-text-secondary leading-relaxed space-y-4"
                                dangerouslySetInnerHTML={{ __html: formatDescription(listing.description) }}
                            />
                        </section>

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
                                        'Price', 'price', 'phone', 'views', 'scanCount'
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

                         {/* Itinerary */}
                         {isTour && listing.tourData?.itinerary?.length > 0 && (
                            <section className="space-y-6 pt-10 border-t">
                                <h2 className="text-2xl font-bold">Trip Itinerary</h2>
                                <div className="space-y-4">
                                    {listing.tourData.itinerary.map((day) => (
                                        <div key={day.day} className="border border-border-light rounded-2xl overflow-hidden">
                                            <button onClick={() => toggleDay(day.day)} className="w-full flex items-center justify-between p-6">
                                                <span className="text-xl font-bold">Day {day.day}</span>
                                                <span className={`text-brand transform transition-transform ${openItineraryDays.includes(day.day) ? 'rotate-180' : ''}`}>▼</span>
                                            </button>
                                            {openItineraryDays.includes(day.day) && (
                                                <div className="p-6 pt-0 text-text-secondary border-t border-border-light">{day.content}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* Menu */}
                        {menu && menu.categories?.length > 0 && (
                             <section className="space-y-6 pt-10 border-t">
                                <h2 className="text-2xl font-bold">Menu</h2>
                                <div className="flex overflow-x-auto gap-2">
                                    {menu.categories.map((cat, idx) => (
                                        <button key={idx} onClick={() => setActiveMenuTab(idx)} className={`px-4 py-2 rounded-full font-bold ${activeMenuTab === idx ? 'bg-inverse text-on-inverse' : 'bg-bg-light'}`}>
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    {menu.categories[activeMenuTab]?.items.map((item, idx) => (
                                        <div key={idx} className="p-4 border rounded-xl flex gap-4">
                                            {item.photo && <img src={item.photo} className="w-20 h-20 rounded-lg object-cover" alt="" />}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{item.name}</h4>
                                                    <span className="text-brand font-bold bg-brand/5 px-2 py-1 rounded-lg text-sm">{item.price}</span>
                                                </div>
                                                {item.description && <p className="text-xs text-text-secondary mt-1">{item.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </section>
                        )}

                        {/* Public QR — every listing (old + new) gets a scannable code */}
                        <ListingQRCode
                            listingId={listing._id}
                            listingTitle={listing.title}
                            scanCount={listing.scanCount || 0}
                        />

                        {/* Reviews */}
                        <section className="pt-10 border-t">
                             <h2 className="text-2xl font-bold mb-6">Reviews ({reviews.length})</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 {reviews.map(r => (
                                     <div key={r._id} className="p-4 bg-bg-light rounded-xl">
                                         <div className="font-bold">{r.user?.name || 'Guest'}</div>
                                         <div className="text-brand">{'★'.repeat(r.rating)}</div>
                                         <p className="italic text-text-secondary">"{r.comment}"</p>
                                     </div>
                                 ))}
                             </div>
                             {user && (
                                 <form onSubmit={submitReview} className="mt-8 space-y-4 p-6 bg-bg-light rounded-2xl">
                                     <h3 className="font-bold">Leave a Review</h3>
                                     <textarea value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full p-4 rounded-xl border h-32" />
                                     <button type="submit" className="btn-primary w-full py-3">Submit</button>
                                 </form>
                             )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden md:block">
                        <div className="sticky top-28 space-y-6">
                            <div className="p-8 border border-border-light rounded-3xl shadow-airbnb bg-surface space-y-8">
                                <h3 className="text-xl font-bold">Request Details</h3>
                                <div className="text-2xl font-black">
                                    {listing.price ? (typeof listing.price === 'string' && listing.price.includes('€') ? listing.price : `€${listing.price}`) : 'Price on request'}
                                </div>
                                <div className="space-y-4">
                                    <a href={`tel:${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} className="w-full btn-primary block py-3 text-center">Call Host</a>
                                    <a href={`https://wa.me/${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} target="_blank" className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold block text-center">WhatsApp Message</a>
                                </div>
                                <div className="text-center">
                                    <button className="text-text-secondary text-sm underline">Report this listing</button>
                                </div>
                            </div>
                            <ListingQRCode
                                listingId={listing._id}
                                listingTitle={listing.title}
                                scanCount={listing.scanCount || 0}
                                compact
                            />
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile Sticky Footer Contact Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/95 backdrop-blur-md border-t border-border-light p-4 shadow-airbnb flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Price</span>
                    <span className="text-base font-black text-text-primary">
                        {listing.price ? (typeof listing.price === 'string' && listing.price.includes('€') ? listing.price : `€${listing.price}`) : 'Price on request'}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <a 
                        href={`tel:${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} 
                        className="px-4 py-3 bg-brand text-white font-bold rounded-xl text-center text-sm transition-all hover:bg-brand-hover active:scale-95 flex-1 max-w-[130px] flex items-center justify-center gap-1 shadow-soft"
                    >
                        📞 Call Host
                    </a>
                    <a 
                        href={`https://wa.me/${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} 
                        target="_blank" 
                        className="px-4 py-3 bg-[#25D366] text-white font-bold rounded-xl text-center text-sm transition-all active:scale-95 flex-1 max-w-[140px] flex items-center justify-center gap-1 shadow-soft"
                    >
                        💬 WhatsApp
                    </a>
                </div>
            </div>

            {/* Lightbox */}
            {showLightbox && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">
                    <button onClick={() => setShowLightbox(false)} className="absolute top-6 right-6 text-white text-2xl font-bold">×</button>
                    <img src={allImages[currentLightboxSlide]} className="max-w-full max-h-[80vh] object-contain" />
                    <div className="absolute bottom-10 flex gap-4 text-white">
                        <button onClick={prevLightboxSlide}>← Prev</button>
                        <span>{currentLightboxSlide + 1} / {allImages.length}</span>
                        <button onClick={nextLightboxSlide}>Next →</button>
                    </div>
                </div>
            )}
        </main>
    );
}
