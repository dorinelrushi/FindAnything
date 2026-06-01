import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';
import Scan from '@/models/Scan';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;
    const token = headerToken || cookieToken;

    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

// POST /api/business/scans
// Body: { listingId, deviceId, deviceFingerprint }
// Increments the listing's own scanCount, then awards points to the owner every 10 scans.
export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        // Support both old key (businessId) and new key (listingId) for backwards compat
        const listingId = body.listingId || body.businessId;
        const deviceId = body.deviceId;
        const deviceFingerprint = body.deviceFingerprint;

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        // Find the listing by its own ID
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const listingUrl = `/${listing.type.toLowerCase()}/${listing.slug || listing._id}`;

        // Verify if a scan already exists for this deviceId or deviceFingerprint on this listingId
        if (deviceId && deviceFingerprint) {
            const existingScan = await Scan.findOne({
                listingId,
                $or: [
                    { deviceId },
                    { deviceFingerprint }
                ]
            });

            if (existingScan) {
                return NextResponse.json({
                    success: false,
                    error: 'already_scanned',
                    message: 'This phone has already scanned this business.',
                    listingUrl
                });
            }

            // Create new scan record to prevent future scans from this device
            await Scan.create({
                listingId,
                deviceId,
                deviceFingerprint
            });
        }

        // Increment this listing's individual scan count
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            { $inc: { scanCount: 1 } },
            { new: true }
        );

        // Award 5 points to the business owner every 10 scans for THIS listing
        let pointsAdded = 0;
        if (updatedListing.scanCount % 10 === 0) {
            pointsAdded = 5;
            await User.findByIdAndUpdate(listing.owner, { $inc: { points: 5 } });
        }

        // Fetch fresh owner points to return
        const owner = await User.findById(listing.owner).select('points');

        return NextResponse.json({ 
            success: true, 
            listingId,
            scanCount: updatedListing.scanCount,
            pointsAdded,
            totalPoints: owner?.points || 0,
            listingUrl
        });

    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/business/scans?listingId=xxx
// Returns overall owner points + per-listing scanCount if listingId is provided.
export async function GET(req) {
    try {
        const user = verifyToken(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const listingId = searchParams.get('listingId');

        // Always return owner's total points
        const owner = await User.findById(user.userId).select('points');

        let scanCount = 0;
        if (listingId) {
            // Return scan count for the specific listing
            const listing = await Listing.findOne({ _id: listingId, owner: user.userId }).select('scanCount');
            scanCount = listing?.scanCount || 0;
        }

        return NextResponse.json({ 
            success: true, 
            points: owner?.points || 0, 
            scanCount
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
    }
}
