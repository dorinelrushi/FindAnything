import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Next.js 15: params must be awaited
export async function generateMetadata({ params }) {
    const { type } = await params;
    
    // Capitalize type for title
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
    
    return {
        title: `${displayType}s - TryToFindEverything`,
        description: `Browse all ${displayType}s on TryToFindEverything. Find the best places, reviews, and more.`,
        alternates: {
            canonical: `/${type}`,
        },
    };
}

// Allow on-demand rendering for new types
export const dynamicParams = true;
export const revalidate = 3600;

export default async function TypePage({ params }) {
    // In Next.js 15, params is a Promise
    const { type } = await params;

    await dbConnect();
    
    // Fetch listings of this type
    // We use case-insensitive regex for the type as well just in case
    const listings = await Listing.find({ 
        type: { $regex: new RegExp(`^${type}$`, 'i') } 
    }).sort({ createdAt: -1 });

    // If no listings found for this type, we might want to check if it's a valid enum
    const validTypes = ['hotel', 'restaurant', 'bar', 'bujtina', 'rentcar', 'tour', 'city'];
    if (!validTypes.includes(type.toLowerCase()) && listings.length === 0) {
        notFound();
    }

    const displayType = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <div className="min-h-screen bg-bg-light/30 py-16 px-6">
            <div className="container-wide max-w-[1200px] mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-4">
                        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-text-primary capitalize">{type}s</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
                        Explore <span className="text-brand">{displayType}s</span>
                    </h1>
                    <p className="text-text-secondary mt-3 text-lg">
                        Showing {listings.length} results found in this category.
                    </p>
                </div>

                {listings.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] shadow-soft border border-border-light">
                        <div className="text-5xl mb-4">📭</div>
                        <h2 className="text-2xl font-bold text-text-primary">No {displayType}s Found</h2>
                        <p className="text-text-secondary mt-2">Check back later or explore other categories.</p>
                        <Link href="/explore" className="btn-primary inline-block mt-8 px-8 py-3">Explore All</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {listings.map((listing) => (
                            <Link
                                key={listing._id.toString()}
                                href={`/${listing.type}/${listing.slug || listing._id}`}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border-light"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-bg-light">
                                    <img
                                        src={listing.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                                        alt={listing.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
                                        {listing.type}
                                    </div>
                                </div>
                                <div className="p-5 space-y-2">
                                    <h3 className="font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                                        {listing.title}
                                    </h3>
                                    <p className="text-sm text-text-secondary flex items-center gap-1">
                                        📍 {listing.city}
                                    </p>
                                    <div className="pt-2 flex justify-between items-center border-t border-border-light">
                                        <span className="font-bold text-text-primary">
                                            {listing.price ? (typeof listing.price === 'string' ? listing.price : `€${listing.price}`) : 'Price on request'}
                                        </span>
                                        <span className="text-brand font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
