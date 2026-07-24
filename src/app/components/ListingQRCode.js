'use client';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

/**
 * Public QR section for every business listing page.
 * QR always points to /scan/{listingId} — works for old and new listings
 * without storing anything extra in the database.
 */
export default function ListingQRCode({ listingId, listingTitle, scanCount = 0, compact = false }) {
    const [copied, setCopied] = useState(false);
    const [scanUrl, setScanUrl] = useState(`/scan/${listingId}`);

    useEffect(() => {
        if (!listingId || typeof window === 'undefined') return;
        setScanUrl(`${window.location.origin}/scan/${listingId}`);
    }, [listingId]);

    if (!listingId) return null;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(scanUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = scanUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (compact) {
        return (
            <div className="flex flex-col items-center gap-3 p-5 bg-bg-light rounded-2xl border border-border-light">
                <div className="bg-surface p-3 rounded-xl border border-border-light shadow-sm">
                    <QRCodeSVG
                        value={scanUrl}
                        size={120}
                        fgColor="#FF385C"
                        level="Q"
                        includeMargin={false}
                    />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-brand">Scan QR</p>
                    <p className="text-[11px] text-text-secondary font-medium leading-snug">
                        Visit & unlock AI tips
                    </p>
                    {scanCount > 0 && (
                        <p className="text-[10px] font-bold text-text-secondary">{scanCount} scans</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-6 pt-10 border-t border-border-light" id="listing-qr">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                        Visit &amp; connect
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
                        Business QR Code
                    </h2>
                    <p className="text-text-secondary text-sm md:text-base max-w-xl leading-relaxed">
                        Scan this code with your phone to check in, help this business earn rewards,
                        and get personal AI travel tips for your stay.
                    </p>
                </div>
                {scanCount > 0 && (
                    <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-black border border-brand/15 self-start sm:self-auto">
                        <span>📱</span>
                        {scanCount.toLocaleString()} scans
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center bg-gradient-to-br from-brand/5 via-surface to-bg-light p-6 md:p-10 rounded-[32px] border border-brand/15 shadow-soft">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute -inset-3 bg-brand/10 rounded-[28px] blur-sm" />
                        <div className="relative bg-surface p-5 md:p-6 rounded-[24px] border-4 border-white shadow-lg">
                            <QRCodeSVG
                                value={scanUrl}
                                size={180}
                                fgColor="#FF385C"
                                bgColor="#FFFFFF"
                                level="Q"
                                includeMargin={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-5 text-center md:text-left">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-text-primary tracking-tight">
                            {listingTitle || 'Scan to visit'}
                        </h3>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                            Point your camera at the QR code — you&apos;ll land on a verified check-in page
                            with recommendations nearby. One scan per network helps local businesses grow.
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                        {[
                            { icon: '✅', text: 'Verified visit' },
                            { icon: '🧭', text: 'AI tourist tips' },
                            { icon: '💎', text: 'Business rewards' },
                        ].map((item) => (
                            <li
                                key={item.text}
                                className="flex items-center gap-2 bg-surface/80 border border-border-light rounded-xl px-3 py-2.5 text-xs font-bold text-text-primary"
                            >
                                <span>{item.icon}</span>
                                {item.text}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <a
                            href={scanUrl}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-all shadow-soft active:scale-95"
                        >
                            Open scan page
                        </a>
                        <button
                            type="button"
                            onClick={copyLink}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface border border-border-light text-text-primary font-bold text-sm hover:bg-bg-light transition-all active:scale-95"
                        >
                            {copied ? '✓ Link copied' : 'Copy QR link'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
