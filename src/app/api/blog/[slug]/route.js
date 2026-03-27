import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyAdmin = async (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Use next/headers for cookies in App Router
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('token')?.value;

    const tokensToTry = [headerToken, cookieToken].filter(Boolean);

    for (const token of tokensToTry) {
        try {
            if (token === 'null' || token === 'undefined') continue;
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'admin') return decoded;
        } catch (err) { }
    }
    return null;
};

// GET /api/blog/[slug] - Get single blog
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { slug } = await params;
        const lowerSlug = slug.toLowerCase();
        // If user is admin, they can see unpublished blogs
        const admin = await verifyAdmin(req);
        const query = admin ? { slug: lowerSlug } : { slug: lowerSlug, published: true };

        const blog = await Blog.findOne(query).populate('author', 'name');
        if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ blog });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/blog/[slug] - Update blog (admin only)
export async function PUT(req, { params }) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { slug } = await params;
        const body = await req.json();
        const { title, content, excerpt, coverImage, tags, seoTitle, seoDescription, published } = body;

        const blog = await Blog.findOne({ slug });
        if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Update slug if title changed
        if (title && title !== blog.title) {
            let newSlug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
            const existing = await Blog.findOne({ slug: newSlug });
            if (existing && existing._id.toString() !== blog._id.toString()) {
                newSlug = `${newSlug}-${Date.now()}`;
            }
            blog.slug = newSlug;
        }

        if (title) blog.title = title;
        if (content) blog.content = content;
        if (excerpt !== undefined) blog.excerpt = excerpt || content.replace(/<[^>]+>/g, '').substring(0, 160) + '...';
        if (coverImage !== undefined) blog.coverImage = coverImage;
        if (tags) blog.tags = tags;
        if (seoTitle !== undefined) blog.seoTitle = seoTitle;
        if (seoDescription !== undefined) blog.seoDescription = seoDescription;
        if (published !== undefined) blog.published = published;
        blog.updatedAt = new Date();

        await blog.save();
        return NextResponse.json({ success: true, blog });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/blog/[slug] - Delete blog (admin only)
export async function DELETE(req, { params }) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { slug } = await params;
        const blog = await Blog.findOneAndDelete({ slug });
        if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
