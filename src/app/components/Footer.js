'use client';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section main">
                    <h2 className="footer-logo">TryToFindEverything</h2>
                    <p>Discover the best places to stay, eat, and explore around the world.</p>
                </div>

                <div className="footer-section links">
                    <h4>Quick Links</h4>
                    <Link href="/explore?type=hotel">Hotels</Link>
                    <Link href="/explore?type=restaurant">Restaurants</Link>
                    <Link href="/explore?type=tour">Tours</Link>
                    <Link href="/explore?type=bujtina">Guesthouses</Link>
                </div>

                <div className="footer-section contact">
                    <h4>Contact Us</h4>
                    <p>📧 info@trytofindeverything.com</p>

                    <div className="social-links" style={{ display: 'flex', gap: '15px', marginTop: '15px', paddingBottom: '20px' }}>
                        <a href="#" aria-label="Instagram" style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 4px 15px rgba(220, 39, 67, 0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="#" aria-label="Facebook" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 4px 15px rgba(24, 119, 242, 0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                        <a href="#" aria-label="Twitter" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1da1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 4px 15px rgba(29, 161, 242, 0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} TryToFindEverything. Created with ❤️ for the world.</p>
            </div>
        </footer>
    );
}
