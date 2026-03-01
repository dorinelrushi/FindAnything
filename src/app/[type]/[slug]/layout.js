// This file provides dynamic SEO metadata for listing detail pages
// It fetches the listing on the server side for SEO purposes

export async function generateMetadata({ params }) {
    const { slug, type } = await params;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/listings/${slug}`, { cache: 'no-store' });

        if (!res.ok) {
            return {
                title: 'Listing - TryToFindEverything',
                description: 'Discover amazing places on TryToFindEverything.',
            };
        }

        const data = await res.json();
        const listing = data.listing;

        if (!listing) {
            return {
                title: 'Listing Not Found - TryToFindEverything',
                description: 'This listing could not be found.',
            };
        }

        // Clean HTML from description for meta description
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
    } catch (error) {
        return {
            title: 'Listing - TryToFindEverything',
            description: 'Discover amazing places on TryToFindEverything.',
        };
    }
}

export default function ListingLayout({ children }) {
    return children;
}
