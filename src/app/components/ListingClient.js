'use client';
import { useState } from 'react';
import Link from 'next/link';
import Map from './Map';

export default function ListingClient({ initialListing, initialReviews, initialMenu, slug }) {
    const listing = initialListing;
    const reviews = initialReviews || [];
    const menu = initialMenu;

    return (
        <div className="min-h-screen bg-white">
            <header className="listing-header relative h-[400px] md:h-[600px] bg-bg-light overflow-hidden">
                <img src={listing.image || '/placeholder.jpg'} className="w-full h-full object-cover" alt={listing.title} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-10 text-white">
                    <div className="container-wide">
                        <h1 className="text-4xl md:text-6xl font-black mb-2">{listing.title}</h1>
                        <p className="text-xl md:text-2xl opacity-90">{listing.city}, {listing.country}</p>
                    </div>
                </div>
            </header>

            <div className="container-wide py-12 flex flex-col lg:flex-row gap-12">
                <main className="flex-1 space-y-12">
                    <section className="space-y-4">
                        <h2 className="text-3xl font-black text-text-primary">About</h2>
                        <div className="prose prose-lg text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: listing.description }} />
                    </section>

                    {menu && (
                        <section className="p-8 bg-brand/5 rounded-3xl border border-brand/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-brand">Menu Available</h2>
                                    <p className="text-text-secondary">Explore the full offerings of this {listing.type}.</p>
                                </div>
                                <Link href={`/${listing.type}/${slug}/menu`} className="bg-brand text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                                    View Full Menu
                                </Link>
                            </div>
                        </section>
                    )}

                    {reviews.length > 0 && (
                         <section className="space-y-6">
                            <h2 className="text-3xl font-black text-text-primary">Reviews ({reviews.length})</h2>
                            <div className="grid gap-6">
                                {reviews.map((review, i) => (
                                    <div key={i} className="p-6 bg-bg-light rounded-2xl border border-border-light">
                                        <div className="flex justify-between mb-4">
                                            <span className="font-bold text-text-primary">{review.user?.name || 'User'}</span>
                                            <span className="text-xs text-text-secondary">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-text-secondary">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                         </section>
                    )}
                </main>

                <aside className="w-full lg:w-[400px] space-y-8">
                    <div className="p-8 bg-white border border-border-light rounded-3xl shadow-xl sticky top-24">
                        <h3 className="text-xl font-bold mb-6">Location</h3>
                        <div className="aspect-square bg-bg-light rounded-2xl overflow-hidden mb-6">
                            {listing.lat && listing.lng ? (
                                <Map listings={[listing]} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary italic">Map preview not available</div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📍</span>
                                <span className="text-sm font-medium">{listing.address}</span>
                            </div>
                            {listing.whatsappNumber && (
                                <a href={`https://wa.me/${listing.whatsappNumber}`} target="_blank" className="flex items-center justify-center gap-2 bg-[#25D366] text-white w-full py-4 rounded-full font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all">
                                    Message Venue
                                </a>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx global>{`
                .container-wide {
                    max-width: 1300px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
            `}</style>
        </div>
    );
}
