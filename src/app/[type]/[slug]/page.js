import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Review from '@/models/Review';
import Menu from '@/models/Menu';
import { notFound } from 'next/navigation';
import ListingClient from './ListingClient';

async function getListingData(slug) {
    await dbConnect();
    
    // Try by slug first, then by ID
    let listing = await Listing.findOneAndUpdate(
        { slug: slug },
        { $inc: { views: 1 } },
        { new: true }
    ).populate('owner', 'name email phoneNumber phonePrefix');

    if (!listing && slug.match(/^[0-9a-fA-F]{24}$/)) {
        listing = await Listing.findByIdAndUpdate(
            slug,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('owner', 'name email phoneNumber phonePrefix');
    }

    if (!listing) return null;

    // Fetch reviews
    const reviews = await Review.find({ listing: listing._id })
        .populate('user', 'name')
        .sort({ createdAt: -1 });

    // Fetch menu
    const menu = await Menu.findOne({ listing: listing._id });

    return {
        listing: JSON.parse(JSON.stringify(listing)),
        reviews: JSON.parse(JSON.stringify(reviews)),
        menu: JSON.parse(JSON.stringify(menu))
    };
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getListingData(slug);

    if (!data || !data.listing) {
        return {
            title: 'Not Found',
            description: 'The requested listing could not be found.'
        };
    }

    const { listing } = data;
    const title = `${listing.title} - ${listing.city}`;
    const description = listing.description?.substring(0, 160) || `Discover ${listing.title} in ${listing.city}. Find reviews, address, and more on TryToFindEverything.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://trytofindeverything.online/${listing.type}/${listing.slug || listing._id}`,
        },
        openGraph: {
            title,
            description,
            url: `https://trytofindeverything.online/${listing.type}/${listing.slug || listing._id}`,
            images: [
                {
                    url: listing.image || '/og-image.jpg',
                    width: 1200,
                    height: 630,
                    alt: listing.title,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [listing.image || '/og-image.jpg'],
        },
    };
}

export default async function ListingPage({ params }) {
    const { slug } = await params;
    const data = await getListingData(slug);

    if (!data) {
        notFound();
    }

    return (
        <ListingClient 
            initialListing={data.listing} 
            initialReviews={data.reviews} 
            initialMenu={data.menu}
            slug={slug}
        />
    );
}
