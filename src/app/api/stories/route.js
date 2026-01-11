import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Story from '@/models/Story';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const decoded = await verifyToken();
        const userId = decoded?.userId;

        // Fetch all stories created in the last 24 hours
        // (The TTL index handles deletion, but we filter just in case or for logic consistency)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const stories = await Story.find({
            createdAt: { $gte: twentyFourHoursAgo }
        }).populate('businessId', 'name email').sort({ createdAt: -1 });

        // Group stories by business
        const groupedStories = {};
        for (const story of stories) {
            const bId = story.businessId._id.toString();
            if (!groupedStories[bId]) {
                // Find listing image for the avatar or use a default
                const listing = await Listing.findOne({ owner: bId });
                groupedStories[bId] = {
                    businessId: bId,
                    name: story.businessId.name || 'Business',
                    avatar: listing?.image || '/default-business.png',
                    stories: [],
                    allSeen: true
                };
            }

            const isSeen = userId ? story.viewers.includes(userId) : false;
            if (!isSeen) groupedStories[bId].allSeen = false;

            groupedStories[bId].stories.push({
                _id: story._id,
                imageUrl: story.imageUrl,
                createdAt: story.createdAt,
                seen: isSeen
            });
        }

        return NextResponse.json({ success: true, groups: Object.values(groupedStories) });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const decoded = await verifyToken();

        if (!decoded || (decoded.role !== 'business' && decoded.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Limit check: 3 photos in 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const count = await Story.countDocuments({
            businessId: decoded.userId,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (count >= 3) {
            return NextResponse.json({ error: 'Limit reached: Only 3 stories allowed in 24 hours' }, { status: 429 });
        }

        const newStory = await Story.create({
            businessId: decoded.userId,
            imageUrl
        });

        return NextResponse.json({ success: true, story: newStory });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
