import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CommunityMessage from '@/models/CommunityMessage';
import Listing from '@/models/Listing';

// Ensure Listing is registered
const ensureListing = () => {
    if (Listing) return;
};

export async function GET(request) {
    try {
        await dbConnect();
        ensureListing();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';

        // Get messages from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        let query = { createdAt: { $gte: twentyFourHoursAgo } };
        if (category && category !== 'all') {
            query.category = category;
        }

        const messages = await CommunityMessage.find(query)
            .populate('attachments', 'title image type _id slug city category') // populate essential listing details
            .sort({ createdAt: -1 }) // Newest first
            .limit(100);

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching community messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await dbConnect();

        const data = await request.json();
        const { visitorId, visitorName, content, category, attachments } = data;

        if (!visitorId || !visitorName || (!content && (!attachments || attachments.length === 0)) || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let finalCategory = category;
        // Auto-route the message category based on the first attachment if one exists
        if (attachments && attachments.length > 0) {
            const firstAttachment = await Listing.findById(attachments[0]);
            if (firstAttachment) {
                // Map DB listing types to chat category names
                const typeToCategory = {
                    hotel: 'hotel',
                    restaurant: 'restaurant',
                    bar: 'bar',
                    bujtina: 'guesthouse',
                    rentcar: 'rentcar',
                    tour: 'tour',
                    city: 'city',
                };
                const mappedCategory = typeToCategory[firstAttachment.type];
                if (mappedCategory) {
                    finalCategory = mappedCategory;
                }
            }
        }

        // Check if user has exceeded their daily limit of 3 messages today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const messageCount = await CommunityMessage.countDocuments({
            visitorId,
            createdAt: { $gte: startOfDay }
        });

        if (messageCount >= 3) {
             return NextResponse.json(
                { error: 'Limit reached: You can only send 3 suggestions per day. Those messages expire every 24 hours.' },
                { status: 429 } 
             );
        }

        const newMessage = await CommunityMessage.create({
            visitorId,
            visitorName,
            content: content || '',
            category: finalCategory,
            attachments: attachments || []
        });

        // We populate attachments before returning so the UI can draw it right away
        await newMessage.populate('attachments', 'title image type _id slug city category');

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error('Error creating community message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
