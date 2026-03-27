'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Map from './Map';

export default function ListingClient({ initialListing, initialReviews, initialMenu, slug }) {
    const [listing, setListing] = useState(initialListing);
    const [reviews, setReviews] = useState(initialReviews);
    const [menu, setMenu] = useState(initialMenu);
    const [user, setUser] = useState(null);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [activeMenuTab, setActiveMenuTab] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentLightboxSlide, setCurrentLightboxSlide] = useState(0);
    const [openItineraryDays, setOpenItineraryDays] = useState([1]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userData = JSON.parse(atob(token.split('.')[1]));
                setUser(userData);
            } catch (e) {}
        }
    }, []);

    if (!listing) return null;

    const allImages = [listing.image, ...(listing.gallery || [])].filter(Boolean);
    const isTour = listing.type === 'tour';

    const toggleDay = (day) => {
        setOpenItineraryDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const submitReview = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ listing: listing._id, ...newReview })
            });
            if (res.ok) {
                const updated = await res.json();
                setReviews([updated.review, ...reviews]);
                setNewReview({ rating: 5, comment: '' });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const nextLightboxSlide = () => setCurrentLightboxSlide((prev) => (prev + 1) % allImages.length);
    const prevLightboxSlide = () => setCurrentLightboxSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
    const cleanPhoneNumber = (num) => num?.replace(/\D/g, '');

    return (
        <main className="min-h-screen bg-white pb-20">
            {/* Gallery Section */}
            <div className="container-wide pt-4 sm:pt-6">
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[350px] md:h-[500px] rounded-2xl overflow-hidden relative">
                    <div className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer" onClick={() => { setCurrentLightboxSlide(0); setShowLightbox(true); }}>
                        <img src={allImages[0]} className="w-full h-full object-cover hover:brightness-90 transition-all" alt="" />
                    </div>
                    {allImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="hidden md:block relative group cursor-pointer" onClick={() => { setCurrentLightboxSlide(idx + 1); setShowLightbox(true); }}>
                            <img src={img} className="w-full h-full object-cover hover:brightness-90 transition-all" alt="" />
                        </div>
                    ))}
                    <button onClick={() => setShowLightbox(true)} className="absolute bottom-6 right-6 bg-white border border-black px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all">
                        Show all photos
                    </button>
                </div>
            </div>

            <div className="container-wide mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-10">
                        {/* Header Info */}
                        <div className="border-b pb-8">
                            <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-2">{listing.title}</h1>
                            <div className="flex items-center gap-4 text-sm font-bold text-text-secondary">
                                <span>📍 {listing.city}, {listing.country}</span>
                                <span className="text-brand">★ {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'New'}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold">Details</h2>
                            <div className="prose prose-lg text-text-secondary leading-relaxed blog-content" dangerouslySetInnerHTML={{ __html: listing.description }} />
                        </section>

                        {/* Custom Data Fields */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t">
                            {Object.entries(listing[`${listing.type}Data`] || {})
                                .filter(([key]) => !['_id', 'itinerary', 'generalServices', 'additionalServices', 'roomAmenities', 'facilities'].includes(key))
                                .map(([key, value]) => {
                                    if (!value) return null;
                                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    return (
                                        <div key={key} className="space-y-4 p-8 bg-white border border-border-light rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-2">{label}</h3>
                                            {typeof value === 'boolean' ? (
                                                <div className="flex items-start gap-4 text-base md:text-lg text-text-secondary">
                                                    <span className="text-brand text-lg md:text-xl leading-none mt-[2px]">✓</span>
                                                    <span className="font-medium text-text-primary">{label} Included</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {Array.isArray(value) ? value.map((item, idx) => (
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
                                        <button key={idx} onClick={() => setActiveMenuTab(idx)} className={`px-4 py-2 rounded-full font-bold ${activeMenuTab === idx ? 'bg-text-primary text-white' : 'bg-bg-light'}`}>
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    {menu.categories[activeMenuTab]?.items.map((item, idx) => (
                                        <div key={idx} className="p-4 border rounded-xl flex gap-4">
                                            {item.photo && <img src={item.photo} className="w-20 h-20 rounded-lg object-cover" alt="" />}
                                            <div>
                                                <h4 className="font-bold">{item.name}</h4>
                                                <p className="text-brand font-bold">{item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </section>
                        )}

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
                        <div className="sticky top-28 p-8 border border-border-light rounded-3xl shadow-airbnb bg-white space-y-8">
                            <div className="text-2xl font-black">
                                {listing.price ? (typeof listing.price === 'string' && listing.price.includes('€') ? listing.price : `€${listing.price}`) : 'Price on request'}
                            </div>
                            <div className="space-y-4">
                                <a href={`tel:${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} className="w-full btn-primary block py-3 text-center">Call Host</a>
                                <a href={`https://wa.me/${cleanPhoneNumber(listing.whatsappNumber || (listing.owner?.phonePrefix + listing.owner?.phoneNumber))}`} target="_blank" className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold block text-center">WhatsApp</a>
                            </div>
                        </div>
                    </aside>
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
