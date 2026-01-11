import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is not defined in environment variables!');
}

const verifyToken = (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;

    // Prioritize header token (explicitly sent by client)
    const tokensToTry = [headerToken, cookieToken].filter(Boolean);

    if (tokensToTry.length === 0) {
        console.log('No token found in headers or cookies');
        return null;
    }

    for (const token of tokensToTry) {
        try {
            if (token === 'null' || token === 'undefined') continue;
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (err) {
            console.log(`Token verification failed for a token: ${err.message}`);
        }
    }

    return null;
};

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const owner = searchParams.get('owner');
        const category = searchParams.get('category');
        const services = searchParams.get('services'); // comma-separated

        let query = {};
        if (type) query.type = type;
        if (owner) query.owner = owner;
        if (category) query.category = category;

        // Filter by services - listing must have ALL selected services
        // Service can be in general services, hotel general services, hotel additional services, or room amenities
        if (services) {
            const serviceArray = services.split(',').filter(s => s.trim());
            if (serviceArray.length > 0) {
                query.$and = serviceArray.map(service => ({
                    $or: [
                        { services: service },
                        { 'hotelData.generalServices': service },
                        { 'hotelData.additionalServices': service },
                        { 'hotelData.roomAmenities': service },
                        { 'barData.services': service },
                        { 'bujtinaData.facilities': service },
                        { 'bujtinaData.roomAmenities': service },
                        { 'rentCarData.extraServices': service }
                    ]
                }));
            }
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await Listing.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ listings });
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = verifyToken(req);
        console.log('Verified User in POST:', user);
        if (!user || (user.role?.toLowerCase() !== 'business' && user.role?.toLowerCase() !== 'admin')) {
            const detectedRole = user ? user.role : 'No token/No user';
            console.log('Unauthorized attempt in POST. User role:', detectedRole);
            return NextResponse.json({
                error: `Unauthorized. Only business accounts can post. Your detected role: ${detectedRole}`
            }, { status: 401 });
        }

        await dbConnect();
        const formData = await req.formData();

        const title = formData.get('title');
        const description = formData.get('description');
        const type = formData.get('type');
        const address = formData.get('address');
        const lat = formData.get('lat');
        const lng = formData.get('lng');
        const imageFile = formData.get('image');
        const category = formData.get('category');
        const servicesData = formData.get('services'); // JSON string of array
        const hotelDataRaw = formData.get('hotelData'); // JSON string of hotelData object
        const barDataRaw = formData.get('barData'); // JSON string of barData object
        const bujtinaDataRaw = formData.get('bujtinaData'); // JSON string of bujtinaData object
        const rentCarDataRaw = formData.get('rentCarData'); // JSON string of rentCarData object

        let imageUrl = '';
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const filename = Date.now() + '_' + imageFile.name.replaceAll(' ', '_');
            const uploadDir = path.join(process.cwd(), 'public/uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) { }
            await writeFile(path.join(uploadDir, filename), buffer);
            imageUrl = `/uploads/${filename}`;
        }

        // Generate Slug
        let slug = slugify(title, { lower: true, strict: true });
        // Simple Uniqueness check (append random number if exists)
        let existingSlug = await Listing.findOne({ slug });
        if (existingSlug) {
            slug = `${slug}-${Date.now()}`;
        }

        // Parse services if provided
        let services = [];
        if (servicesData) {
            try {
                services = JSON.parse(servicesData);
            } catch (e) {
                console.error('Error parsing services:', e);
            }
        }

        // Parse hotelData if provided
        let hotelData = undefined;
        if (hotelDataRaw) {
            try {
                hotelData = JSON.parse(hotelDataRaw);
            } catch (e) {
                console.error('Error parsing hotelData:', e);
            }
        }

        // Parse barData if provided
        let barData = undefined;
        if (barDataRaw) {
            try {
                barData = JSON.parse(barDataRaw);
            } catch (e) {
                console.error('Error parsing barData:', e);
            }
        }

        // Parse bujtinaData if provided
        let bujtinaData = undefined;
        if (bujtinaDataRaw) {
            try {
                bujtinaData = JSON.parse(bujtinaDataRaw);
            } catch (e) {
                console.error('Error parsing bujtinaData:', e);
            }
        }

        // Parse rentCarData if provided
        let rentCarData = undefined;
        if (rentCarDataRaw) {
            try {
                rentCarData = JSON.parse(rentCarDataRaw);
            } catch (e) {
                console.error('Error parsing rentCarData:', e);
            }
        }

        const listing = await Listing.create({
            owner: user.userId,
            title,
            description,
            type,
            address,
            lat,
            lng,
            image: imageUrl,
            slug,
            category: category || undefined,
            services,
            hotelData,
            barData,
            bujtinaData,
            rentCarData
        });

        return NextResponse.json({ success: true, listing }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
