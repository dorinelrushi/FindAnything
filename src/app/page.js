'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FeaturedAds from '@/app/components/FeaturedAds';
import Stories from '@/app/components/Stories';

// Strip HTML tags for clean preview
const stripHtml = (html) => {
  if (!html) return '';
  // Simple regex-based strip for server-side safety and speed
  return html.replace(/<[^>]*>?/gm, '');
};

export default function Home() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);

  // Pagination State
  const [listingPage, setListingPage] = useState(1);
  const [listingTotalPages, setListingTotalPages] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);

  useEffect(() => {
    fetchListings();
  }, [filter, search, listingPage]);

  useEffect(() => {
    fetchBlogs();
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
      limit: '6',
      page: listingPage.toString()
    });
    if (filter) params.append('type', filter);
    if (search) params.append('search', search);

    const url = `/api/listings?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setListings(data.listings || []);
      setListingTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch listings', error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <Stories />

      <section style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '20px', background: 'linear-gradient(to right, #6c5ce7, #fd79a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Explore the World
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.2rem', color: '#ccc' }}>Find the best places to stay, eat, and experiences around the world.</p>

        <div className="search-bar glass" style={{ padding: '10px', marginTop: '30px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search places..."
            className="input"
            style={{ margin: 0, border: 'none', background: 'transparent' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = `/explore?search=${search}`;
              }
            }}
          />
          <Link href={`/explore?search=${search}`} className="btn" style={{ textDecoration: 'none' }}>Search</Link>
        </div>

        <div className="home-categories-grid" style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <Link href="/explore" className="btn" style={{ background: 'var(--secondary)', textDecoration: 'none' }}>All</Link>
          <Link href="/explore?type=city" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Cities</Link>
          <Link href="/explore?type=hotel" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Hotels</Link>
          <Link href="/explore?type=restaurant" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Restaurants</Link>
          <Link href="/explore?type=bar" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Bars</Link>
          <Link href="/explore?type=bujtina" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Guesthouses</Link>
          <Link href="/explore?type=tour" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Tours</Link>
          <Link href="/explore?type=rentcar" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Rent Car</Link>
        </div>
      </section>

      <FeaturedAds />

      <section>
        <div className="grid">
          {listings.map(listing => {
            // Strip HTML tags for clean preview
            const stripHtml = (html) => {
              if (typeof window !== 'undefined') {
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                return tmp.textContent || tmp.innerText || '';
              }
              return html;
            };

            return (
              <Link
                href={`/${listing.type}/${listing.slug || listing._id}`}
                key={listing._id}
                className="glass card"
                style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
                onClick={async () => {
                  try {
                    await fetch('/api/user/activity', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ category: listing.type })
                    });
                  } catch (e) {
                    console.warn('Silent activity log failed');
                  }
                }}
              >
                <div style={{ height: '200px', background: '#333', borderRadius: '8px', marginBottom: '15px', backgroundImage: `url(${listing.image || 'https://via.placeholder.com/400x300?text=No+Image'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <h3 style={{ margin: '0 0 10px 0' }}>{listing.title}</h3>
                <span style={{ fontSize: '0.8rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content', marginBottom: '10px' }}>{listing.type}</span>
                <p style={{ fontSize: '0.9rem', color: '#bbb', flex: 1 }}>{stripHtml(listing.description).substring(0, 100)}...</p>
              </Link>
            );
          })}
        </div>
        {listings.length === 0 && !loading && <p style={{ textAlign: 'center' }}>No listings found.</p>}

        {/* Listings Pagination Buttons */}
        {listingTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
            <button
              className="btn"
              disabled={listingPage === 1}
              onClick={() => setListingPage(prev => Math.max(1, prev - 1))}
              style={{ padding: '8px 20px', opacity: listingPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>Page {listingPage} of {listingTotalPages}</span>
            <button
              className="btn"
              disabled={listingPage === listingTotalPages}
              onClick={() => setListingPage(prev => Math.min(listingTotalPages, prev + 1))}
              style={{ padding: '8px 20px', opacity: listingPage === listingTotalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Blog Grid Section */}
      {blogs.length > 0 && (
        <section style={{ marginTop: '80px', marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#a29bfe', fontWeight: '700' }}>Journal</span>
              <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '5px', background: 'linear-gradient(135deg, #fff, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Latest from the Blog</h2>
            </div>
            <Link href="/blog" className="btn" style={{ background: 'rgba(162,155,254,0.15)', color: '#a29bfe', textDecoration: 'none', border: '1px solid rgba(162,155,254,0.3)' }}>View All Articles →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {blogs.map(blog => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'white' }}>
                <article style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.4s ease', height: '100%', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                  {blog.coverImage && (
                    <div style={{ height: '180px', overflow: 'hidden' }}>
                      <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {(blog.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {blog.tags.slice(0, 2).map(tag => (
                          <span key={tag} style={{ fontSize: '0.68rem', background: 'rgba(162,155,254,0.15)', color: '#a29bfe', padding: '2px 9px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px', lineHeight: '1.3' }}>{blog.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: '1.6', flex: 1, marginBottom: '15px' }}>{(blog.excerpt || '').substring(0, 100)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style={{ color: '#a29bfe', fontSize: '0.85rem', fontWeight: '700' }}>Read →</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Blog Pagination Buttons */}
          {blogTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
              <button
                className="btn"
                disabled={blogPage === 1}
                onClick={() => setBlogPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', opacity: blogPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>Page {blogPage} of {blogTotalPages}</span>
              <button
                className="btn"
                disabled={blogPage === blogTotalPages}
                onClick={() => setBlogPage(prev => Math.min(blogTotalPages, prev + 1))}
                style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', opacity: blogPage === blogTotalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}

      {/* Services Section */}
      <section style={{ marginTop: '80px', marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '4px', color: '#00cec9', fontWeight: '800' }}>Grow with Us</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginTop: '10px', background: 'linear-gradient(135deg, #00cec9, #81ecec)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Professional Services</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '15px', fontSize: '1.1rem' }}>Take your business to the next level with our premium solutions.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Card 1: Promotion */}
          <div className="service-card" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '40px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.4s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(253, 121, 168, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', color: '#fd79a8', fontSize: '2rem' }}>
              🚀
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '15px' }}>Business Promotion</h3>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fd79a8', marginBottom: '15px' }}>10€ <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>/ 7 days</span></div>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', marginBottom: '30px', flex: 1 }}>
              We will aggressively promote your business across our social media channels and feature you prominently on our website to drive traffic and sales.
            </p>
            <a href="https://wa.me/355676925765" target="_blank" rel="noopener noreferrer" style={{
              background: 'linear-gradient(135deg, #fd79a8, #e84393)',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 30px',
              borderRadius: '30px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(253, 121, 168, 0.3)',
              transition: 'transform 0.3s'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Contact on WhatsApp
            </a>
          </div>

          {/* Card 2: Digital Presence */}
          <div className="service-card" style={{
            background: 'linear-gradient(to bottom, rgba(162, 155, 254, 0.08), rgba(255,255,255,0.02))',
            border: '1px solid rgba(162, 155, 254, 0.3)',
            borderRadius: '24px',
            padding: '40px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.4s ease',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#a29bfe', color: '#000', fontSize: '0.7rem', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Popular</div>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(162, 155, 254, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', color: '#a29bfe', fontSize: '2rem' }}>
              💻
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '15px' }}>Digital Presence</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#a29bfe', marginBottom: '15px', height: '39px', display: 'flex', alignItems: 'center' }}>Custom Quote</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', marginBottom: '30px', flex: 1 }}>
              Complete identity makeover. We build a modern website, design a stunning professional logo, and provide full-service social media management.
            </p>
            <a href="https://wa.me/355676925765" target="_blank" rel="noopener noreferrer" style={{
              background: '#a29bfe',
              color: '#000',
              textDecoration: 'none',
              padding: '14px 30px',
              borderRadius: '30px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(162, 155, 254, 0.3)',
              transition: 'transform 0.3s'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Contact on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
