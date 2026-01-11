import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Story from '@/models/Story';
import { verifyToken } from '@/lib/auth';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const decoded = await verifyToken();
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await Story.findByIdAndUpdate(id, {
            $addToSet: { viewers: decoded.userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
