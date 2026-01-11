import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
    try {
        const { category } = await req.json();
        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        const token = req.cookies.get('token')?.value;
        if (!token) {
            // No user logged in, we could use session or skip for now
            // But the user said "recommend to each person who spend more to my website"
            // implying tracking users.
            return NextResponse.json({ success: true, message: 'Guest interaction ignored' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        await dbConnect();

        const update = {};
        update[`interests.${category}`] = 1;

        await User.findByIdAndUpdate(decoded.userId, {
            $inc: update
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
