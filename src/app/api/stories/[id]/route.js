import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Story from '@/models/Story';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const decoded = await verifyToken();
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const story = await Story.findById(id);

        if (!story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        // Only owner or admin can delete
        if (story.businessId.toString() !== decoded.userId && decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await Story.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
