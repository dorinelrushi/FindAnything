'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function MenuPageClient({ params }) {
    const { slug } = use(params);
    const [menu, setMenu] = useState(null);
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);

    // slug should be an array like ['hotel', 'my-hotel', 'menu']
    const listingSlug = Array.isArray(slug) ? slug[1] : slug;

    useEffect(() => {
        if (listingSlug) {
            fetchData();
        }
    }, [listingSlug]);

    const fetchData = async () => {
        try {
            // 1. Get Listing from slug
            const resListing = await fetch(`/api/listings/${listingSlug}`);
            const dataListing = await resListing.json();

            if (!dataListing.listing) {
                setLoading(false);
                return;
            }

            setListing(dataListing.listing);

            // 2. Get Menu
            const resMenu = await fetch(`/api/menu?listingId=${dataListing.listing._id}`);
            const dataMenu = await resMenu.json();

            if (dataMenu.menu) {
                setMenu(dataMenu.menu);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="loader"></div>
            <style jsx>{`
                .loader {
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #ff4d4d;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    if (!listing || !menu) return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2>Menu not found</h2>
            <Link href="/" className="btn">Go Home</Link>
        </div>
    );

    return (
        <div className="menu-page">
            <header className="menu-header" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${listing.image})` }}>
                <div className="header-content">
                    <h1>{listing.title}</h1>
                    <p className="subtitle">Menu</p>
                    <Link href={`/${listing.type}/${listingSlug}`} className="back-link">
                        &larr; Back to {listing.title}
                    </Link>
                </div>
            </header>

            <div className="container" style={{ marginTop: '-50px', position: 'relative', zIndex: 10, padding: '0 20px' }}>
                <div className="menu-content card" style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    {menu.categories.map((cat, i) => (
                        <div key={i} className="menu-category">
                            <h2 className="category-title">{cat.name}</h2>
                            <div className="items-grid">
                                {cat.items.map((item, j) => (
                                    <div key={j} className="menu-item">
                                        {item.photo && (
                                            <div className="item-image" style={{ backgroundImage: `url(${item.photo})` }}></div>
                                        )}
                                        <div className="item-details" style={{ width: item.photo ? 'calc(100% - 100px)' : '100%' }}>
                                            <div className="item-header">
                                                <h3>{item.name}</h3>
                                                <span className="price">{item.price}</span>
                                            </div>
                                            {item.description && <p className="description">{item.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .menu-page {
                    min-height: 100vh;
                    padding-bottom: 50px;
                    background: #f8f9fa;
                }
                .menu-header {
                    height: 300px;
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: white;
                }
                .header-content h1 {
                    font-size: 3rem;
                    margin: 0;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }
                .subtitle {
                    font-size: 1.5rem;
                    opacity: 0.9;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                .back-link {
                    color: white;
                    text-decoration: none;
                    margin-top: 10px;
                    display: inline-block;
                    background: rgba(255,255,255,0.2);
                    padding: 5px 15px;
                    border-radius: 20px;
                    backdrop-filter: blur(5px);
                    transition: background 0.3s;
                }
                .back-link:hover {
                    background: rgba(255,255,255,0.4);
                }
                
                .menu-content {
                    max-width: 900px;
                    margin: 0 auto;
                }
                
                .menu-category {
                    margin-bottom: 60px;
                }
                
                .category-title {
                    text-align: center;
                    font-size: 2.2rem;
                    color: #333;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .category-title::after {
                    content: '';
                    display: block;
                    width: 60px;
                    height: 3px;
                    background: #ff4d4d;
                    margin: 10px auto 0;
                }

                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 30px;
                }

                @media (max-width: 768px) {
                    .items-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                }

                .menu-item {
                    display: flex;
                    gap: 15px;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }

                .item-image {
                    width: 70px;
                    height: 70px;
                    border-radius: 10px;
                    background-size: cover;
                    background-position: center;
                    flex-shrink: 0;
                }

                .item-details {
                    flex: 1;
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 5px;
                }

                .item-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .price {
                    font-size: 1rem;
                    color: #ff4d4d;
                    font-weight: bold;
                }

                .description {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #666;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    );
}
