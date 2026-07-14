'use client';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-bg-light border-t border-border-light pt-16 pb-8">
            <div className="container-wide">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-brand">TryToFindEverything</h2>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                            Discover the best places to stay, eat, and explore around the world.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">Quick Links</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="/explore?type=hotel" className="text-text-secondary hover:text-brand transition-colors text-sm">Hotels</Link>
                            <Link href="/explore?type=restaurant" className="text-text-secondary hover:text-brand transition-colors text-sm">Restaurants</Link>
                            <Link href="/explore?type=tour" className="text-text-secondary hover:text-brand transition-colors text-sm">Tours</Link>
                            <Link href="/explore?type=bujtina" className="text-text-secondary hover:text-brand transition-colors text-sm">Guesthouses</Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">Contact Us</h4>
                        <p className="text-text-secondary text-sm">📧 info@trytofindeverything.com</p>
                        
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-surface border border-border-light flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-all shadow-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-surface border border-border-light flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-all shadow-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border-light text-center">
                    <p className="text-text-secondary text-xs">
                        &copy; {new Date().getFullYear()} TryToFindEverything. Created with ❤️ for travelers.
                    </p>
                </div>
            </div>
        </footer>
    );
}
