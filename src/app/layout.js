import Script from 'next/script';
import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DailyReminder from './components/DailyReminder';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'TryToFindEverything - Discover Hotels, Restaurants & More Worldwide',
    template: '%s | TryToFindEverything'
  },
  description: 'Find the best hotels, restaurants, bars, guesthouses, car rentals, and tours around the world. Your global travel and business discovery platform.',
  keywords: 'hotels, restaurants, tourism, travel, car rental, tours, guesthouses, discover, korca city, find anything',
  authors: [{ name: 'TryToFindEverything' }],
  creator: 'TryToFindEverything',
  publisher: 'TryToFindEverything',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://trytofindeverything.online'),
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'TryToFindEverything - Discover the World',
    description: 'Find the best hotels, restaurants, bars, guesthouses, car rentals, and tours around the world.',
    url: 'https://trytofindeverything.online',
    siteName: 'TryToFindEverything',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TryToFindEverything - Discover the World',
    description: 'Find the best places around the world.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin="" />
        <Script
          src="https://emrldtp.cc/NTA0MTA5.js?t=504109"
          strategy="afterInteractive"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
        />
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
      <Script src="https://pl28977517.profitablecpmratenetwork.com/35/ac/ab/35acab0d8e94bea1526b56bbf9a102e2.js" />
        <Script async="async" data-cfasync="false" src="https://pl28977516.profitablecpmratenetwork.com/5712706d5bc1e6693569ed677b259f1e/invoke.js"/>
        <Providers>
          <DailyReminder />
          <Navbar />
          <main>
            {children}
            <div className="flex justify-center my-4">
           <div id="container-5712706d5bc1e6693569ed677b259f1e"></div>
        </div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
