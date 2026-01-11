import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;

    // Prioritize header token (explicitly sent by client)
    const tokensToTry = [headerToken, cookieToken].filter(Boolean);

    if (tokensToTry.length === 0) {
        console.log('No token found in headers or cookies (slug route)');
        return null;
    }

    for (const token of tokensToTry) {
        try {
            if (token === 'null' || token === 'undefined') continue;
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (err) {
            console.log(`Token verification failed for a token (slug route): ${err.message}`);
        }
    }

    return null;
};

export async function GET(req, { params }) {
    await dbConnect();
    const { slug } = await params;

    let listing = await Listing.findOne({ slug: slug }).populate('owner', 'name email phoneNumber phonePrefix');

    if (!listing && slug.match(/^[0-9a-fA-F]{24}$/)) {
        listing = await Listing.findById(slug).populate('owner', 'name email phoneNumber phonePrefix');
    }

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ listing });
}

export async function PUT(req, { params }) {
    try {
        const user = verifyToken(req);
        console.log('Verified User in PUT:', user);
        if (!user || (user.role !== 'business' && user.role !== 'admin')) {
            console.log('Unauthorized attempt in PUT. User role:', user?.role || 'No user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { slug } = await params;

        let query = { slug: slug };
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            query = { _id: slug };
        }

        let listing = await Listing.findOne(query);
        if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Check ownership (Bypass for admin)
        if (user.role !== 'admin' && listing.owner.toString() !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized. You do not own this listing.' }, { status: 403 });
        }

        const formData = await req.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const type = formData.get('type');
        const address = formData.get('address');
        const lat = formData.get('lat');
        const lng = formData.get('lng');
        const imageFile = formData.get('image');
        const category = formData.get('category');
        const servicesData = formData.get('services');
        const hotelDataRaw = formData.get('hotelData');
        const barDataRaw = formData.get('barData');
        const bujtinaDataRaw = formData.get('bujtinaData');
        const rentCarDataRaw = formData.get('rentCarData');

        if (title) listing.title = title;
        if (description) listing.description = description;
        if (type) listing.type = type;
        if (address) listing.address = address;
        if (lat) listing.lat = lat;
        if (lng) listing.lng = lng;
        if (category !== null) listing.category = category;

        // Update services if provided
        if (servicesData) {
            try {
                listing.services = JSON.parse(servicesData);
            } catch (e) {
                console.error('Error parsing services:', e);
            }
        }

        // Update hotelData if provided
        if (hotelDataRaw) {
            try {
                listing.hotelData = JSON.parse(hotelDataRaw);
            } catch (e) {
                console.error('Error parsing hotelData:', e);
            }
        }

        // Update barData if provided
        if (barDataRaw) {
            try {
                listing.barData = JSON.parse(barDataRaw);
            } catch (e) {
                console.error('Error parsing barData:', e);
            }
        }

        // Update bujtinaData if provided
        if (bujtinaDataRaw) {
            try {
                listing.bujtinaData = JSON.parse(bujtinaDataRaw);
            } catch (e) {
                console.error('Error parsing bujtinaData:', e);
            }
        }

        // Update rentCarData if provided
        if (rentCarDataRaw) {
            try {
                listing.rentCarData = JSON.parse(rentCarDataRaw);
            } catch (e) {
                console.error('Error parsing rentCarData:', e);
            }
        }

        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const base64Image = buffer.toString('base64');
            listing.image = `data:${imageFile.type};base64,${base64Image}`;
        }

        // Update slug if title changed
        if (title && title !== listing.title) {
            let newSlug = slugify(title, { lower: true, strict: true });
            let existing = await Listing.findOne({ slug: newSlug });
            if (existing && existing._id.toString() !== listing._id.toString()) {
                newSlug = `${newSlug}-${Date.now()}`;
            }
            listing.slug = newSlug;
        }

        await listing.save();

        return NextResponse.json({ success: true, listing });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    await dbConnect();
    const { slug } = await params;

    let query = { slug: slug };
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        query = { _id: slug };
    }

    const listing = await Listing.findOneAndDelete(query);
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
}
