import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

// Predefined defaults to always include
const DEFAULT_CATEGORIES = {
    restaurant: ['Traditional', 'Fast Food', 'Pizzeria', 'Bar & Grill', 'Seafood', 'Vegan/Vegetarian'],
    bar: ['Cocktail Bar', 'Lounge Bar', 'Wine Bar', 'Beer Bar', 'Cafe Bar', 'Night Bar'],
    hotel: ['Hotel', 'Boutique Hotel', 'Guesthouse', 'Hostel', 'Resort'],
    bujtina: ['Traditional', 'Modern', 'Family-Run', 'Mountain', 'Lake View'],
    rentcar: ['Economy', 'Luxury', 'SUV', 'Electric', 'Family'],
    tour: ['Day Trip', 'Multi-day Tour', 'Adventure', 'Cultural', 'Walking Tour', 'Food Tour', 'Hiking'],
    city: []
};

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (!type) {
            return NextResponse.json({ error: 'Type is required' }, { status: 400 });
        }

        const dbCategories = await Category.find({ type }).select('name').lean();
        const dbCategoryNames = dbCategories.map(c => c.name);

        const defaults = DEFAULT_CATEGORIES[type] || [];
        const allCategories = [...new Set([...defaults, ...dbCategoryNames])].filter(Boolean);

        return NextResponse.json({ categories: allCategories });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const { type, name } = await req.json();

        if (!type || !name) {
            return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
        }

        let category = await Category.findOne({ type, name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!category) {
            category = await Category.create({ type, name });
        }

        return NextResponse.json({ success: true, category });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
