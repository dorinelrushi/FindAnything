import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req) => {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });

    const reviews = await Review.find({ listing: listingId }).populate('user', 'name').sort({ createdAt: -1 });
    return NextResponse.json({ reviews });
}

export async function POST(req) {
    try {
        const user = verifyToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        let listingId, rating, comment, imageUrl = '';

        // Handle both JSON and FormData logic (though typically we just switch to FormData if we want file uploads)
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            listingId = formData.get('listingId');
            rating = formData.get('rating');
            comment = formData.get('comment');
            const imageFile = formData.get('image');

            if (imageFile && imageFile.size > 0) {
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                const filename = Date.now() + '_' + imageFile.name.replaceAll(' ', '_');
                const uploadDir = path.join(process.cwd(), 'public/uploads');

                try {
                    await mkdir(uploadDir, { recursive: true });
                } catch (e) {
                    // Ignore error if directory exists
                }

                await writeFile(path.join(uploadDir, filename), buffer);
                imageUrl = `/uploads/${filename}`;
            }
        } else {
            const body = await req.json();
            listingId = body.listingId;
            rating = body.rating;
            comment = body.comment;
        }

        const review = await Review.create({
            user: user.userId,
            listing: listingId,
            rating,
            comment,
            image: imageUrl
        });

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (error) {
        console.error("Error creating review:", error); // Debug log
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
