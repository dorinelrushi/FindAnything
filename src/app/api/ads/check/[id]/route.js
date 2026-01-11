import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const activeAd = await Ad.findOne({
            listing: id,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        return NextResponse.json({ success: true, activeAd });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
