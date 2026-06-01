import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Budget from '@/models/Budget';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const getUserIdFromRequest = (req) => {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;
    const token = headerToken || cookieToken;

    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (err) {
        return null;
    }
};

// GET /api/budgets
// Returns all tourist budget posts
export async function GET(req) {
    try {
        await dbConnect();
        const budgets = await Budget.find({})
            .populate('user', 'name image email role')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, budgets });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/budgets
// Creates a new tourist budget post
export async function POST(req) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Restrict to personal account and admins
        if (user.role !== 'person' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Only visitor/client accounts can post budgets' }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, budget, whatsappNumber, instagramLink, facebookLink } = body;

        if (!title || !description || !budget) {
            return NextResponse.json({ error: 'Title, description and budget range are required' }, { status: 400 });
        }

        const newBudget = await Budget.create({
            user: userId,
            title,
            description,
            budget,
            whatsappNumber,
            instagramLink,
            facebookLink
        });

        const populatedBudget = await Budget.findById(newBudget._id).populate('user', 'name image email role');

        return NextResponse.json({ success: true, budget: populatedBudget });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/budgets?id=xxx
// Updates an existing tourist budget post
export async function PUT(req) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const budgetId = searchParams.get('id');

        if (!budgetId) {
            return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
        }

        await dbConnect();
        const budgetItem = await Budget.findById(budgetId);
        if (!budgetItem) {
            return NextResponse.json({ error: 'Budget post not found' }, { status: 404 });
        }

        const user = await User.findById(userId);
        const isAdmin = user?.role === 'admin';

        if (budgetItem.user.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: 'You are not authorized to edit this budget post' }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, budget, whatsappNumber, instagramLink, facebookLink } = body;

        if (!title || !description || !budget) {
            return NextResponse.json({ error: 'Title, description and budget range are required' }, { status: 400 });
        }

        const updated = await Budget.findByIdAndUpdate(
            budgetId,
            { title, description, budget, whatsappNumber, instagramLink, facebookLink },
            { new: true }
        ).populate('user', 'name image email role');

        return NextResponse.json({ success: true, budget: updated });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/budgets?id=xxx
// Deletes a tourist budget post
export async function DELETE(req) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const budgetId = searchParams.get('id');

        if (!budgetId) {
            return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
        }

        await dbConnect();
        const budgetItem = await Budget.findById(budgetId);
        if (!budgetItem) {
            return NextResponse.json({ error: 'Budget post not found' }, { status: 404 });
        }

        const user = await User.findById(userId);
        const isAdmin = user?.role === 'admin';

        if (budgetItem.user.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: 'You are not authorized to delete this budget post' }, { status: 403 });
        }

        await Budget.findByIdAndDelete(budgetId);

        return NextResponse.json({ success: true, message: 'Budget post deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
