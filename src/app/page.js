'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import FeaturedAds from '@/app/components/FeaturedAds';
import Stories from '@/app/components/Stories';

export default function Home() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchListings();
    fetch('/api/blog?limit=3')
      .then(r => r.json())
      .then(d => setBlogs(d.blogs || []))
      .catch(() => { });
  }, [filter, search]);

  const fetchListings = async () => {
    setLoading(true);
    let url = '/api/listings?';
    if (filter) url += `type=${filter}&`;
    if (search) url += `search=${search}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setListings(data.listings || []);
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
                style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}
                onClick={() => {
                  fetch('/api/user/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: listing.type })
                  });
                }}
              >
                <div style={{ height: '200px', background: '#333', borderRadius: '8px', marginBottom: '15px', backgroundImage: `url(${listing.image || 'https://via.placeholder.com/400x300?text=No+Image'})`, backgroundSize: 'cover' }}></div>
                <h3 style={{ margin: '0 0 10px 0' }}>{listing.title}</h3>
                <span style={{ fontSize: '0.8rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content', marginBottom: '10px' }}>{listing.type}</span>
                <p style={{ fontSize: '0.9rem', color: '#bbb', flex: 1 }}>{stripHtml(listing.description).substring(0, 100)}...</p>
              </Link>
            );
          })}
        </div>
        {listings.length === 0 && !loading && <p style={{ textAlign: 'center' }}>No listings found.</p>}
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
        </section>
      )}
    </div>
  );
}
