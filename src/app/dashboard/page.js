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
            // Only keep active ads to simplify checking
            const active = data.ads.filter(ad => ad.status === 'active' && new Date(ad.endDate) > new Date());
            setMyAds(active);
        }
    };

    const deleteListing = async (id) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        const res = await fetch(`/api/listings/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            setMyListings(myListings.filter(l => l._id !== id));
        } else {
            alert('Failed to delete listing');
        }
    };

    if (loading || !user) return <p>Loading...</p>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>Business Dashboard</h1>
                <Link href="/dashboard/ads/manage" className="btn" style={{ background: '#a29bfe', textDecoration: 'none' }}>📊 Manage My Ads</Link>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Business Stories</h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <StoryUpload />
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h2>Add New Listing</h2>
                <div className="grid">
                    <Link href="/dashboard/add?type=hotel" className="glass card" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3>Add Hotel</h3>
                    </Link>
                    <Link href="/dashboard/add?type=restaurant" className="glass card" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3>Add Restaurant</h3>
                    </Link>
                    <Link href="/dashboard/add?type=bar" className="glass card" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3>Add Bar</h3>
                    </Link>
                    <Link href="/dashboard/add?type=bujtina" className="glass card" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3>Add Bujtina</h3>
                    </Link>
                    <Link href="/dashboard/add?type=rentcar" className="glass card" style={{ textDecoration: 'none', color: 'white' }}>
                        <h3>Add Rent Car</h3>
                    </Link>
                </div>
            </div>

            <div>
                <h2>My Listings</h2>
                {myListings.length === 0 ? <p>You haven't uploaded any listings yet.</p> : (
                    <div className="grid">
                        {myListings.map(listing => (
                            <div key={listing._id} className="glass card">
                                {listing.image && <img src={listing.image} alt={listing.title} style={{ height: '150px', objectFit: 'cover', borderRadius: '8px' }} />}
                                <h3>{listing.title}</h3>
                                {myAds.some(ad => ad.listing._id === listing._id) && (
                                    <div style={{ fontSize: '0.75rem', color: '#55efc4', fontWeight: 'bold', marginBottom: '5px' }}>✅ Currently Promoted</div>
                                )}
                                <span style={{ fontSize: '0.8rem', background: 'var(--primary)', width: 'fit-content', padding: '2px 8px', borderRadius: '10px', marginBottom: '10px' }}>{listing.type}</span>
                                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', flexWrap: 'wrap' }}>
                                    <button onClick={() => deleteListing(listing._id)} className="btn" style={{ background: '#ff7675', padding: '5px 10px' }}>Delete</button>
                                    <Link href={`/dashboard/edit/${listing.slug || listing._id}`} className="btn" style={{ background: '#74b9ff', padding: '5px 10px', textDecoration: 'none', color: 'white' }}>Edit</Link>
                                    <Link href={`/dashboard/menu/${listing._id}`} className="btn" style={{ background: '#55efc4', padding: '5px 10px', textDecoration: 'none', color: 'white' }}>Menu</Link>
                                    {!myAds.some(ad => ad.listing._id === listing._id) && (
                                        <Link href={`/dashboard/ads/${listing._id}`} className="btn" style={{ background: '#a29bfe', padding: '5px 10px', textDecoration: 'none', color: 'white' }}>🚀 Promote</Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
