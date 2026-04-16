'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QRScannerPage({ params }) {
    const router = useRouter();
    const [status, setStatus] = useState('Verifying scan...');
    const [pointsEarned, setPointsEarned] = useState(0);
    const [done, setDone] = useState(false);
    const [listingUrl, setListingUrl] = useState('/');

    useEffect(() => {
        const fetchParams = async () => {
            const { id } = await params;
            if (id) performScan(id);
        };
        fetchParams();
    }, [params]);

    const performScan = async (listingId) => {
        try {
            const res = await fetch('/api/business/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId })
            });
            const data = await res.json();

            if (data.success) {
                setPointsEarned(data.pointsAdded || 0);
                if (data.listingUrl) setListingUrl(data.listingUrl);
                setStatus(
                    data.pointsAdded > 0
                        ? `🎉 Milestone! This business just earned ${data.pointsAdded} points! Redirecting...`
                        : `✅ Scan recorded! Redirecting... (${data.scanCount} total scans)`
                );
                
                setTimeout(() => {
                    if (data.listingUrl) router.push(data.listingUrl);
                }, 2500);
            } else {
                setStatus('⚠️ Scan failed or invalid QR code.');
            }
        } catch (e) {
            setStatus('❌ Error connecting to server.');
        } finally {
            setDone(true);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-white">
            <div className="max-w-md w-full text-center space-y-8 p-10 bg-bg-light rounded-[40px] border border-border-light shadow-xl">
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
                </div>
                <div className="pt-6">
                    <button
                        onClick={() => router.push(listingUrl)}
                        className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-soft active:scale-95"
                    >
                        {listingUrl !== '/' ? 'Go to Business Page' : 'Back to Homepage'}
                    </button>
                </div>
            </div>
        </main>
    );
}
