import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import jwt from 'jsonwebtoken';
import { xaiChat, safeParseJson } from '@/lib/ai';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req) {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies.get('token')?.value;
    const token = headerToken || cookieToken;
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

/**
 * AI Offer Generator for QR campaigns.
 * Business writes e.g. "2 days tour in Ephesus" → texts + image ideas for QR promo.
 */
export async function POST(req) {
    try {
        const user = verifyToken(req);
        if (!user || (user.role !== 'business' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { prompt, listingId } = body;

        if (!prompt || !String(prompt).trim()) {
            return NextResponse.json(
                { error: 'Write a short offer idea, e.g. "2 days tour in Ephesus"' },
                { status: 400 }
            );
        }

        let listingContext = '';
        if (listingId) {
            await dbConnect();
            const listing = await Listing.findById(listingId).select(
                'title type city country description address owner'
            );
            if (listing) {
                if (
                    user.role !== 'admin' &&
                    listing.owner &&
                    listing.owner.toString() !== user.userId
                ) {
                    return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
                }
                listingContext = `
Business listing:
- Title: ${listing.title}
- Type: ${listing.type}
- City: ${listing.city || ''}
- Country: ${listing.country || ''}
- Address: ${listing.address || ''}
- Description: ${(listing.description || '').replace(/<[^>]*>/g, '').slice(0, 400)}
`;
            }
        }

        const system = `You are a marketing copywriter for tourism QR campaigns on TryToFindEverything.
Return ONLY valid JSON (no markdown) with this shape:
{
  "headline": "short catchy headline",
  "subheadline": "one line",
  "qrPosterText": "2-3 sentences for a printed QR poster",
  "whatsappMessage": "ready-to-send WhatsApp text for customers after scan",
  "socialCaptions": ["caption1", "caption2", "caption3"],
  "hashtags": ["#tag1", "#tag2"],
  "imageIdeas": [
    { "title": "photo idea title", "description": "what to show on the flyer/QR card", "style": "photo style" }
  ],
  "callToAction": "short CTA button text"
}`;

        const userMsg = `Create a QR campaign offer from this business idea:
"${String(prompt).trim()}"
${listingContext}
Write in the same language as the business idea when possible. Keep it tourist-friendly and conversion-focused.`;

        let content;
        try {
            content = await xaiChat({ system, user: userMsg, temperature: 0.75 });
        } catch (aiErr) {
            // Graceful offline/fallback templates when API key missing
            if (String(aiErr.message).includes('XAI_API_KEY')) {
                const idea = String(prompt).trim();
                return NextResponse.json({
                    success: true,
                    fallback: true,
                    offer: {
                        headline: idea,
                        subheadline: 'Scan the QR to discover more',
                        qrPosterText: `${idea}. Scan our QR code for details, photos, and how to book.`,
                        whatsappMessage: `Hi! I'm interested in: ${idea}. Can you share more info?`,
                        socialCaptions: [
                            `${idea} ✨ Scan our QR for the full experience!`,
                            `New offer: ${idea} — find us on TryToFindEverything`,
                            `Tourists love this: ${idea}. Scan & go!`,
                        ],
                        hashtags: ['#Travel', '#QR', '#Tourism', '#TryToFindEverything'],
                        imageIdeas: [
                            {
                                title: 'Hero landscape',
                                description: 'Wide shot of the main attraction mentioned in the offer',
                                style: 'bright travel photography',
                            },
                            {
                                title: 'Happy guests',
                                description: 'People enjoying the experience with a QR card in frame',
                                style: 'lifestyle',
                            },
                            {
                                title: 'Map pin poster',
                                description: 'Simple poster with big QR and short headline',
                                style: 'minimal graphic design',
                            },
                        ],
                        callToAction: 'Scan to explore',
                    },
                    message:
                        'AI key not set — returned template suggestions. Add XAI_API_KEY for full AI generation.',
                });
            }
            throw aiErr;
        }

        const offer = safeParseJson(content);
        if (!offer) {
            return NextResponse.json({
                success: true,
                offer: {
                    headline: String(prompt).trim(),
                    raw: content,
                    qrPosterText: content.slice(0, 500),
                    imageIdeas: [],
                    socialCaptions: [],
                    hashtags: [],
                },
            });
        }

        return NextResponse.json({ success: true, offer });
    } catch (error) {
        console.error('Offer generator error:', error);
        return NextResponse.json({ error: error.message || 'AI failed' }, { status: 500 });
    }
}
