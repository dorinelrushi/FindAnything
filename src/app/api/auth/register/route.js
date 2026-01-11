import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const { email, password, role, name, phoneNumber, phonePrefix } = await req.json();
        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let userRole = role === 'business' ? 'business' : 'person';

        if (role === 'business' && (!phoneNumber || !phonePrefix)) {
            return NextResponse.json({ error: 'Business mobile number is required' }, { status: 400 });
        }

        const user = await User.create({
            email,
            password: hashedPassword,
            role: userRole,
            name,
            phoneNumber,
            phonePrefix,
            status: userRole === 'business' ? 'pending' : 'approved'
        });

        return NextResponse.json({
            success: true,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                phoneNumber: user.phoneNumber,
                phonePrefix: user.phonePrefix
            }
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
