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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  description: 'Find the best hotels, restaurants, bars, guesthouses, car rentals, and tours around the world. Your global travel and business discovery platform.',
  keywords: 'hotels, restaurants, tourism, travel, car rental, tours, guesthouses, discover, korca city, find anything, worldwide directory',
  authors: [{ name: 'TryToFindEverything' }],
  creator: 'TryToFindEverything',
  publisher: 'TryToFindEverything',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://trytofindeverything.online'),
  alternates: {},
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
        alt: 'TryToFindEverything'
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
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme before paint to avoid flash of wrong theme on all devices */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='dark'||(t!=='light'&&d)?'dark':'light';if(r==='dark')document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin="" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

      </head>
      <body suppressHydrationWarning={true} className={inter.className}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7525157885187689"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
          <DailyReminder />
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
