import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';
import Scan from '@/models/Scan';
import jwt from 'jsonwebtoken';
import { getClientIp, resolveScanGeo } from '@/lib/geo';
import { listingCanonicalPath } from '@/lib/listingPath';

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
// One scan per IP (and device) per listing. Stores country/city/time.
export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const listingId = body.listingId || body.businessId;
        const deviceId = body.deviceId || '';
        const deviceFingerprint = body.deviceFingerprint || '';

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const listingUrl = listingCanonicalPath(listing);
        const ip = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || '';

        // Already scanned from this IP?
        const existingByIp = await Scan.findOne({ listingId, ip });
        if (existingByIp) {
            return NextResponse.json({
                success: false,
                error: 'already_scanned',
                message: 'This network (IP) has already scanned this business.',
                listingUrl,
                scanMeta: {
                    country: existingByIp.country,
                    city: existingByIp.city,
                    scannedAt: existingByIp.createdAt,
                },
            });
        }

        // Extra device-level check when fingerprint is present
        if (deviceId || deviceFingerprint) {
            const or = [];
            if (deviceId) or.push({ deviceId });
            if (deviceFingerprint) or.push({ deviceFingerprint });
            if (or.length) {
                const existingDevice = await Scan.findOne({ listingId, $or: or });
                if (existingDevice) {
                    return NextResponse.json({
                        success: false,
                        error: 'already_scanned',
                        message: 'This phone has already scanned this business.',
                        listingUrl,
                        scanMeta: {
                            country: existingDevice.country,
                            city: existingDevice.city,
                            scannedAt: existingDevice.createdAt,
                        },
                    });
                }
            }
        }

        const geo = await resolveScanGeo(req, ip);

        try {
            await Scan.create({
                listingId,
                deviceId,
                deviceFingerprint,
                ip,
                country: geo.country || geo.countryCode || '',
                countryCode: geo.countryCode || '',
                region: geo.region || '',
                city: geo.city || '',
                timezone: geo.timezone || '',
                userAgent,
            });
        } catch (createErr) {
            // Unique index race: treat as already scanned
            if (createErr?.code === 11000) {
                return NextResponse.json({
                    success: false,
                    error: 'already_scanned',
                    message: 'This network (IP) has already scanned this business.',
                    listingUrl,
                });
            }
            throw createErr;
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            { $inc: { scanCount: 1 } },
            { new: true }
        );

        let pointsAdded = 0;
        if (updatedListing.scanCount % 10 === 0) {
            pointsAdded = 5;
            await User.findByIdAndUpdate(listing.owner, { $inc: { points: 5 } });
        }

        const owner = await User.findById(listing.owner).select('points');

        return NextResponse.json({
            success: true,
            listingId,
            scanCount: updatedListing.scanCount,
            pointsAdded,
            totalPoints: owner?.points || 0,
            listingUrl,
            scanMeta: {
                country: geo.country || geo.countryCode || 'Unknown',
                countryCode: geo.countryCode || '',
                region: geo.region || '',
                city: geo.city || '',
                timezone: geo.timezone || '',
                scannedAt: new Date().toISOString(),
                ipMasked: maskIp(ip),
            },
            listingPreview: {
                title: listing.title,
                type: listing.type,
                city: listing.city,
                country: listing.country,
                image: listing.image,
            },
        });
    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function maskIp(ip) {
    if (!ip) return '';
    if (ip.includes('.')) {
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.slice(0, 8) + '…';
}

// GET /api/business/scans?listingId=xxx
// Returns points, scanCount, and recent scan analytics (country, city, time).
export async function GET(req) {
    try {
        const user = verifyToken(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const listingId = searchParams.get('listingId');

        const owner = await User.findById(user.userId).select('points');

        let scanCount = 0;
        let scans = [];
        let byCountry = [];

        if (listingId) {
            const listing = await Listing.findOne({
                _id: listingId,
                owner: user.userId,
            }).select('scanCount title type slug');

            if (!listing && user.role !== 'admin') {
                return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
            }

            scanCount = listing?.scanCount || 0;

            const rawScans = await Scan.find({ listingId })
                .sort({ createdAt: -1 })
                .limit(100)
                .select('country countryCode region city timezone ip createdAt')
                .lean();

            scans = rawScans.map((s) => ({
                country: s.country || s.countryCode || 'Unknown',
                countryCode: s.countryCode || '',
                region: s.region || '',
                city: s.city || '',
                timezone: s.timezone || '',
                ipMasked: maskIp(s.ip),
                scannedAt: s.createdAt,
                time: s.createdAt
                    ? new Date(s.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                      })
                    : '',
            }));

            const countryMap = {};
            for (const s of rawScans) {
                const key = s.country || s.countryCode || 'Unknown';
                countryMap[key] = (countryMap[key] || 0) + 1;
            }
            byCountry = Object.entries(countryMap)
                .map(([country, count]) => ({ country, count }))
                .sort((a, b) => b.count - a.count);
        }

        return NextResponse.json({
            success: true,
            points: owner?.points || 0,
            scanCount,
            scans,
            byCountry,
        });
    } catch (error) {
        console.error('GET scans error', error);
        return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
    }
}
