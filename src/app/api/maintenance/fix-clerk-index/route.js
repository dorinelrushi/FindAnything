import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await dbConnect();
        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // List existing indexes
        const indexes = await collection.indexes();
        const clerkIndex = indexes.find(idx => idx.name === 'clerkId_1');

        if (!clerkIndex) {
            return NextResponse.json({ message: 'clerkId_1 index not found — already removed or never existed.' });
        }

        await collection.dropIndex('clerkId_1');
        return NextResponse.json({ success: true, message: 'Dropped stale clerkId_1 index successfully.' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
