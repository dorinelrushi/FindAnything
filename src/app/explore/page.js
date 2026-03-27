import { Suspense } from 'react';
import ExploreClient from './ExploreClient';

export const metadata = {
    title: 'Explore - Find Hotels, Restaurants, and Tours',
    description: 'Explore our curated list of the best hotels, restaurants, bars, and experiences. Filter by city, category, or amenities to find exactly what you need.',
    alternates: {
        canonical: 'https://trytofindeverything.online/explore',
    },
};

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="container-wide py-20 text-center font-bold">Loading...</div>}>
            <ExploreClient />
        </Suspense>
    );
}
