import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyAdmin = (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;
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

// GET /api/blog - List all published blogs
export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const tag = searchParams.get('tag');
        const skip = (page - 1) * limit;

        let query = { published: true };
        if (tag) query.tags = tag;

        const totalCount = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('title slug excerpt coverImage tags createdAt');

        return NextResponse.json({
            blogs,
            totalCount,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/blog - Create blog (admin only)
export async function POST(req) {
    try {
        const admin = verifyAdmin(req);
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();
        const { title, content, excerpt, coverImage, tags, seoTitle, seoDescription, published } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        // Generate unique slug
        let slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
        let existing = await Blog.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        // Auto excerpt from content if not provided
        const autoExcerpt = excerpt || content.replace(/<[^>]+>/g, '').substring(0, 160) + '...';

        const blog = await Blog.create({
            title,
            slug,
            content,
            excerpt: autoExcerpt,
            coverImage: coverImage || '',
            tags: tags || [],
            seoTitle: seoTitle || title,
            seoDescription: seoDescription || autoExcerpt,
            author: admin.userId,
            published: published !== false,
        });

        return NextResponse.json({ success: true, blog }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
