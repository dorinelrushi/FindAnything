'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function MenuPage({ params }) {
    const { slug } = use(params);
    const [menu, setMenu] = useState(null);
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            // 1. Get Listing ID from slug
            const resListing = await fetch(`/api/listings/${slug}`);
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
                    border-top: 5px solid var(--primary);
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
                    <Link href={`/${listing.type}/${slug}`} className="back-link">
                        &larr; Back to {listing.title}
                    </Link>
                </div>
            </header>

            <div className="container" style={{ marginTop: '-50px', position: 'relative', zIndex: 10 }}>
                <div className="menu-content glass card">
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
                    padding: 40px;
                }
                
                .menu-category {
                    margin-bottom: 60px;
                }
                
                .category-title {
                    text-align: center;
                    font-family: 'Playfair Display', serif; /* Assuming you might want a fancy font, default serif otherwise */
                    font-size: 2.5rem;
                    color: var(--primary);
                    margin-bottom: 30px;
                    position: relative;
                    display: inline-block;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .category-title::after {
                    content: '';
                    display: block;
                    width: 60px;
                    height: 3px;
                    background: var(--accent);
                    margin: 10px auto 0;
                }

                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 30px;
                }

                @media (max-width: 768px) {
                    .items-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .menu-item {
                    display: flex;
                    gap: 15px;
                    background: rgba(255,255,255,0.03);
                    padding: 15px;
                    border-radius: 12px;
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 1px solid transparent;
                }

                .menu-item:hover {
                    transform: translateY(-3px);
                    background: rgba(255,255,255,0.07);
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }

                .item-image {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    background-size: cover;
                    background-position: center;
                    flex-shrink: 0;
                    border: 2px solid var(--accent);
                }

                .item-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 5px;
                    border-bottom: 1px dashed rgba(255,255,255,0.2);
                    padding-bottom: 5px;
                }

                .item-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .price {
                    font-size: 1.1rem;
                    color: var(--accent);
                    font-weight: bold;
                    white-space: nowrap;
                }

                .description {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #ccc;
                    line-height: 1.4;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
