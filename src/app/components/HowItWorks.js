'use client';

import Link from 'next/link';
import {
  Building2,
  Compass,
  QrCode,
  Gem,
  Megaphone,
  MessageSquareHeart,
  Share2,
  Star,
  MapPin,
  ArrowRight,
  ScanLine,
  Users,
} from 'lucide-react';

const BUSINESS_POINTS = [
  {
    icon: QrCode,
    title: 'Share your QR code',
    text: 'Print or show a unique code at your place. Guests scan it when they visit.',
  },
  {
    icon: Gem,
    title: 'Earn points from real scans',
    text: 'Each internet connection counts once. Every 10 scans earn you 5 points.',
  },
  {
    icon: Megaphone,
    title: 'Advertise for free',
    text: 'Collect points to unlock free homepage ads and get more visitors — no extra ad spend required.',
  },
];

const TOURIST_POINTS = [
  {
    icon: MapPin,
    title: 'Discover great places',
    text: 'Hotels, restaurants, bars, tours, guesthouses, and car rentals — all in one place.',
  },
  {
    icon: MessageSquareHeart,
    title: 'Share your experience',
    text: 'Leave honest reviews and tips so other travelers know what is worth their time.',
  },
  {
    icon: Share2,
    title: 'Suggest to others',
    text: 'Recommend favorites, join the community chat, and help friends plan better trips.',
  },
];

const STEPS = [
  {
    step: '01',
    icon: Users,
    title: 'Join free',
    text: 'Sign up as a traveler or as a business. Both sides use the same simple platform.',
  },
  {
    step: '02',
    icon: Building2,
    title: 'List or explore',
    text: 'Businesses add places. Tourists search, filter, and open maps to find what they need.',
  },
  {
    step: '03',
    icon: ScanLine,
    title: 'Connect with QR',
    text: 'Visitors scan at the venue. Businesses grow points. Tourists get local tips instantly.',
  },
  {
    step: '04',
    icon: Star,
    title: 'Grow together',
    text: 'Reviews, suggestions, and free ads turn real visits into more visibility for everyone.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="pt-12 border-t border-border-light scroll-mt-24 space-y-12"
      aria-labelledby="how-it-works-heading"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
          <Compass className="w-3.5 h-3.5" aria-hidden />
          How it works
        </span>
        <h2
          id="how-it-works-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight"
        >
          We help businesses grow
          <span className="text-brand"> and </span>
          tourists explore
        </h2>
        <p className="text-text-secondary text-base md:text-lg leading-relaxed">
          TryToFindEverything is a free discovery platform. Businesses get real visitors and free
          advertising through QR scans and points. Tourists find places, share experiences, and
          suggest great spots to others — simply and clearly.
        </p>
      </div>

      {/* Two audiences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Business card */}
        <article className="relative overflow-hidden rounded-[28px] border border-border-light bg-white shadow-soft hover:shadow-airbnb transition-shadow">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                <Building2 className="w-7 h-7" strokeWidth={2.2} aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand">
                  For businesses
                </p>
                <h3 className="text-2xl font-extrabold text-text-primary">
                  Get seen. Earn points. Advertise free.
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  List your hotel, restaurant, bar, guesthouse, tour, or rental. Guests scan your QR —
                  you earn points toward free homepage advertising.
                </p>
              </div>
            </div>

            {/* Mini illustration: scan → points → ad */}
            <div
              className="flex items-center justify-between gap-2 rounded-2xl bg-bg-light border border-border-light/60 px-4 py-5"
              aria-hidden
            >
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <QrCode className="w-6 h-6 text-text-primary" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Scan
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-border-light shrink-0" />
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <Gem className="w-6 h-6 text-brand" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Points
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-border-light shrink-0" />
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <Megaphone className="w-6 h-6 text-text-primary" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Free ad
                </span>
              </div>
            </div>

            <ul className="space-y-5">
              {BUSINESS_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-bg-light border border-border-light flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand" aria-hidden />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-[15px]">{title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3.5 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors shadow-soft active:scale-[0.98]"
            >
              List your business
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </article>

        {/* Tourist card */}
        <article className="relative overflow-hidden rounded-[28px] border border-border-light bg-white shadow-soft hover:shadow-airbnb transition-shadow">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-text-primary" aria-hidden />
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-text-primary/5 text-text-primary flex items-center justify-center">
                <Compass className="w-7 h-7" strokeWidth={2.2} aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  For tourists
                </p>
                <h3 className="text-2xl font-extrabold text-text-primary">
                  Explore. Share. Help others.
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Find where to stay, eat, and go. After a visit, tell others what you liked — your
                  experience helps the next traveler choose well.
                </p>
              </div>
            </div>

            {/* Mini illustration: discover → share → community */}
            <div
              className="flex items-center justify-between gap-2 rounded-2xl bg-bg-light border border-border-light/60 px-4 py-5"
              aria-hidden
            >
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <MapPin className="w-6 h-6 text-text-primary" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Find
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-border-light shrink-0" />
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <Star className="w-6 h-6 text-brand" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Review
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-border-light shrink-0" />
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-soft">
                  <Share2 className="w-6 h-6 text-text-primary" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide text-center">
                  Suggest
                </span>
              </div>
            </div>

            <ul className="space-y-5">
              {TOURIST_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-bg-light border border-border-light flex items-center justify-center">
                    <Icon className="w-4 h-4 text-text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-[15px]">{title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3.5 rounded-xl bg-text-primary text-white font-bold text-sm hover:bg-black transition-colors shadow-soft active:scale-[0.98]"
            >
              Start exploring
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </article>
      </div>

      {/* Simple 4-step flow */}
      <div className="rounded-[28px] bg-bg-light border border-border-light p-8 md:p-10 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h3 className="text-xl md:text-2xl font-extrabold text-text-primary">
            Simple for everyone
          </h3>
          <p className="text-sm md:text-base text-text-secondary">
            Four clear steps — no jargon. If you can use a phone, you can use this platform.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, icon: Icon, title, text }) => (
            <li
              key={step}
              className="relative bg-white rounded-2xl border border-border-light p-6 shadow-soft space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-[0.2em] text-brand">{step}</span>
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-text-primary text-lg">{title}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
