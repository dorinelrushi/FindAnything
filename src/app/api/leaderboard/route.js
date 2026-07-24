import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Review from '@/models/Review';
import { listingCanonicalPath } from '@/lib/listingPath';

export const dynamic = 'force-dynamic';

function serializeListing(doc, extra = {}) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        _id: String(obj._id),
        title: obj.title || 'Untitled',
        type: obj.type,
        slug: obj.slug,
        image: obj.image || null,
        city: obj.city || '',
        country: obj.country || '',
        address: obj.address || '',
        views: obj.views || 0,
        scanCount: obj.scanCount || 0,
        path: listingCanonicalPath(obj),
        ...extra,
    };
}

export async function GET() {
    try {
        await dbConnect();

        const select = 'title type slug image city country address views scanCount';

        const [mostVisitedHotel, mostPopularRestaurant, mostScannedBar, mostScannedQR] =
            await Promise.all([
                Listing.findOne({ type: 'hotel' })
                    .sort({ views: -1, scanCount: -1 })
                    .select(select)
                    .lean(),
                Listing.findOne({ type: 'restaurant' })
                    .sort({ views: -1, scanCount: -1 })
                    .select(select)
                    .lean(),
                Listing.findOne({ type: 'bar' })
                    .sort({ scanCount: -1, views: -1 })
                    .select(select)
                    .lean(),
                Listing.findOne({})
                    .sort({ scanCount: -1, views: -1 })
                    .select(select)
                    .lean(),
            ]);

        // Most recommended: highest average rating, then most reviews, then views
        const topRecommendedAgg = await Review.aggregate([
            {
                $group: {
                    _id: '$listing',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 },
                },
            },
            { $match: { reviewCount: { $gte: 1 } } },
            {
                $addFields: {
                    // Weight rating with review volume so one 5★ doesn't dominate
                    score: {
                        $multiply: [
                            '$avgRating',
                            { $add: [1, { $ln: { $add: ['$reviewCount', 1] } }] },
                        ],
                    },
                },
            },
            { $sort: { score: -1, avgRating: -1, reviewCount: -1 } },
            { $limit: 1 },
        ]);

        let mostRecommended = null;
        if (topRecommendedAgg.length > 0) {
            const row = topRecommendedAgg[0];
            const listing = await Listing.findById(row._id).select(select).lean();
            if (listing) {
                mostRecommended = serializeListing(listing, {
                    avgRating: Math.round(row.avgRating * 10) / 10,
                    reviewCount: row.reviewCount,
                    score: Math.round(row.score * 100) / 100,
                });
            }
        }

        // Fallback if no reviews yet: highest views overall
        if (!mostRecommended) {
            const fallback = await Listing.findOne({})
                .sort({ views: -1, scanCount: -1 })
                .select(select)
                .lean();
            if (fallback) {
                mostRecommended = serializeListing(fallback, {
                    avgRating: 0,
                    reviewCount: 0,
                });
            }
        }

        return NextResponse.json({
            success: true,
            leaderboard: {
                mostVisitedHotel: serializeListing(mostVisitedHotel),
                mostPopularRestaurant: serializeListing(mostPopularRestaurant),
                mostScannedBar: serializeListing(mostScannedBar),
                mostScannedQR: serializeListing(mostScannedQR),
                mostRecommended,
            },
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to load leaderboard' },
            { status: 500 }
        );
    }
}
