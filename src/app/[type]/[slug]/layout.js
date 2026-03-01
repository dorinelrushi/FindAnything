// Dynamic SEO metadata for listing detail pages — direct DB query, no self-HTTP-fetch
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';

export async function generateMetadata({ params }) {
    const { slug, type } = await params;

    try {
        await dbConnect();
        const listing = await Listing.findOne({ slug }).lean();

        if (!listing) {
            return {
                title: 'Listing - TryToFindEverything',
                description: 'Discover amazing places on TryToFindEverything.',
            };
        }

        const cleanDesc = listing.description
            ? listing.description.replace(/<[^>]+>/g, '').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 155) + '...'
            : `Discover ${listing.title} on TryToFindEverything.`;

        const typeLabel = {
            hotel: 'Hotel',
            restaurant: 'Restaurant',
            bar: 'Bar',
            bujtina: 'Guesthouse',
            rentcar: 'Car Rental',
            tour: 'Tour',
            city: 'City',
        }[type] || type;

        const locationStr = [listing.city, listing.country].filter(Boolean).join(', ');

        return {
            title: `${listing.title} - ${typeLabel}${locationStr ? ` in ${locationStr}` : ''} | TryToFindEverything`,
            description: cleanDesc,
            keywords: `${listing.title}, ${typeLabel}, ${locationStr}, travel, discover`,
            openGraph: {
                title: listing.title,
                description: cleanDesc,
                images: listing.image ? [{ url: listing.image }] : [],
                type: 'website',
            },
        };
    } catch {
        return {
            title: 'Listing - TryToFindEverything',
            description: 'Discover amazing places on TryToFindEverything.',
        };
    }
}

export default function ListingLayout({ children }) {
    return children;
}
