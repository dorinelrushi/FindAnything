'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StoryUpload from '@/app/components/StoryUpload';
import QRDashboard from '@/app/components/QRDashboard';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [myListings, setMyListings] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [pointsData, setPointsData] = useState({ points: 0, scanCount: 0 });
    const [selectedListingForQR, setSelectedListingForQR] = useState(null);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && (user.role === 'business' || user.role === 'admin')) {
            console.log('Dashboard loading for user ID:', user._id);
            fetchMyListings();
            fetchMyAds();
            fetchPoints();
        }
    }, [user]);

    const fetchPoints = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/business/scans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setPointsData({ points: data.points, scanCount: data.scanCount });
        }
    };

    const fetchMyListings = async () => {
        const token = localStorage.getItem('token');
        const userId = user._id || user.userId || user.id;
        console.log('Fetching listings for user:', userId);
        
        // Fetch all listings for owner, bypass pagination and status filters
        const res = await fetch(`/api/listings?owner=${userId}&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Listings received:', data.listings?.length || 0);
        if (data.listings) setMyListings(data.listings);
    };

    const fetchMyAds = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/ads/my-ads', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const active = data.ads.filter(ad => ad.status === 'active' && new Date(ad.endDate) > new Date());
            setMyAds(active);
        }
    };

    const deleteListing = async (id) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setMyListings(myListings.filter(l => l._id !== id));
        } else {
            alert('Failed to delete listing');
        }
    };

    if (loading || !user) return <div className="container-wide py-20 text-center font-bold">Loading...</div>;

    const ADD_OPTIONS = [
        { type: 'hotel', label: 'Hotel', icon: '🏨' },
        { type: 'restaurant', label: 'Restaurant', icon: '🍽️' },
        { type: 'bar', label: 'Bar', icon: '🍸' },
        { type: 'bujtina', label: 'Guesthouse', icon: '🏡' },
        { type: 'rentcar', label: 'Car Rental', icon: '🚗' },
        { type: 'tour', label: 'Tour', icon: '🏔️' },
    ];

    return (
        <main className="min-h-screen bg-white pb-20">
            <div className="container-wide py-10 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Business Dashboard</h1>
                        <p className="text-text-secondary font-medium italic">Welcome back, {user.name}!</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-5 py-3 bg-brand/10 text-brand rounded-xl font-black text-sm border border-brand/20 shadow-sm flex items-center gap-2">
                           💎 {pointsData.points.toLocaleString()} Points
                        </div>
                        <Link href="/dashboard/ads/manage" className="px-6 py-3 bg-text-primary text-white rounded-xl font-bold text-sm shadow-soft hover:bg-black transition-colors">
                            📊 Manage Ads
                        </Link>
                    </div>
                </div>

                {/* business Stories */}
                <section className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Business Stories</h2>
                    <div className="p-8 bg-bg-light rounded-[32px] border border-border-light border-dashed">
                        <StoryUpload />
                    </div>
                </section>

                {/* Add New Section */}
                <section className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Add New Listing</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {ADD_OPTIONS.map((opt) => (
                            <Link 
                                key={opt.type}
                                href={`/dashboard/add?type=${opt.type}`}
                                className="group flex flex-col items-center justify-center p-6 bg-white border border-border-light rounded-2xl hover:border-brand hover:shadow-airbnb transition-all text-center space-y-3"
                            >
                                <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                <span className="text-xs font-bold text-text-secondary group-hover:text-brand uppercase tracking-wider">{opt.label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* QR Rewards Section */}
                {selectedListingForQR ? (
                    <section className="space-y-8 animate-in fade-in zoom-in-95 duration-500 p-8 bg-white rounded-[40px] border border-brand/20 shadow-xl relative">
                        <button 
                            onClick={() => setSelectedListingForQR(null)}
                            className="absolute top-6 right-6 bg-bg-light hover:bg-border-light p-3 rounded-full transition-colors font-bold"
                        >
                            ✕ Close
                        </button>
                        <div className="space-y-1">
                            <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Business QR & Analytics</h2>
                            <p className="text-brand font-bold text-sm">Managing QR for: {selectedListingForQR.title}</p>
                        </div>
                        <QRDashboard 
                            listingId={selectedListingForQR._id} 
                            listingTitle={selectedListingForQR.title}
                            initialPoints={pointsData.points} 
                        />
                    </section>
                ) : (
                    <section className="space-y-6 p-8 bg-bg-light rounded-[40px] border border-border-light border-dashed">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Rewards Overview</h2>
                            <div className="text-2xl">💎 {pointsData.points.toLocaleString()} / 100k</div>
                        </div>
                        <p className="text-text-secondary text-sm font-medium">Select a listing below and click <span className="font-bold text-brand">"Analyze & QR"</span> to generate its unique codes and earn points from scans!</p>
                    </section>
                )}

                {/* My Listings Section */}
                <section className="space-y-6 pt-10 border-t">
                    <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">My Listings</h2>
                    
                    {myListings.length === 0 ? (
                        <div className="py-20 bg-bg-light rounded-3xl text-center">
                            <p className="text-text-secondary font-medium">You don't have any published listings yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {myListings.map((listing) => (
                                <div key={listing._id} className="group space-y-4">
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-bg-light relative border border-border-light">
                                        <img 
                                            src={listing.image || 'https://via.placeholder.com/400x300'} 
                                            className="w-full h-full object-cover"
                                            alt={listing.title}
                                        />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
                                            {listing.type}
                                        </div>
                                        {myAds.some(ad => ad.listing._id === listing._id) && (
                                            <div className="absolute top-3 right-3 bg-brand text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                                                Promoted
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-text-primary line-clamp-1 h-6">{listing.title}</h3>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <Link 
                                                href={`/dashboard/edit/${listing.slug || listing._id}`}
                                                className="w-full bg-bg-light hover:bg-border-light text-text-primary py-2 rounded-lg text-xs font-bold text-center transition-colors border border-border-light"
                                            >
                                                Edit
                                            </Link>
                                            <Link 
                                                href={`/dashboard/menu/${listing._id}`}
                                                className="w-full bg-bg-light hover:bg-border-light text-text-primary py-2 rounded-lg text-xs font-bold text-center transition-colors border border-border-light"
                                            >
                                                Menu
                                            </Link>
                                            <button 
                                                onClick={() => deleteListing(listing._id)}
                                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold text-center transition-colors border border-red-100"
                                            >
                                                Delete
                                            </button>
                                            {!myAds.some(ad => ad.listing._id === listing._id) && (
                                                <Link 
                                                    href={`/dashboard/ads/${listing._id}`}
                                                    className="w-full bg-brand/10 hover:bg-brand/20 text-brand py-2 rounded-lg text-xs font-bold text-center transition-colors border border-brand/20"
                                                >
                                                    Promote 🚀
                                                </Link>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    setSelectedListingForQR(listing);
                                                    window.scrollTo({ top: 400, behavior: 'smooth' });
                                                }}
                                                className="w-full col-span-2 bg-text-primary hover:bg-black text-white py-3 rounded-lg text-xs font-bold text-center transition-colors shadow-soft mt-1"
                                            >
                                                Analyze & QR Code 📈
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
