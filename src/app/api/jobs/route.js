import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const verifyAdmin = async (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

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

// GET /api/jobs - List all active jobs (public)
export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const query = { active: true };
        const totalCount = await Job.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('title companyName location description applicationLink createdAt');

        return NextResponse.json({
            success: true,
            jobs,
            totalCount,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/jobs - Create job (admin only)
export async function POST(req) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized. Only admin can post jobs.' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        const { title, companyName, location, description, applicationLink } = body;

        if (!title?.trim() || !companyName?.trim() || !location?.trim() || !description?.trim() || !applicationLink?.trim()) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        let link = applicationLink.trim();
        if (!/^https?:\/\//i.test(link) && !/^mailto:/i.test(link)) {
            link = `https://${link}`;
        }

        const job = await Job.create({
            title: title.trim(),
            companyName: companyName.trim(),
            location: location.trim(),
            description: description.trim(),
            applicationLink: link,
            postedBy: admin.userId,
            active: true,
        });

        return NextResponse.json({ success: true, job }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
