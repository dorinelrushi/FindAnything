'use client';
import { useFavorites } from '@/context/FavoritesContext';
import Link from 'next/link';

export default function FavoritesPage() {
    const { favorites, toggleFavorite } = useFavorites();

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    return (
        <main className="container-wide py-12 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                <div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tight">Your Favorites</h1>
                    <p className="text-text-secondary mt-2 font-medium">
                        {favorites.length === 0 
                            ? "You haven't saved any places yet." 
                            : `You have ${favorites.length} places saved in your list.`}
                    </p>
                </div>
                {favorites.length > 0 && (
                    <Link href="/explore" className="text-brand font-bold hover:underline mb-1">
                        Find more places →
                    </Link>
                )}
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-bg-light rounded-3xl space-y-6">
                    <div className="text-6xl">💝</div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-text-primary">Start saving your next adventure</h2>
                        <p className="text-text-secondary max-w-sm mx-auto">
                            Click the heart icon on any listing to save it here for later.
                        </p>
                    </div>
                    <Link 
                        href="/explore" 
                        className="inline-block bg-brand text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-soft"
                    >
                        Explore Listings
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {favorites.map((listing) => (
                        <div key={listing._id} className="group flex flex-col bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm hover:shadow-airbnb transition-all relative">
                            <Link href={`/${listing.type}/${listing.slug || listing._id}`} className="block relative aspect-[4/3] overflow-hidden">
                                <img 
                                    src={listing.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                                    alt={listing.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase text-brand">
                                    {listing.type}
                                </div>
                            </Link>

                            <div className="p-5 flex-1 flex flex-col gap-3">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold text-lg line-clamp-1 flex-1">{listing.title}</h3>
                                    <button 
                                        onClick={() => toggleFavorite(listing)}
                                        className="text-brand hover:scale-110 active:scale-95 transition-all"
                                        title="Remove from favorites"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF385C" stroke="#FF385C" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                </div>
                                
                                <p className="text-text-secondary text-sm line-clamp-2">
                                    {stripHtml(listing.description).substring(0, 100)}...
                                </p>

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-light">
                                    <span className="font-bold text-text-primary">
                                        {listing.price ? (typeof listing.price === 'string' && (listing.price.includes('€') || listing.price.includes('Lek') || listing.price.includes('$')) ? listing.price : `€${listing.price}`) : 'Contact for price'}
                                    </span>
                                    <Link 
                                        href={`/${listing.type}/${listing.slug || listing._id}`}
                                        className="text-xs font-black uppercase tracking-widest text-brand hover:text-brand-hover"
                                    >
                                        Details →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
