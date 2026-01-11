import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const cookieToken = req.cookies.get('token')?.value;
        const token = headerToken || cookieToken;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        await dbConnect();

        const ads = await Ad.find({ owner: decoded.userId })
            .populate('listing')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
