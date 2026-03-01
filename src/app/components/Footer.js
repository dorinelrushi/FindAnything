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

                    <div className="social-links">
                        <span>📸</span>
                        <span>📘</span>
                        <span>🐦</span>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} TryToFindEverything. Created with ❤️ for the world.</p>
            </div>
        </footer>
    );
}
