import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import { xaiChat, safeParseJson } from '@/lib/ai';

/**
 * AI Tourist Assistant — after QR scan, personal recommendations near the business.
 * Public endpoint (tourists are often logged out).
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { listingId, visitorCountry, visitorCity, interests } = body;

        if (!listingId) {
            return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
        }

        await dbConnect();
        const listing = await Listing.findById(listingId)
            .select('title type city country address description services category lat lng')
            .lean();

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Nearby / same-city suggestions from DB (real listings)
        const orFilters = [];
        if (listing.city) {
            const cityEsc = String(listing.city).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            orFilters.push({ city: { $regex: new RegExp(`^\\s*${cityEsc}\\s*$`, 'i') } });
        }
        if (listing.country) {
            const countryEsc = String(listing.country).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            orFilters.push({ country: { $regex: new RegExp(countryEsc, 'i') } });
        }
        if (listing.type) {
            orFilters.push({ type: listing.type });
        }

        const nearbyQuery =
            orFilters.length > 0
                ? { _id: { $ne: listing._id }, $or: orFilters }
                : { _id: { $ne: listing._id } };

        const nearby = await Listing.find(nearbyQuery)
            .select('title type city slug image category')
            .limit(8)
            .lean();

        const nearbyBrief = nearby.map((n) => ({
            id: String(n._id),
            title: n.title,
            type: n.type,
            city: n.city,
            slug: n.slug,
            path: `/${(n.type || 'hotel').toLowerCase()}/${(n.slug || n._id).toString().toLowerCase()}`,
            image: n.image,
        }));

        const system = `You are a friendly local tourist assistant on TryToFindEverything.
Return ONLY valid JSON:
{
  "greeting": "short welcome",
  "aboutPlace": "2-3 sentences about this business for a tourist",
  "tips": ["practical tip 1", "tip 2", "tip 3"],
  "recommendedTypes": ["restaurant", "tour"],
  "itineraryIdeas": ["half-day idea", "evening idea"],
  "personalNote": "one personalized line based on visitor country if known"
}`;

        const userMsg = `Tourist just scanned QR for:
Title: ${listing.title}
Type: ${listing.type}
City: ${listing.city || ''}
Country: ${listing.country || ''}
Category: ${listing.category || ''}
Services: ${(listing.services || []).join(', ')}
Description: ${(listing.description || '').replace(/<[^>]*>/g, '').slice(0, 350)}

Visitor country: ${visitorCountry || 'unknown'}
Visitor city: ${visitorCity || 'unknown'}
Interests: ${interests || 'general travel'}

Nearby listings on our platform (prefer recommending these when relevant):
${nearbyBrief.map((n) => `- ${n.title} (${n.type}) path:${n.path}`).join('\n') || 'None yet'}
`;

        let assistant = null;
        let fallback = false;

        try {
            const content = await xaiChat({ system, user: userMsg, temperature: 0.65 });
            assistant = safeParseJson(content);
            if (!assistant) {
                assistant = {
                    greeting: `Welcome to ${listing.title}!`,
                    aboutPlace: content.slice(0, 400),
                    tips: [],
                    itineraryIdeas: [],
                    personalNote: '',
                };
            }
        } catch (aiErr) {
            fallback = true;
            assistant = {
                greeting: `Welcome! Thanks for scanning ${listing.title}.`,
                aboutPlace: `You are at ${listing.title}${listing.city ? ` in ${listing.city}` : ''}. Explore the full listing for photos, reviews, and contact details.`,
                tips: [
                    'Save the listing to favorites for later.',
                    'Check opening hours and WhatsApp on the business page.',
                    'Ask staff for local food and photo spots nearby.',
                ],
                itineraryIdeas: [
                    `Morning: visit ${listing.title} and nearby ${listing.city || 'center'} highlights.`,
                    'Evening: try a local restaurant and a short walk around the area.',
                ],
                personalNote: visitorCountry
                    ? `Safe travels from ${visitorCountry} — enjoy your stay!`
                    : 'Enjoy your trip!',
            };
        }

        return NextResponse.json({
            success: true,
            fallback,
            assistant,
            recommendations: nearbyBrief,
            listing: {
                title: listing.title,
                type: listing.type,
                city: listing.city,
                country: listing.country,
            },
        });
    } catch (error) {
        console.error('Tourist assistant error:', error);
        return NextResponse.json({ error: 'Assistant failed' }, { status: 500 });
    }
}
