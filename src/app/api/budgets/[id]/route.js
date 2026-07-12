import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Budget from '@/models/Budget';
import User from '@/models/User';

// GET /api/budgets/[id]
// Returns a single budget post by ID
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();
        const budget = await Budget.findById(id).populate('user', 'name image email role');
        if (!budget) {
            return NextResponse.json({ error: 'Budget post not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, budget });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
