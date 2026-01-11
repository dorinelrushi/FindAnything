import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { type } = await req.json(); // 'view' or 'click'

        await dbConnect();

        const ad = await Ad.findById(id);
        if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

        // Check for token
        const authHeader = req.headers.get('authorization');
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const cookieToken = req.cookies.get('token')?.value;
        const token = headerToken || cookieToken;

        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId;
            } catch (e) { }
        }

        // 1. If it's the owner, do nothing
        if (userId && ad.owner.toString() === userId) {
            return NextResponse.json({ success: true, message: 'Owner interaction ignored' });
        }

        // 2. If it's a logged-in user, check uniqueness based on their account ID
        if (userId) {
            const field = type === 'view' ? 'viewedBy' : 'clickedBy';
            const countField = type === 'view' ? 'views' : 'clicks';

            // Check if this account has already viewed OR clicked based on the requested 'type'
            const alreadyInteracted = ad[field].some(id => id.toString() === userId);

            if (!alreadyInteracted) {
                // If it's a new unique account for this action
                await Ad.findByIdAndUpdate(id, {
                    $addToSet: { [field]: userId },
                    $inc: { [countField]: 1 }
                });
                console.log(`SUCCESS: Unique ${type} recorded for Account: ${userId}`);
                return NextResponse.json({ success: true, message: `New unique ${type} counted` });
            } else {
                console.log(`SKIP: Account ${userId} already ${type}ed this ad`);
                return NextResponse.json({ success: true, message: `Account already counted for ${type}` });
            }
        }

        // 3. For guest visitors (no account)
        // We'll increment the counter but we can't tie it to a unique ID
        const countField = type === 'view' ? 'views' : 'clicks';
        await Ad.findByIdAndUpdate(id, { $inc: { [countField]: 1 } });
        console.log(`GUEST ${type} recorded`);

        return NextResponse.json({ success: true, message: 'Guest interaction counted' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
