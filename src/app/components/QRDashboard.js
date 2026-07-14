'use client';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';

export default function QRDashboard({ listingId, listingTitle, initialPoints = 0 }) {
    const [points, setPoints] = useState(initialPoints);
    const [scans, setScans] = useState(0);
    const [scanList, setScanList] = useState([]);
    const [byCountry, setByCountry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [offerPrompt, setOfferPrompt] = useState('');
    const [offer, setOffer] = useState(null);
    const [offerLoading, setOfferLoading] = useState(false);
    const [offerError, setOfferError] = useState('');
    const downloadRef = useRef();

    // Fetch per-listing scan stats + geo analytics
    useEffect(() => {
        if (!listingId) return;
        const fetchStats = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/business/scans?listingId=${listingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setPoints(data.points);
                    setScans(data.scanCount);
                    setScanList(data.scans || []);
                    setByCountry(data.byCountry || []);
                }
            } catch (e) {
                console.error('Failed to fetch scan stats', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [listingId]);

    const scanUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/scan/${listingId}`
        : `/scan/${listingId}`;

    const downloadQR = () => {
        const svg = document.getElementById(`qr-code-${listingId}`);
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `qr-${listingId}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const generateOffer = async () => {
        if (!offerPrompt.trim()) {
            setOfferError('Write a short idea, e.g. "2 days tour in Ephesus"');
            return;
        }
        setOfferError('');
        setOfferLoading(true);
        setOffer(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai/offer-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt: offerPrompt, listingId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setOfferError(data.error || 'Could not generate offer');
            } else {
                setOffer(data.offer);
            }
        } catch (e) {
            setOfferError('Network error — try again');
        } finally {
            setOfferLoading(false);
        }
    };

    const progress = (scans % 10) * 10;
    const adProgress = (points / 100000) * 100;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="bg-surface p-10 rounded-[40px] border border-border-light shadow-soft space-y-8 text-center flex flex-col items-center">
                    <div className="bg-bg-light p-6 rounded-[32px] border-4 border-white shadow-inner">
                        <QRCodeSVG 
                            id={`qr-code-${listingId}`}
                            value={scanUrl} 
                            size={200}
                            fgColor="#FF385C"
                            level="Q"
                        />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-text-primary tracking-tight">QR Code</h3>
                        {listingTitle && (
                            <p className="text-brand font-bold text-sm">{listingTitle}</p>
                        )}
                        <p className="text-text-secondary text-sm font-medium leading-relaxed px-4">
                            Download and place this in your business. Each <span className="font-bold">IP can scan once</span>. Every 10 scans earns you <span className="text-brand font-bold">5 points!</span>
                        </p>
                    </div>
                    <button 
                        onClick={downloadQR}
                        className="w-full max-w-[240px] bg-inverse text-on-inverse py-4 rounded-2xl font-bold hover:bg-inverse-hover transition-all shadow-soft flex items-center justify-center gap-3 active:scale-95"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download PNG
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-bg-light p-8 rounded-[40px] border border-border-light space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-brand tracking-widest">Rewards Program</span>
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Your Points: <span className="text-brand">{points.toLocaleString()}</span></h3>
                            </div>
                            <span className="text-4xl">💎</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-text-secondary">Progress to next 5 pts</span>
                                <span className="text-brand">{(scans % 10)}/10 scans</span>
                            </div>
                            <div className="h-4 bg-surface border border-border-light rounded-full overflow-hidden p-1">
                                <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-[11px] text-text-secondary italic font-medium leading-relaxed bg-brand/5 p-3 rounded-xl border border-brand/10">
                                ✨ You have total of {scans} lifetime scans (1 unique IP = 1 scan).
                            </p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border-light/50">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-text-secondary">Progress to Homepage Popup Ad</span>
                                <span className="text-text-primary">{points.toLocaleString()} / 100,000 pts</span>
                            </div>
                            <div className="h-4 bg-surface border border-border-light rounded-full overflow-hidden p-1">
                                <div className="h-full bg-text-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(adProgress, 100)}%` }}></div>
                            </div>
                            <button 
                                disabled={points < 100000}
                                className="w-full bg-surface text-text-primary py-4 border border-border-light rounded-2xl font-bold text-sm tracking-tight opacity-50 cursor-not-allowed transition-all hover:bg-bg-light"
                            >
                                Claim Popup Ad (Need 100k points)
                            </button>
                        </div>
                    </div>

                    <div className="bg-inverse text-on-inverse p-8 rounded-[40px] shadow-airbnb space-y-4">
                        <h4 className="text-lg font-black tracking-tight">How it works:</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm font-medium opacity-90">
                                <span className="bg-surface/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">1</span>
                                Print your QR Code and place it in your business.
                            </li>
                            <li className="flex gap-3 text-sm font-medium opacity-90">
                                <span className="bg-surface/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">2</span>
                                Each visitor IP can scan once — we log country, city & time.
                            </li>
                            <li className="flex gap-3 text-sm font-medium opacity-90">
                                <span className="bg-surface/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">3</span>
                                Earn points towards exclusive premium homepage ads!
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Scan analytics: country + time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface p-8 rounded-[32px] border border-border-light space-y-4">
                    <h3 className="text-lg font-black text-text-primary">Scans by country</h3>
                    {byCountry.length === 0 ? (
                        <p className="text-sm text-text-secondary">No scans yet. Share your QR to start tracking.</p>
                    ) : (
                        <ul className="space-y-2">
                            {byCountry.map((row) => (
                                <li key={row.country} className="flex justify-between items-center text-sm bg-bg-light rounded-xl px-4 py-3">
                                    <span className="font-bold">🌍 {row.country}</span>
                                    <span className="text-brand font-black">{row.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="bg-surface p-8 rounded-[32px] border border-border-light space-y-4">
                    <h3 className="text-lg font-black text-text-primary">Recent scans</h3>
                    {scanList.length === 0 ? (
                        <p className="text-sm text-text-secondary">When tourists scan, you will see city, country and time here.</p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {scanList.map((s, i) => (
                                <div key={i} className="text-sm border border-border-light rounded-xl p-3 flex justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-text-primary">
                                            {[s.city, s.region, s.country].filter(Boolean).join(', ') || 'Unknown location'}
                                        </p>
                                        <p className="text-xs text-text-secondary">{s.ipMasked}</p>
                                    </div>
                                    <p className="text-xs text-text-secondary whitespace-nowrap">{s.time}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Offer Generator */}
            <div className="bg-gradient-to-br from-brand/5 to-surface p-8 md:p-10 rounded-[40px] border border-brand/15 space-y-6">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">AI Offer Generator</span>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">QR campaign copy & image ideas</h3>
                    <p className="text-sm text-text-secondary max-w-2xl">
                        Write a short offer (example: <em>“2 days tour in Ephesus”</em>) and AI will suggest poster text, WhatsApp message, social captions and photo ideas for your QR campaign.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={offerPrompt}
                        onChange={(e) => setOfferPrompt(e.target.value)}
                        placeholder='e.g. 2 days tour in Ephesus'
                        className="flex-1 px-5 py-4 rounded-2xl border border-border-light bg-surface font-medium text-text-primary outline-none focus:border-brand"
                    />
                    <button
                        onClick={generateOffer}
                        disabled={offerLoading}
                        className="px-8 py-4 rounded-2xl bg-brand text-white font-bold hover:bg-brand-hover transition-all disabled:opacity-60 active:scale-95"
                    >
                        {offerLoading ? 'Generating…' : 'Generate offer ✨'}
                    </button>
                </div>
                {offerError && <p className="text-sm text-red-600 font-medium">{offerError}</p>}
                {offer && (
                    <div className="grid md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-4 bg-surface rounded-3xl border border-border-light p-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Headline</p>
                                <p className="text-xl font-black text-text-primary">{offer.headline}</p>
                                {offer.subheadline && <p className="text-sm text-text-secondary mt-1">{offer.subheadline}</p>}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">QR poster text</p>
                                <p className="text-sm leading-relaxed">{offer.qrPosterText}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">WhatsApp message</p>
                                <p className="text-sm bg-bg-light rounded-xl p-3">{offer.whatsappMessage}</p>
                            </div>
                            {offer.callToAction && (
                                <span className="inline-block bg-brand text-white text-xs font-black px-4 py-2 rounded-full">
                                    {offer.callToAction}
                                </span>
                            )}
                        </div>
                        <div className="space-y-4 bg-surface rounded-3xl border border-border-light p-6">
                            {offer.socialCaptions?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Social captions</p>
                                    <ul className="space-y-2">
                                        {offer.socialCaptions.map((c, i) => (
                                            <li key={i} className="text-sm bg-bg-light rounded-xl p-3">{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {offer.hashtags?.length > 0 && (
                                <p className="text-sm text-brand font-medium">{offer.hashtags.join(' ')}</p>
                            )}
                            {offer.imageIdeas?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Image ideas for QR campaign</p>
                                    <ul className="space-y-3">
                                        {offer.imageIdeas.map((img, i) => (
                                            <li key={i} className="border border-border-light rounded-xl p-3">
                                                <p className="font-bold text-sm">{img.title || `Idea ${i + 1}`}</p>
                                                <p className="text-xs text-text-secondary mt-1">{img.description}</p>
                                                {img.style && <p className="text-[11px] text-brand mt-1">Style: {img.style}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
