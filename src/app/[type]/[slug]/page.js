'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function ListingPage({ params }) {
    const { slug, type } = use(params);

    const [listing, setListing] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [menu, setMenu] = useState(null);

    useEffect(() => {
        fetchListing();
    }, [slug]);

    const fetchListing = async () => {
        setLoading(true);
        const res = await fetch(`/api/listings/${slug}`);
        const data = await res.json();
        if (data.listing) {
            setListing(data.listing);

            fetchReviews(data.listing._id);
            fetchMenu(data.listing._id);
        } else {
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
        const res = await fetch(`/api/reviews?listingId=${listingId}`);
        const data = await res.json();
        if (data.reviews) {
            setReviews(data.reviews);
            // Calculate average
            const total = data.reviews.reduce((acc, r) => acc + r.rating, 0);
            setAverageRating(data.reviews.length ? (total / data.reviews.length).toFixed(1) : 0);
        }
        setLoading(false);
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
                // 'Content-Type': 'multipart/form-data', // Do NOT set this manually when using FormData, browser does it with boundary
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

    if (loading) return <div className="container">Loading...</div>;
    if (!listing) return <div className="container" style={{ textAlign: "center", marginTop: "50px" }}>Listing not found</div>;

    return (
        <div className="container">
            <div className="glass card" style={{ padding: '40px', marginBottom: '40px' }}>
                <div style={{ height: '400px', backgroundImage: `url(${listing.image || 'https://via.placeholder.com/800x400'})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px', marginBottom: '30px' }}></div>
                <h1>{listing.title}</h1>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--primary)', padding: '5px 15px', borderRadius: '20px' }}>{listing.type}</span>
                    {listing.category && (
                        <span style={{ background: 'var(--accent)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
                            {listing.category}
                        </span>
                    )}
                    {averageRating > 0 && <span style={{ color: 'gold', fontSize: '1.2rem', fontWeight: 'bold' }}>★ {averageRating}</span>}
                </div>

                {/* Render HTML description */}
                <div
                    style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}
                    dangerouslySetInnerHTML={{ __html: listing.description }}
                />

                {/* Services/Amenities */}
                {listing.services && listing.services.length > 0 && (
                    <div style={{ marginTop: '25px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Services & Amenities</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {listing.services.map((service, idx) => (
                                <span
                                    key={idx}
                                    className="badge"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    ✓ {service}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hotel Specific Info */}
                {listing.type === 'hotel' && listing.hotelData && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Rooms */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Dhoma & Akomodimi</h3>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                    <p style={{ marginBottom: '10px' }}><strong>Numri total i dhomave:</strong> {listing.hotelData.totalRooms || '18'}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(listing.hotelData.roomTypes || []).map((room, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                                {room}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Room Amenities */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Pajisjet në dhomë</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(listing.hotelData.roomAmenities || []).map((amenity, idx) => (
                                        <span key={idx} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                            ✓ {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Services */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Shërbimet & Facilitetet</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px' }}>Përgjithshme:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {(listing.hotelData.generalServices || []).map((service, idx) => (
                                                <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {listing.hotelData.additionalServices?.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px' }}>Shtesë:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {listing.hotelData.additionalServices.map((service, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Policies */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: '1.3rem', color: '#fd79a8', marginBottom: '15px' }}>Politikat</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    {[
                                        { label: 'Politika e anulimit', value: listing.hotelData.policies?.cancellation },
                                        { label: 'Fëmijët', value: listing.hotelData.policies?.children },
                                        { label: 'Kafshët shtëpiake', value: listing.hotelData.policies?.pets },
                                        { label: 'Pagesa', value: listing.hotelData.policies?.payment }
                                    ].map((policy, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>{policy.label}:</p>
                                            <p><strong>{policy.value || 'N/A'}</strong></p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bar Specific Info */}
                {listing.type === 'bar' && listing.barData && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Stili / Atmosfera */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#00d2d3', marginBottom: '15px' }}>Stili / Atmosfera</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(listing.barData.atmosphere || []).map((item, idx) => (
                                        <span key={idx} style={{ background: 'rgba(0, 210, 211, 0.1)', border: '1px solid #00d2d3', color: '#00d2d3', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Shërbime & Facilitetet */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#00d2d3', marginBottom: '15px' }}>Shërbime & Facilitetet</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(listing.barData.services || []).map((service, idx) => (
                                        <span key={idx} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                            ✓ {service}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Publiku & Rregullat */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#00d2d3', marginBottom: '15px' }}>Publiku & Rregullat</h3>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                    <p style={{ marginBottom: '8px' }}><strong>Mosha minimale:</strong> {listing.barData.rules?.minAge || '18+'}</p>
                                    <p style={{ marginBottom: '8px' }}><strong>Duhani:</strong> {listing.barData.rules?.smokingArea || 'N/A'}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                                        {(listing.barData.rules?.suitableFor || []).map((item, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px' }}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Features / Highlights */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', background: 'rgba(0, 210, 211, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 210, 211, 0.2)' }}>
                                    {listing.barData.features?.featuredDrinks && <span>🔥 Featured Drinks</span>}
                                    {listing.barData.features?.openLate && <span>📍 Bar i hapur deri vonë</span>}
                                    {listing.barData.features?.liveMusicTonight && <span>🎶 Muzikë live sonte</span>}
                                    {listing.barData.features?.cocktailOfWeek && (
                                        <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <strong>🍸 Cocktail of the Week:</strong> <span style={{ color: '#00d2d3' }}>{listing.barData.features.cocktailOfWeek}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bujtina Specific Info */}
                {listing.type === 'bujtina' && listing.bujtinaData && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Lloji & Stili */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Lloji & Stili</h3>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                    <p style={{ marginBottom: '10px' }}><strong>Tipi:</strong> {listing.bujtinaData.accommodationType || 'Bujtinë'}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(listing.bujtinaData.style || []).map((style, idx) => (
                                            <span key={idx} style={{ background: 'rgba(106, 176, 76, 0.15)', color: '#6ab04c', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                                {style}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dhoma & Akomodimi */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Dhoma & Akomodimi</h3>
                                <p style={{ marginBottom: '8px' }}><strong>Numri i dhomave:</strong> {listing.bujtinaData.totalRooms}</p>
                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Llojet:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                        {(listing.bujtinaData.roomTypes || []).map((type, idx) => (
                                            <span key={idx} style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.9rem' }}>
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Pajisjet:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                        {(listing.bujtinaData.roomAmenities || []).map((am, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.9rem' }}>
                                                ✓ {am}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Shërbime & Facilitetet */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Shërbime & Facilitetet</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(listing.bujtinaData.facilities || []).map((fac, idx) => (
                                        <span key={idx} style={{ background: 'rgba(106, 176, 76, 0.1)', border: '1px solid #6ab04c', color: '#6ab04c', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem' }}>
                                            {fac}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Ushqimi */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: '1.3rem', color: '#6ab04c', marginBottom: '15px' }}>Ushqimi & Produkte Bio</h3>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <p style={{ marginBottom: '5px', color: '#aaa' }}>Mëngjesi:</p>
                                        <p><strong>{listing.bujtinaData.food?.breakfast}</strong></p>
                                    </div>
                                    <div>
                                        <p style={{ marginBottom: '5px', color: '#aaa' }}>Drekë / Darkë:</p>
                                        <p><strong>{listing.bujtinaData.food?.meals}</strong></p>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <p style={{ marginBottom: '10px', color: '#aaa' }}>Produkte Shtëpie / Bio:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {(listing.bujtinaData.food?.bioProducts || []).map((prod, idx) => (
                                                <span key={idx} style={{ background: 'var(--accent)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
                                                    🥗 {prod}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rent Car Specific Info */}
                {listing.type === 'rentcar' && listing.rentCarData && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Detajet e Makinës */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#ff9f43', marginBottom: '15px' }}>Detajet e Makinës</h3>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                    <p style={{ marginBottom: '8px' }}><strong>Marka & Modeli:</strong> {listing.rentCarData.brandModel}</p>
                                    <p style={{ marginBottom: '8px' }}><strong>Viti:</strong> {listing.rentCarData.year}</p>
                                    <p style={{ marginBottom: '8px' }}><strong>Karburanti:</strong> {listing.rentCarData.fuelType} | <strong>Transmetimi:</strong> {listing.rentCarData.transmission}</p>
                                    <p style={{ marginBottom: '8px' }}><strong>Vende:</strong> {listing.rentCarData.seats} | <strong>Konsumi:</strong> {listing.rentCarData.fuelConsumption}</p>
                                    <p style={{ marginBottom: '0' }}><strong>Kondicioner:</strong> {listing.rentCarData.airConditioning ? 'Po' : 'Jo'}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                                        {(listing.rentCarData.category || []).map((cat, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43', padding: '3px 10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Çmimi & Përfshirjet */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#ff9f43', marginBottom: '15px' }}>Çmimi & Përfshirjet</h3>
                                <div style={{ background: 'rgba(255,159,67,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,159,67,0.2)' }}>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff9f43', marginBottom: '10px' }}>{listing.rentCarData.prices?.daily} / ditë</p>
                                    {listing.rentCarData.prices?.weekly && <p style={{ marginBottom: '8px', fontSize: '0.9rem' }}>{listing.rentCarData.prices.weekly} / javë</p>}
                                    <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#aaa' }}>Depozita: {listing.rentCarData.prices?.deposit || '0 €'}</p>
                                    <div style={{ marginTop: '10px' }}>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '5px', opacity: 0.8 }}>Në çmim përfshihet:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {(listing.rentCarData.prices?.inclusions || []).map((inc, idx) => (
                                                <span key={idx} style={{ fontSize: '0.85rem' }}>✓ {inc}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kushtet & Extra */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', color: '#ff9f43', marginBottom: '15px' }}>Kushtet & Extra</h3>
                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '5px' }}><strong>Mosha:</strong> {listing.rentCarData.conditions?.minAge || '21+'} | <strong>Eksperienca:</strong> {listing.rentCarData.conditions?.licenseExperience || '2 vite'}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {(listing.rentCarData.conditions?.requiredDocuments || []).map((doc, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '5px', fontSize: '0.8rem' }}>{doc}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '8px' }}>Shërbime shtesë:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(listing.rentCarData.extraServices || []).map((srv, idx) => (
                                            <span key={idx} style={{ border: '1px solid rgba(255,159,67,0.3)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.85rem' }}>
                                                + {srv}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '20px', color: '#ccc' }}>
                    <strong>Location:</strong> {listing.address}
                </div>
                {listing.owner?.phoneNumber && (
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ color: '#ccc' }}>
                            <strong>Contact:</strong> {listing.owner.phonePrefix} {listing.owner.phoneNumber}
                        </div>
                        <a
                            href={`https://wa.me/${(listing.owner.phonePrefix + listing.owner.phoneNumber).replace(/\+/g, '')}`}
                            target="_blank"
                            className="btn"
                            style={{
                                background: '#2ecc71',
                                padding: '5px 15px',
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                color: 'white'
                            }}
                        >
                            💬 WhatsApp
                        </a>
                    </div>
                )}
                {menu && menu.categories && menu.categories.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <Link href={`/${listing.type}/${slug}/menu`} className="btn" style={{ background: 'var(--accent)', display: 'inline-block', textDecoration: 'none', color: 'white' }}>
                            📖 View Full Menu
                        </Link>
                    </div>
                )}
            </div>

            <div className="glass card">
                <h3>Reviews</h3>
                <div style={{ marginBottom: '30px' }}>
                    {reviews.map(review => (
                        <div key={review._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '15px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{review.user?.name || 'User'}</strong>
                                <span style={{ color: 'gold' }}>{'★'.repeat(review.rating)}</span>
                            </div>
                            <p>{review.comment}</p>
                            {review.image && (
                                <img
                                    src={review.image}
                                    alt="Review"
                                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}
                                    onClick={() => setSelectedImage(review.image)}
                                />
                            )}
                            <small style={{ color: '#aaa', marginTop: '5px', display: 'block' }}>
                                {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </small>
                        </div>
                    ))}
                    {reviews.length === 0 && <p>No reviews yet.</p>}
                </div>

                {user ? (
                    <form onSubmit={submitReview} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h4>Leave a Review</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <select
                                className="input"
                                value={newReview.rating}
                                onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                            >
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible</option>
                            </select>
                            <textarea
                                className="input"
                                placeholder="Write your experience..."
                                value={newReview.comment}
                                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '8px' }}>
                                    📷 Add Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => setNewReview({ ...newReview, image: e.target.files[0] })}
                                    />
                                </label>
                                {newReview.image && <span style={{ fontSize: '0.9rem' }}>{newReview.image.name}</span>}
                            </div>
                            <button className="btn">Post Review</button>
                        </div>
                    </form>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '20px' }}>
                        <p style={{ marginBottom: '15px' }}>Have you visited this place? Share your experience!</p>
                        <Link href="/login" className="btn" style={{ background: 'var(--primary)', display: 'inline-block', textDecoration: 'none', color: 'white' }}>
                            Login to Leave a Review
                        </Link>
                    </div>
                )}
            </div>

            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '30px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '3rem',
                            cursor: 'pointer',
                            zIndex: 1001
                        }}
                    >
                        &times;
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size"
                        style={{
                            maxHeight: '90vh',
                            maxWidth: '90vw',
                            borderRadius: '8px',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            cursor: 'default'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}


        </div>
    );
}
