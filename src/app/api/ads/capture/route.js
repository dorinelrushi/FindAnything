import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import { captureOrder } from '@/lib/paypal';

export async function POST(req) {
    try {
        const { orderID } = await req.json();

        const captureData = await captureOrder(orderID);

        if (captureData.status === 'COMPLETED') {
            await dbConnect();

            const ad = await Ad.findOne({ paymentId: orderID });
            if (!ad) {
                return NextResponse.json({ error: 'Ad not found for this payment' }, { status: 404 });
            }

            const startDate = new Date();
            const endDate = new Date();
            if (ad.plan === '1_week') {
                endDate.setDate(startDate.getDate() + 7);
            } else if (ad.plan === '2_weeks') {
                endDate.setDate(startDate.getDate() + 14);
            }

            ad.status = 'active';
            ad.startDate = startDate;
            ad.endDate = endDate;
            await ad.save();

            return NextResponse.json({ success: true, ad });
        } else {
            return NextResponse.json({ error: 'Payment not completed', details: captureData }, { status: 400 });
        }
    } catch (error) {
        console.error('Payment capture error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
