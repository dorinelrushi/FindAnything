import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { createOrder } from '@/lib/paypal';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const PLANS = {
    '1_week': 10,
    '2_weeks': 20
};

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization');
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const cookieToken = req.cookies.get('token')?.value;
        const token = headerToken || cookieToken;

        if (!token) {
            console.log('No token found for ad creation');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.log('JWT Verification failed:', err.message);
            return NextResponse.json({ error: 'jwt expired' }, { status: 401 });
        }

        if (!decoded || (decoded.role !== 'business' && decoded.role !== 'admin')) {
            console.log('Permission denied for role:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { listingId, plan, content } = data;

        if (!PLANS[plan]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        await dbConnect();

        // Check if there's already an active ad for this listing
        const existingActiveAd = await Ad.findOne({
            listing: listingId,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        if (existingActiveAd) {
            return NextResponse.json({
                error: 'This listing already has an active advertisement until ' + existingActiveAd.endDate.toLocaleDateString()
            }, { status: 400 });
        }

        // Check if listing exists and belongs to the user
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.owner.toString() !== decoded.userId && decoded.role !== 'admin') {
            return NextResponse.json({ error: 'You do not own this listing' }, { status: 403 });
        }

        const amount = PLANS[plan];
        const paypalOrder = await createOrder(amount);

        const newAd = await Ad.create({
            owner: decoded.userId,
            listing: listingId,
            plan,
            amount,
            status: 'pending',
            content,
            paymentId: paypalOrder.id,
        });

        return NextResponse.json({
            success: true,
            orderID: paypalOrder.id,
            adId: newAd._id
        });
    } catch (error) {
        console.error('Ad creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();

        const token = req.cookies.get('token')?.value;
        let interests = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) interests = user.interests;
            } catch (e) { }
        }

        // Get active ads
        let ads = await Ad.find({ status: 'active', endDate: { $gte: new Date() } })
            .populate('listing');

        if (interests) {
            // Sort ads by user interests
            ads.sort((a, b) => {
                const countA = interests[a.listing.type] || 0;
                const countB = interests[b.listing.type] || 0;
                return countB - countA;
            });
        }

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
