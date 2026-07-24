'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FeaturedAds from '@/app/components/FeaturedAds';
import Stories from '@/app/components/Stories';
import HowItWorks from '@/app/components/HowItWorks';
import BusinessLeaderboard from '@/app/components/BusinessLeaderboard';
import { useFavorites } from '@/context/FavoritesContext';
import CommunityChatPopup from '@/app/components/CommunityChatPopup';
import { MessageCircle } from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All', emoji: '🌟' },
  { id: 'city', label: 'City', emoji: '🏘️' },
  { id: 'hotel', label: 'Hotels', emoji: '🏨' },
  { id: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
  { id: 'bar', label: 'Bars', emoji: '🍸' },
  { id: 'bujtina', label: 'Guesthouses', emoji: '🏡' },
  { id: 'tour', label: 'Tours', emoji: '🏔️' },
  { id: 'rentcar', label: 'Car Rentals', emoji: '🚗' },
];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const { toggleFavorite, isFavorite } = useFavorites();
  const [listingPage, setListingPage] = useState(1);
  const [listingTotalPages, setListingTotalPages] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);
  const isFirstRunListing = useRef(true);
  const isFirstRunBlog = useRef(true);

  useEffect(() => {
    fetchListings();
  }, [filter, search, listingPage]);

  useEffect(() => {
    fetchBlogs();
  }, [blogPage]);

  useEffect(() => {
    if (isFirstRunListing.current) {
      isFirstRunListing.current = false;
      return;
    }
    const listingsSection = document.getElementById('listings-grid');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [listingPage]);

  useEffect(() => {
    if (isFirstRunBlog.current) {
      isFirstRunBlog.current = false;
      return;
    }
    const blogsSection = document.getElementById('blogs-section');
    if (blogsSection) {
      blogsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blogPage]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch(`/api/blog?limit=3&page=${blogPage}`);
      const data = await res.json();
      setBlogs(data.blogs || []);
      setBlogTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '10',
      page: listingPage.toString()
    });
    if (filter) params.append('type', filter);
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
      setListingTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch listings', error);
    }
    setLoading(false);
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <main className="container-wide py-8 space-y-12">
      {/* Stories Section */}
      <Stories />

      {/* Hero & Filter Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4 pt-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-primary">
            Explore the World
          </h1>
          <p className="text-[16px] lg:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
            Find the best places to stay, eat, and unique experiences everywhere you go.
          </p>
        </div>

        {/* Search Bar - Airbnb Style */}
        <div className="max-w-2xl mx-auto">
          <div className="search-pill">
            <input
              type="text"
              placeholder="Search for places, hotels, restaurants..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-text-primary text-[15px] lg:placeholder:text-[17px]  placeholder:text-[#aba9a9] font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/explore?search=${search}`;
                }
              }}
            />
            <button
              onClick={() => window.location.href = `/explore?search=${search}`}
              className="bg-brand text-white p-3 rounded-full hover:bg-brand-hover transition-colors shadow-sm active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex lg:justify-center items-center gap-[5px] overflow-x-auto pb-4 scrollbar-hide pt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { 
                if (cat.id === 'city') {
                  window.location.href = '/explore?type=city';
                } else {
                  setFilter(cat.id); 
                  setListingPage(1); 
                }
              }}
              className={`flex flex-col items-center gap-2 min-w-[70px] lg:min-w-[100px] pb-3 transition-all border-b-2 hover:text-brand hover:border-brand-hover ${filter === cat.id ? 'border-brand text-brand' : 'border-transparent text-text-secondary opacity-70'
                }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Ads (Redesigned inside its own component) */}
      <FeaturedAds />

      {/* Listings Grid */}
      <section className="space-y-8 scroll-mt-24" id="listings-grid">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {listings.map((listing) => (
            <Link
              key={listing._id}
              href={`/${listing.type}/${listing.slug || listing._id}`}
              className="group space-y-3 cursor-pointer"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-bg-light relative">
                <img
                  src={listing.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
                  {listing.type}
                </div>
                {/* Favorite Button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing); }}
                  className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 active:scale-90 transition-all z-10"
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill={isFavorite(listing._id) ? "#FF385C" : "none"}
                    stroke={isFavorite(listing._id) ? "#FF385C" : "currentColor"}
                    strokeWidth="2.5"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-text-primary line-clamp-1 group-hover:text-brand transition-colors">{listing.title}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-brand">★</span>
                    <span className="font-bold">4.9</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      window.location.href = `/explore?city=${listing.city}`; 
                    }}
                    className="text-[13px] font-bold text-text-secondary hover:text-brand transition-colors"
                  >
                    📍 {listing.city}
                  </button>
                </div>
                <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed opacity-80 pt-1">
                  {stripHtml(listing.description).substring(0, 80)}...
                </p>
                <div className="pt-2">
                  <span className="font-black text-text-primary text-lg">
                    {listing.price ? (typeof listing.price === 'string' && (listing.price.includes('€') || listing.price.includes('Lek') || listing.price.includes('$')) ? listing.price : `€${listing.price}`) : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {listings.length === 0 && !loading && (
          <div className="text-center py-20 bg-bg-light rounded-3xl">
            <p className="text-text-secondary font-medium italic">No listings found.</p>
          </div>
        )}

        {/* Listings Pagination */}
        {listingTotalPages > 1 && (
          <div className="flex justify-center items-center gap-6 pt-8">
            <button
              disabled={listingPage === 1}
              onClick={() => setListingPage(prev => Math.max(1, prev - 1))}
              className="p-3 rounded-full border border-border-light hover:bg-bg-light transition-colors disabled:opacity-30 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="text-sm font-bold text-text-primary">Page {listingPage} of {listingTotalPages}</span>
            <button
              disabled={listingPage === listingTotalPages}
              onClick={() => setListingPage(prev => Math.min(listingTotalPages, prev + 1))}
              className="p-3 rounded-full border border-border-light hover:bg-bg-light transition-colors disabled:opacity-30 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6 6-6" /></svg>
            </button>
          </div>
        )}
      </section>

      {/* Platform explainer: businesses + tourists */}
      <HowItWorks />

      {/* Blogs Section */}
      {blogs.length > 0 && (
        <section className="pt-12 border-t border-border-light scroll-mt-24" id="blogs-section">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Journal</span>
              <h2 className="text-3xl font-extrabold text-text-primary mt-2">Latest from the Blog</h2>
            </div>
            <Link href="/blog" className="text-sm font-bold text-text-primary hover:text-brand transition-colors underline underline-offset-4">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} className="group space-y-4">
                <div className="aspect-video rounded-2xl overflow-hidden bg-bg-light">
                  <img
                    src={blog.coverImage || 'https://via.placeholder.com/600x400'}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-brand tracking-widest">
                    {blog.tags?.[0] || 'News'}
                  </span>
                  <h3 className="text-xl font-bold text-text-primary leading-tight hover:text-brand transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-2">
                    {blog.excerpt || stripHtml(blog.content).substring(0, 100)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Business Leaderboard — below blog */}
      <BusinessLeaderboard />

      <section className="bg-bg-light rounded-3xl p-8 md:p-16 text-center space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand">Grow with us</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary">Professional Services</h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Help your business reach the next level with our premium solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Promotion */}
          <div className="bg-surface p-10 rounded-3xl border border-border-light shadow-sm hover:shadow-airbnb transition-all flex flex-col items-center">
            <span className="text-4xl mb-6">🚀</span>
            <h3 className="text-2xl font-bold mb-2">Business Promotion</h3>
            <div className="text-3xl font-black text-brand mb-4">10€ <span className="text-sm text-text-secondary font-medium">/ 7 days</span></div>
            <p className="text-text-secondary text-sm mb-8 flex-1">
              Aggressive promotion on our social networks and placement at the top of our page.
            </p>
            <a href="https://wa.me/355676925765" target="_blank" className="w-full bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand-hover transition-colors shadow-soft">
              Contact us on WhatsApp
            </a>
          </div>

          {/* Presence */}
          <div className="bg-surface p-10 rounded-3xl border border-brand/20 shadow-sm hover:shadow-airbnb transition-all flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Wanted</div>
            <span className="text-4xl mb-6">💻</span>
            <h3 className="text-2xl font-bold mb-2">Digital Presence</h3>
            <div className="text-2xl font-bold text-brand mb-4 h-[44px] flex items-center">By agreement</div>
            <p className="text-text-secondary text-sm mb-8 flex-1">
              Modern website, professional logo, and full management of social networks.
            </p>
            <a href="https://wa.me/355676925765" target="_blank" className="w-full bg-inverse text-on-inverse py-4 rounded-xl font-bold hover:bg-inverse-hover transition-colors shadow-soft">
              Contact us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Floating Action Button for Community Chat */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40 animate-bounce group"
      >
        <MessageCircle className="w-8 h-8 group-hover:animate-pulse" />
      </button>

      {/* The Chat Popup */}
      <CommunityChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </main>
  );
}
