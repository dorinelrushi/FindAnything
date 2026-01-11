'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const initialOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
};

export default function CreateAd() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const listingId = params.listingId;

    const [plan, setPlan] = useState('1_week');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [phone, setPhone] = useState('');
    const [buttonText, setButtonText] = useState('Contact Now');
    const [socialMedia, setSocialMedia] = useState({ facebook: '', instagram: '', website: '' });

    const [adCreated, setAdCreated] = useState(false);
    const [listing, setListing] = useState(null);
    const [existingAd, setExistingAd] = useState(null);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'business' && user.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (listingId) {
            fetchListing();
            checkExistingAd();
        }
    }, [listingId]);

    const checkExistingAd = async () => {
        const res = await fetch(`/api/ads/check/${listingId}`);
        const data = await res.json();
        if (data.activeAd) {
            setExistingAd(data.activeAd);
        }
    };

    const fetchListing = async () => {
        const res = await fetch(`/api/listings/${listingId}`);
        const data = await res.json();
        if (data.listing) {
            setListing(data.listing);
            setTitle(`Visit ${data.listing.title}`);
            setDescription(data.listing.description.replace(/<[^>]*>?/gm, '').substring(0, 100)); // Clean HTML
            if (user) setWhatsapp(user.phoneNumber || '');
        }
    };

    if (loading || !user) return <div className="container"><p>Loading...</p></div>;

    const createOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/ads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    listingId,
                    plan,
                    content: {
                        title,
                        description,
                        whatsapp,
                        phone,
                        buttonText,
                        socialMedia
                    }
                }),
            });

            const order = await response.json();
            if (order.error) {
                console.error("Server creation error:", order.error);
                if (order.error === "jwt expired" || response.status === 401) {
                    alert("Your session has expired. Please log in again.");
                    localStorage.clear(); // Force clear everything
                    window.location.href = '/login'; // Hard redirect
                    throw new Error("SESSION_EXPIRED");
                }
                throw new Error(order.error);
            }
            console.log("Order created successfully:", order.orderID);
            return order.orderID;
        } catch (err) {
            console.error("Create Order Error:", err);
            throw err;
        }
    };

    const onApprove = async (data) => {
        try {
            console.log("OnApprove triggered with data:", data);
            const response = await fetch("/api/ads/capture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderID: data.orderID,
                }),
            });

            const captureData = await response.json();
            console.log("Capture response:", captureData);

            if (captureData.success) {
                setAdCreated(true);
                setTimeout(() => router.push('/dashboard'), 3000);
            } else {
                alert("Payment capture failed: " + (captureData.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Capture Error:", err);
            alert("An error occurred during payment capture.");
        }
    };

    const onError = (err) => {
        console.error("PayPal Error:", err);
        alert("PayPal Checkout could not be initialized or failed. Please check your console.");
    };

    if (adCreated) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div className="glass card" style={{ padding: '50px' }}>
                    <h2 style={{ color: '#55efc4' }}>Payment Successful!</h2>
                    <p>Your ad is now active and will be visible on the homepage.</p>
                    <p>Redirecting you back to dashboard...</p>
                </div>
            </div>
        );
    }

    if (existingAd) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div className="glass card" style={{ padding: '50px' }}>
                    <h2 style={{ color: '#ff7675' }}>Promotion Already Active</h2>
                    <p>This listing ({listing?.title}) is already being promoted on the homepage.</p>
                    <p>The current ad will expire on: <strong>{new Date(existingAd.endDate).toLocaleDateString()}</strong></p>
                    <div style={{ marginTop: '30px' }}>
                        <Link href="/dashboard" className="btn" style={{ textDecoration: 'none' }}>Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Create Advertisement for {listing?.title}</h1>
            <p style={{ color: '#ccc', marginBottom: '30px' }}>Boost your business and reach more people in Korcha!</p>

            <div className="grid">
                <div className="glass card" style={{ padding: '30px' }}>
                    <h3>1. Select Plan</h3>
                    <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                        <div
                            className={`plan-option ${plan === '1_week' ? 'active' : ''}`}
                            onClick={() => setPlan('1_week')}
                            style={{
                                padding: '20px',
                                border: '2px solid',
                                borderColor: plan === '1_week' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                flex: 1,
                                textAlign: 'center',
                                background: plan === '1_week' ? 'rgba(108, 92, 231, 0.1)' : 'transparent'
                            }}
                        >
                            <h4>1 Week</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$10</p>
                        </div>
                        <div
                            className={`plan-option ${plan === '2_weeks' ? 'active' : ''}`}
                            onClick={() => setPlan('2_weeks')}
                            style={{
                                padding: '20px',
                                border: '2px solid',
                                borderColor: plan === '2_weeks' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                flex: 1,
                                textAlign: 'center',
                                background: plan === '2_weeks' ? 'rgba(108, 92, 231, 0.1)' : 'transparent'
                            }}
                        >
                            <h4>2 Weeks</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$20</p>
                        </div>
                    </div>

                    <h3>2. Ad Content</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        <label>Ad Title</label>
                        <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Best Pizza in Town!" />

                        <label>Description</label>
                        <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what makes you special..." rows="3" />

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label>WhatsApp Number</label>
                                <input className="input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+355..." />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Button Text</label>
                                <input
                                    className="input"
                                    value={buttonText}
                                    onChange={e => setButtonText(e.target.value)}
                                    placeholder="e.g. Call Now, Reservo tani"
                                />
                            </div>
                        </div>

                        <h4>Social Media (Optional)</h4>
                        <input className="input" value={socialMedia.facebook} onChange={e => setSocialMedia({ ...socialMedia, facebook: e.target.value })} placeholder="Facebook URL" />
                        <input className="input" value={socialMedia.instagram} onChange={e => setSocialMedia({ ...socialMedia, instagram: e.target.value })} placeholder="Instagram URL" />
                        <input className="input" value={socialMedia.website} onChange={e => setSocialMedia({ ...socialMedia, website: e.target.value })} placeholder="Website URL" />
                    </div>
                </div>

                <div className="glass card" style={{ padding: '30px' }}>
                    <h3>3. Checkout</h3>
                    <p style={{ margin: '20px 0' }}>Plan: <strong>{plan.replace('_', ' ')}</strong></p>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Total Amount: <strong>${plan === '1_week' ? '10.00' : '20.00'}</strong></p>

                    {!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                        <p style={{ color: '#ff7675' }}>PayPal is not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env.</p>
                    ) : (
                        <PayPalScriptProvider options={initialOptions}>
                            <PayPalButtons
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                                style={{ layout: "vertical" }}
                            />
                        </PayPalScriptProvider>
                    )}
                </div>
            </div>

            <style jsx>{`
                .input {
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: white;
                    width: 100%;
                }
                label {
                    font-size: 0.9rem;
                    color: #aaa;
                }
            `}</style>
        </div>
    );
}
