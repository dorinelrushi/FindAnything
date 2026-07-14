'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Hash function cyrb128
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3024733165, h3 = 3362453659, h4 = 2149369558;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h4 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0].map(x => x.toString(16).padStart(8, '0')).join('');
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("KorcaCity, scanning!", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18px 'Segoe UI'";
        ctx.fillText("KorcaCity, scanning!", 4, 17);
        return canvas.toDataURL();
    } catch (e) {
        return '';
    }
}

function getDeviceFingerprint() {
    if (typeof window === 'undefined') return '';
    const canvasData = getCanvasFingerprint();
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || '',
        navigator.deviceMemory || '',
        canvasData
    ];
    return cyrb128(components.join('||'));
}

function getOrCreateDeviceId() {
    if (typeof window === 'undefined') return '';
    let deviceId = localStorage.getItem('kc_device_id');
    if (deviceId) return deviceId;

    const name = 'kc_device_id=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            deviceId = c.substring(name.length, c.length);
            break;
        }
    }

    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    try {
        localStorage.setItem('kc_device_id', deviceId);
    } catch(e) {}

    const d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000 * 10)); // 10 years
    document.cookie = `kc_device_id=${deviceId};expires=${d.toUTCString()};path=/;SameSite=Lax`;

    return deviceId;
}

export default function QRScannerPage({ params }) {
    const router = useRouter();
    const [status, setStatus] = useState('Verifying scan...');
    const [pointsEarned, setPointsEarned] = useState(0);
    const [done, setDone] = useState(false);
    const [listingUrl, setListingUrl] = useState('/');
    const [listingId, setListingId] = useState('');
    const [scanMeta, setScanMeta] = useState(null);
    const [assistant, setAssistant] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        const fetchParams = async () => {
            const { id } = await params;
            if (id) {
                setListingId(id);
                performScan(id);
            }
        };
        fetchParams();
    }, [params]);

    const loadTouristAssistant = async (id, meta) => {
        setLoadingAI(true);
        try {
            const res = await fetch('/api/ai/tourist-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: id,
                    visitorCountry: meta?.country || meta?.countryCode || '',
                    visitorCity: meta?.city || '',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAssistant(data.assistant);
                setRecommendations(data.recommendations || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAI(false);
        }
    };

    const performScan = async (id) => {
        try {
            const deviceId = getOrCreateDeviceId();
            const deviceFingerprint = getDeviceFingerprint();

            const res = await fetch('/api/business/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, deviceId, deviceFingerprint })
            });
            const data = await res.json();

            if (data.listingUrl) setListingUrl(data.listingUrl);
            if (data.scanMeta) setScanMeta(data.scanMeta);

            if (data.success) {
                setPointsEarned(data.pointsAdded || 0);

                try {
                    const scanned = JSON.parse(localStorage.getItem('kc_scanned_listings') || '[]');
                    if (!scanned.includes(id)) {
                        scanned.push(id);
                        localStorage.setItem('kc_scanned_listings', JSON.stringify(scanned));
                    }
                } catch(e){}

                setStatus(
                    data.pointsAdded > 0
                        ? `🎉 Milestone! This business just earned ${data.pointsAdded} points!`
                        : `✅ Scan recorded! (${data.scanCount} total scans)`
                );

                // Personal AI recommendations after first successful scan
                loadTouristAssistant(id, data.scanMeta);
            } else {
                if (data.error === 'already_scanned') {
                    setStatus('⚠️ Already scanned from this network (one scan per IP). Still here for you!');
                    // Still help the tourist with recommendations
                    loadTouristAssistant(id, data.scanMeta);
                } else {
                    setStatus('⚠️ Scan failed or invalid QR code.');
                }
            }
        } catch (e) {
            setStatus('❌ Error connecting to server.');
        } finally {
            setDone(true);
        }
    };

    return (
        <main className="min-h-screen flex items-start justify-center p-6 bg-surface py-16">
            <div className="max-w-lg w-full space-y-6">
                <div className="text-center space-y-8 p-10 bg-bg-light rounded-[40px] border border-border-light shadow-xl">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl ${done ? 'bg-brand/10 text-brand' : 'bg-bg-light border border-border-light animate-pulse'}`}>
                        {done ? '✨' : '⏳'}
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">
                            {done ? 'QR Verified!' : 'Verifying…'}
                        </h1>
                        <p className="text-text-secondary font-medium leading-relaxed">
                            {status}
                        </p>
                        {pointsEarned > 0 && (
                            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand font-black px-5 py-3 rounded-2xl text-sm animate-bounce">
                                💎 +{pointsEarned} Points Earned!
                            </div>
                        )}
                        {scanMeta && (
                            <div className="text-left bg-surface rounded-2xl border border-border-light p-4 text-sm space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand">Scan location</p>
                                <p className="font-bold text-text-primary">
                                    🌍 {[scanMeta.city, scanMeta.region, scanMeta.country || scanMeta.countryCode].filter(Boolean).join(', ') || 'Location unknown'}
                                </p>
                                {scanMeta.scannedAt && (
                                    <p className="text-text-secondary text-xs">
                                        🕒 {new Date(scanMeta.scannedAt).toLocaleString()}
                                    </p>
                                )}
                                {scanMeta.ipMasked && (
                                    <p className="text-text-secondary text-xs">IP: {scanMeta.ipMasked}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={() => router.push(listingUrl)}
                            className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-soft active:scale-95"
                        >
                            {listingUrl !== '/' ? 'Go to Business Page' : 'Back to Homepage'}
                        </button>
                    </div>
                </div>

                {/* AI Tourist Assistant */}
                <div className="p-8 bg-surface rounded-[32px] border border-border-light shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧭</span>
                        <h2 className="text-xl font-black text-text-primary">AI Tourist Assistant</h2>
                    </div>
                    {loadingAI && (
                        <p className="text-sm text-text-secondary animate-pulse">Preparing personal recommendations…</p>
                    )}
                    {assistant && (
                        <div className="space-y-4 text-left">
                            <p className="font-bold text-text-primary">{assistant.greeting}</p>
                            <p className="text-sm text-text-secondary leading-relaxed">{assistant.aboutPlace}</p>
                            {assistant.personalNote && (
                                <p className="text-sm bg-brand/5 border border-brand/10 rounded-xl p-3 text-brand font-medium">
                                    {assistant.personalNote}
                                </p>
                            )}
                            {assistant.tips?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Tips</p>
                                    <ul className="space-y-2">
                                        {assistant.tips.map((tip, i) => (
                                            <li key={i} className="text-sm text-text-primary flex gap-2">
                                                <span className="text-brand font-black">•</span> {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {assistant.itineraryIdeas?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Ideas for your day</p>
                                    <ul className="space-y-2">
                                        {assistant.itineraryIdeas.map((idea, i) => (
                                            <li key={i} className="text-sm text-text-primary bg-bg-light rounded-xl p-3">{idea}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    {recommendations.length > 0 && (
                        <div className="pt-2 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Recommended nearby</p>
                            <div className="grid gap-2">
                                {recommendations.slice(0, 4).map((r) => (
                                    <Link
                                        key={r.id}
                                        href={r.path}
                                        className="flex items-center gap-3 p-3 rounded-2xl border border-border-light hover:border-brand/40 hover:bg-brand/5 transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-bg-light overflow-hidden flex-shrink-0">
                                            {r.image ? (
                                                <img src={r.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-lg">📍</div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{r.title}</p>
                                            <p className="text-xs text-text-secondary capitalize">{r.type}{r.city ? ` · ${r.city}` : ''}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
