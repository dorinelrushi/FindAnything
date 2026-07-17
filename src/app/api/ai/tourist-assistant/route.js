import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Review from '@/models/Review';
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
        const listing = await Listing.findById(listingId).lean();

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const reviews = await Review.find({ listing: listing._id })
            .select('rating comment')
            .limit(5)
            .lean();

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

        const formatListingDetails = (l) => {
            const parts = [];
            parts.push(`Title: ${l.title}`);
            parts.push(`Type: ${l.type}`);
            parts.push(`City: ${l.city || ''}`);
            parts.push(`Country: ${l.country || ''}`);
            parts.push(`Address: ${l.address || ''}`);
            parts.push(`Category: ${l.category || ''}`);
            if (l.services?.length) parts.push(`Services offered: ${l.services.join(', ')}`);
            
            // Hotel
            if (l.hotelData) {
                const hd = l.hotelData;
                if (hd.roomTypes?.length) parts.push(`Room Types: ${hd.roomTypes.join(', ')}`);
                if (hd.generalServices?.length) parts.push(`General Services: ${hd.generalServices.join(', ')}`);
                if (hd.roomAmenities?.length) parts.push(`Room Amenities: ${hd.roomAmenities.join(', ')}`);
                if (hd.policies) {
                    if (hd.policies.pets) parts.push(`Pet Policy: ${hd.policies.pets}`);
                    if (hd.policies.children) parts.push(`Children Policy: ${hd.policies.children}`);
                    if (hd.policies.cancellation) parts.push(`Cancellation Policy: ${hd.policies.cancellation}`);
                    if (hd.policies.payment) parts.push(`Payment Policy: ${hd.policies.payment}`);
                }
            }
            // Bujtina (Guesthouse)
            if (l.bujtinaData) {
                const bd = l.bujtinaData;
                if (bd.accommodationType) parts.push(`Accommodation Type: ${bd.accommodationType}`);
                if (bd.facilities?.length) parts.push(`Facilities: ${bd.facilities.join(', ')}`);
                if (bd.roomAmenities?.length) parts.push(`Room Amenities: ${bd.roomAmenities.join(', ')}`);
                if (bd.rules) {
                    if (bd.rules.checkIn) parts.push(`Check In: ${bd.rules.checkIn}`);
                    if (bd.rules.checkOut) parts.push(`Check Out: ${bd.rules.checkOut}`);
                }
                if (bd.food) {
                    if (bd.food.breakfast) parts.push(`Breakfast: ${bd.food.breakfast}`);
                }
            }
            // Restaurant
            if (l.restaurantData) {
                const rd = l.restaurantData;
                if (rd.cuisine?.length) parts.push(`Cuisine: ${rd.cuisine.join(', ')}`);
                if (rd.services?.length) parts.push(`Services: ${rd.services.join(', ')}`);
                if (rd.atmosphere?.length) parts.push(`Atmosphere: ${rd.atmosphere.join(', ')}`);
            }
            // Bar
            if (l.barData) {
                const bd = l.barData;
                if (bd.services?.length) parts.push(`Services: ${bd.services.join(', ')}`);
                if (bd.atmosphere?.length) parts.push(`Atmosphere: ${bd.atmosphere.join(', ')}`);
                if (bd.rules) {
                    if (bd.rules.minAge) parts.push(`Minimum Age: ${bd.rules.minAge}`);
                    if (bd.rules.smokingArea) parts.push(`Smoking Area: ${bd.rules.smokingArea}`);
                }
            }
            // Rent Car
            if (l.rentCarData) {
                const rc = l.rentCarData;
                if (rc.brandModel) parts.push(`Car Brand & Model: ${rc.brandModel}`);
                if (rc.transmission) parts.push(`Transmission: ${rc.transmission}`);
                if (rc.fuelType) parts.push(`Fuel Type: ${rc.fuelType}`);
                if (rc.seats) parts.push(`Seats: ${rc.seats}`);
            }
            // Tour
            if (l.tourData) {
                const td = l.tourData;
                if (td.duration) parts.push(`Duration: ${td.duration}`);
                if (td.price) parts.push(`Price: ${td.price}`);
                if (td.maxTravelers) parts.push(`Max Travelers: ${td.maxTravelers}`);
                if (td.inclusions?.length) parts.push(`Inclusions: ${td.inclusions.join(', ')}`);
                if (td.itinerary?.length) {
                    parts.push(`Itinerary: ${td.itinerary.map(day => `Day ${day.day}: ${day.content}`).join('; ')}`);
                }
            }
            
            parts.push(`Description: ${(l.description || '').replace(/<[^>]*>/g, '').slice(0, 500)}`);
            return parts.join('\n');
        };

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
${formatListingDetails(listing)}

Visitor country: ${visitorCountry || 'unknown'}
Visitor city: ${visitorCity || 'unknown'}
Interests: ${interests || 'general travel'}

Reviews from visitors:
${reviews.map((r) => `- ${r.rating}★: "${r.comment}"`).join('\n') || 'No reviews yet'}

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
