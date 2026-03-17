export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/listings/${slug}`, { next: { revalidate: 3600 } });
        const data = await res.json();
        
        if (data.listing) {
            return {
                title: `${data.listing.title} - TryToFindEverything`,
                description: (data.listing.description?.substring(0, 160) || `Discover ${data.listing.title} in ${data.listing.city}.`) + ' Find hotels, restaurants and more.',
                openGraph: {
                    title: data.listing.title,
                    description: data.listing.description?.substring(0, 160),
                    images: data.listing.image ? [{ url: data.listing.image }] : [],
                },
            };
        }
    } catch (e) {
        return { title: 'Discover - TryToFindEverything' };
    }
    return { title: 'Discover - TryToFindEverything' };
}

export default function ListingLayout({ children }) {
    return <>{children}</>;
}
