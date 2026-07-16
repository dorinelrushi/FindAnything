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

// GET /api/jobs/[id] - Single job (public)
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const job = await Job.findOne({ _id: id, active: true })
            .select('title companyName location description applicationLink createdAt');

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, job });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/jobs/[id] - Delete job (admin only)
export async function DELETE(req, { params }) {
    try {
        const admin = await verifyAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized. Only admin can delete jobs.' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const job = await Job.findByIdAndDelete(id);

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
