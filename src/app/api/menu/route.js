import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Menu from '@/models/Menu';
import Listing from '@/models/Listing';

// GET menu for a specific listing
export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
        return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    try {
        const menu = await Menu.findOne({ listing: listingId });
        return NextResponse.json({ menu }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST create or update menu
export async function POST(req) {
    await dbConnect();
    try {
        const { listingId, categories } = await req.json();

        if (!listingId || !categories) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Update if exists, otherwise create
        let menu = await Menu.findOne({ listing: listingId });
        if (menu) {
            menu.categories = categories;
            await menu.save();
        } else {
            menu = await Menu.create({
                listing: listingId,
                categories
            });
        }

        return NextResponse.json({ success: true, menu }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
