'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StoryUpload from '@/app/components/StoryUpload';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [myListings, setMyListings] = useState([]);
    const [myAds, setMyAds] = useState([]);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && (user.role === 'business' || user.role === 'admin')) {
            fetchMyListings();
            fetchMyAds();
        }
    }, [user]);

    const fetchMyListings = async () => {
        const res = await fetch(`/api/listings?owner=${user._id}`);
        const data = await res.json();
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
                    <div className="flex gap-4">
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
