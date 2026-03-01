import Script from 'next/script';
import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TryToFindEverything - Discover Hotels, Restaurants & More Worldwide',
  description: 'Find the best hotels, restaurants, bars, guesthouses, car rentals, and tours around the world. Your global travel and business discovery platform.',
  keywords: 'hotels, restaurants, tourism, travel, car rental, tours, guesthouses, discover',
  openGraph: {
    title: 'TryToFindEverything - Discover the World',
    description: 'Find the best hotels, restaurants, bars, guesthouses, car rentals, and tours around the world.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin="" />
      </head>
      <body suppressHydrationWarning={true} className={inter.className}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-TMCLY9JCVR" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-TMCLY9JCVR');
          `}
        </Script>
        <Providers>
          <Navbar />
          <main>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
