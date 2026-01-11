import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
        }

        const adminEmails = ['dorinelrushi8@gmail.com', 'dorinel253@gmail.com'];
        const isAdmin = adminEmails.some(email => email.toLowerCase() === user.email.toLowerCase());

        // Check if business is approved (Bypass for admin)
        if (!isAdmin && user.role === 'business' && user.status === 'pending') {
            return NextResponse.json({ error: 'Your account is pending approval' }, { status: 403 });
        }
        if (!isAdmin && user.role === 'business' && user.status === 'rejected') {
            return NextResponse.json({ error: 'Your account registration has been rejected' }, { status: 403 });
        }

        const userRole = isAdmin ? 'admin' : user.role;

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: userRole },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: userRole,
                name: user.name,
                phoneNumber: user.phoneNumber,
                phonePrefix: user.phonePrefix
            }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400,
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
