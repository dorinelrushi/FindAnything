import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import slugify from 'slugify';

export async function GET(req) {
    try {
        await dbConnect();
        const listings = await Listing.find({});
        let updatedCount = 0;

        for (const listing of listings) {
            let needsSave = false;

            // Fix Slug
            if (!listing.slug || listing.slug === 'undefined') {
                let baseSlug = slugify(listing.title, { lower: true, strict: true });
                let slug = baseSlug;
                let counter = 1;

                while (await Listing.findOne({ slug, _id: { $ne: listing._id } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                listing.slug = slug;
                needsSave = true;
            } else {
                // Ensure uniqueness for existing slugs too
                let existing = await Listing.findOne({ slug: listing.slug, _id: { $ne: listing._id } });
                if (existing) {
                    let baseSlug = listing.slug;
                    let slug = baseSlug;
                    let counter = 1;
                    while (await Listing.findOne({ slug, _id: { $ne: listing._id } })) {
                        slug = `${baseSlug}-${Date.now()}`; // fast fix
                    }
                    listing.slug = slug;
                    needsSave = true;
                }
            }

            if (needsSave) {
                await listing.save();
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, message: `Fixed slugs for ${updatedCount} listings.` });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
