import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CommunityMessage from '@/models/CommunityMessage';

// PUT - Edit a message
export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { visitorId, content } = await request.json();

        if (!visitorId || !id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = await CommunityMessage.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Only the author can edit
        if (message.visitorId !== visitorId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        message.content = content || '';
        await message.save();

        await message.populate('attachments', 'title image type _id slug city category');

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error editing community message:', error);
        return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
    }
}

// DELETE - Delete a message
export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get('visitorId');

        if (!visitorId || !id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = await CommunityMessage.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Only the author can delete
        if (message.visitorId !== visitorId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await CommunityMessage.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting community message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
