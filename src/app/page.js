'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import FeaturedAds from '@/app/components/FeaturedAds';
import Stories from '@/app/components/Stories';
const Map = dynamic(() => import('@/app/components/Map'), { ssr: false });

export default function Home() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
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
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', background: 'linear-gradient(to right, #6c5ce7, #fd79a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Explore Korça City
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc' }}>Find the best hotels, restaurants, and experiences.</p>

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

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <Link href="/explore" className="btn" style={{ background: 'var(--secondary)', textDecoration: 'none' }}>All</Link>
          <Link href="/explore?type=hotel" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Hotels</Link>
          <Link href="/explore?type=restaurant" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Restaurants</Link>
          <Link href="/explore?type=bar" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Bars</Link>
          <Link href="/explore?type=bujtina" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Bujtinas</Link>
          <Link href="/explore?type=rentcar" className="btn" style={{ background: 'var(--card-bg)', textDecoration: 'none' }}>Rent Car</Link>
        </div>
      </section>

      <FeaturedAds />

      <section>
        <div className="glass map-wrapper" style={{ padding: '10px', marginBottom: '40px' }}>
          <Map listings={listings} />
        </div>

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
    </div>
  );
}
