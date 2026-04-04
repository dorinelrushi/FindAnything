'use client';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';

export default function QRDashboard({ listingId, listingTitle, initialPoints = 0 }) {
    const [points, setPoints] = useState(initialPoints);
    const [scans, setScans] = useState(0);
    const [loading, setLoading] = useState(true);
    const downloadRef = useRef();

    // Fetch per-listing scan stats from the API
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
                }
            } catch (e) {
                console.error('Failed to fetch scan stats', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [listingId]);

    const scanUrl = `${window.location.origin}/scan/${listingId}`;

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

    const progress = (scans % 10) * 10;
    const adProgress = (points / 100000) * 100;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-white p-10 rounded-[40px] border border-border-light shadow-soft space-y-8 text-center flex flex-col items-center">
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
                        Download and place this in your business. Every 10 scans earns you <span className="text-brand font-bold">5 points!</span>
                    </p>
                </div>
                <button 
                    onClick={downloadQR}
                    className="w-full max-w-[240px] bg-text-primary text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-soft flex items-center justify-center gap-3 active:scale-95"
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
                        <div className="h-4 bg-white border border-border-light rounded-full overflow-hidden p-1">
                            <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[11px] text-text-secondary italic font-medium leading-relaxed bg-brand/5 p-3 rounded-xl border border-brand/10">
                            ✨ You have total of {scans} lifetime scans!
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border-light/50">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-text-secondary">Progress to Homepage Popup Ad</span>
                            <span className="text-text-primary">{points.toLocaleString()} / 100,000 pts</span>
                        </div>
                        <div className="h-4 bg-white border border-border-light rounded-full overflow-hidden p-1">
                            <div className="h-full bg-text-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(adProgress, 100)}%` }}></div>
                        </div>
                        <button 
                            disabled={points < 100000}
                            className="w-full bg-white text-text-primary py-4 border border-border-light rounded-2xl font-bold text-sm tracking-tight opacity-50 cursor-not-allowed transition-all hover:bg-bg-light"
                        >
                            Claim Popup Ad (Need 100k points)
                        </button>
                    </div>
                </div>

                <div className="bg-text-primary text-white p-8 rounded-[40px] shadow-airbnb space-y-4">
                    <h4 className="text-lg font-black tracking-tight">How it works:</h4>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm font-medium opacity-90">
                            <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">1</span>
                            Print your QR Code and place it in your business.
                        </li>
                        <li className="flex gap-3 text-sm font-medium opacity-90">
                            <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">2</span>
                            Encourage customers to scan it during their visit.
                        </li>
                        <li className="flex gap-3 text-sm font-medium opacity-90">
                            <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">3</span>
                            Earn points towards exclusive premium homepage ads!
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
