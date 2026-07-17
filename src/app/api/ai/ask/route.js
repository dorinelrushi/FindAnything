import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';
import { xaiChat, safeParseJson } from '@/lib/ai';
import { listingCanonicalPath } from '@/lib/listingPath';

export const dynamic = 'force-dynamic';

const TYPE_KEYWORDS = {
    hotel: ['hotel', 'hotels', 'hoteli', 'hôtels', 'alberghi', 'ホテル', 'otel', 'ξενοδοχείο', 'hoteluri'],
    restaurant: [
        'restaurant',
        'restaurants',
        'restorant',
        'food',
        'eat',
        'dining',
        'cuisine',
        'manger',
        'ristorante',
        'essen',
        'yemek',
        'ushqim',
    ],
    bar: ['bar', 'bars', 'cafe', 'café', 'pub', 'nightlife', 'cocktail', 'drink', 'birra', 'kafe'],
    bujtina: ['bujtina', 'guesthouse', 'guest house', 'agroturizem', 'agrotourism', 'bnb', 'b&b', 'pension'],
    tour: ['tour', 'tours', 'trip', 'excursion', 'sightseeing', 'guide', 'hiking', 'trek'],
    rentcar: ['rent car', 'car rental', 'rent a car', 'rental', 'makine', 'makinë', 'auto', 'hire car'],
    city: ['city', 'cities', 'qytet', 'ville', 'stadt', 'şehir'],
};

function detectTypes(text) {
    const lower = String(text || '').toLowerCase();
    const found = [];
    for (const [type, words] of Object.entries(TYPE_KEYWORDS)) {
        if (words.some((w) => lower.includes(w))) found.push(type);
    }
    return found;
}

function extractSearchTokens(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s\-]/gu, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
        .slice(0, 12);
}

function stripHtml(html) {
    return String(html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Site-wide Ask AI — multilingual place recommender grounded in real listings.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const message = String(body.message || '').trim();
        const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        if (message.length > 2000) {
            return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
        }

        await dbConnect();

        const types = detectTypes(message);
        const tokens = extractSearchTokens(message);

        const query = {};
        if (types.length === 1) {
            query.type = types[0];
        } else if (types.length > 1) {
            query.type = { $in: types };
        }

        // Prefer text matches when visitor names a place/city
        if (tokens.length > 0) {
            const or = [];
            for (const t of tokens) {
                const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(esc, 'i');
                or.push(
                    { title: re },
                    { city: re },
                    { country: re },
                    { category: re },
                    { address: re },
                    { services: re }
                );
            }
            query.$or = or;
        }

        let listings = await Listing.find(query)
            .select('title type city country address description category services slug image views')
            .sort({ views: -1, createdAt: -1 })
            .limit(40)
            .lean();

        // Fallback: broader catalog if filters were too strict
        if (listings.length < 5) {
            const broader = await Listing.find(types.length ? { type: { $in: types } } : {})
                .select('title type city country address description category services slug image views')
                .sort({ views: -1, createdAt: -1 })
                .limit(50)
                .lean();
            const seen = new Set(listings.map((l) => String(l._id)));
            for (const l of broader) {
                if (!seen.has(String(l._id))) {
                    listings.push(l);
                    seen.add(String(l._id));
                }
            }
            listings = listings.slice(0, 50);
        }

        // Always include a small sample of each major type so the AI "knows the website"
        if (listings.length < 25) {
            const extra = await Listing.find({})
                .select('title type city country address description category services slug image views')
                .sort({ views: -1 })
                .limit(30)
                .lean();
            const seen = new Set(listings.map((l) => String(l._id)));
            for (const l of extra) {
                if (!seen.has(String(l._id))) {
                    listings.push(l);
                    seen.add(String(l._id));
                }
            }
        }

        const catalog = listings.map((l) => ({
            id: String(l._id),
            title: l.title || 'Untitled',
            type: l.type,
            city: l.city || '',
            country: l.country || '',
            address: l.address || '',
            category: l.category || '',
            services: (l.services || []).slice(0, 8),
            description: stripHtml(l.description).slice(0, 220),
            path: listingCanonicalPath(l),
            image: l.image || null,
        }));

        let blogsBrief = [];
        try {
            const blogs = await Blog.find({ published: { $ne: false } })
                .select('title slug excerpt')
                .sort({ createdAt: -1 })
                .limit(6)
                .lean();
            blogsBrief = blogs.map((b) => ({
                title: b.title,
                path: `/blog/${b.slug}`,
                excerpt: stripHtml(b.excerpt || '').slice(0, 120),
            }));
        } catch {
            blogsBrief = [];
        }

        const historyText = history
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
            .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${String(m.content).slice(0, 500)}`)
            .join('\n');

        const system = `You are "Ask AI" for TryToFindEverything (trytofindeverything.online) — a global directory of hotels, restaurants, bars, guesthouses (bujtina), car rentals, tours, and cities.

CRITICAL RULES:
1. ALWAYS reply in the SAME LANGUAGE the visitor used (Albanian, English, Italian, Greek, Turkish, German, French, Spanish, etc.).
2. ONLY recommend places that appear in the WEBSITE CATALOG below. Never invent hotels, bars, or businesses not listed.
3. Prefer listings that best match what the visitor wants (type, city, vibe, services).
4. Be warm, concise, and practical — like a local host.
5. If the catalog has no perfect match, say so honestly and suggest the closest options from the catalog, or suggest browsing /explore.
6. Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "reply": "friendly answer in the visitor's language (2-5 short paragraphs or bullets as text)",
  "suggestions": [
    {
      "id": "listing id from catalog",
      "title": "exact title",
      "type": "hotel|restaurant|bar|bujtina|rentcar|tour|city",
      "city": "city",
      "country": "country",
      "path": "/type/slug",
      "image": "image url or null",
      "why": "one short reason in the visitor's language"
    }
  ],
  "followUpQuestions": ["optional question 1", "optional question 2"]
}
7. Include 0–6 suggestions max. Only include real catalog ids/paths.
8. paths must match the catalog exactly.`;

        const userMsg = `WEBSITE CATALOG (${catalog.length} places):
${catalog
    .map(
        (p, i) =>
            `${i + 1}. id=${p.id} | ${p.title} | type=${p.type} | ${p.city}${p.country ? ', ' + p.country : ''} | cat=${p.category} | services=${(p.services || []).join('; ')} | path=${p.path} | desc=${p.description}`
    )
    .join('\n')}

BLOG / GUIDES (optional mentions only):
${blogsBrief.map((b) => `- ${b.title} path=${b.path}`).join('\n') || 'None'}

CONVERSATION SO FAR:
${historyText || '(new conversation)'}

VISITOR MESSAGE:
${message}
`;

        let parsed = null;
        let fallback = false;
        let raw = '';

        try {
            raw = await xaiChat({ system, user: userMsg, temperature: 0.55 });
            parsed = safeParseJson(raw);
        } catch (aiErr) {
            console.error('Ask AI xaiChat error:', aiErr.message);
            fallback = true;
        }

        // Build structured suggestions from AI or keyword fallback
        const byId = new Map(catalog.map((c) => [c.id, c]));
        let suggestions = [];

        if (parsed?.suggestions && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions
                .map((s) => {
                    const real = byId.get(String(s.id)) || catalog.find((c) => c.path === s.path);
                    if (!real) return null;
                    return {
                        id: real.id,
                        title: real.title,
                        type: real.type,
                        city: real.city,
                        country: real.country,
                        path: real.path,
                        image: real.image,
                        why: s.why || '',
                    };
                })
                .filter(Boolean)
                .slice(0, 6);
        }

        if (!suggestions.length) {
            // Keyword / type based fallback cards
            suggestions = catalog.slice(0, 5).map((c) => ({
                id: c.id,
                title: c.title,
                type: c.type,
                city: c.city,
                country: c.country,
                path: c.path,
                image: c.image,
                why: '',
            }));
        }

        let reply =
            (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) ||
            (raw && !parsed ? raw.slice(0, 1200) : '');

        if (!reply) {
            fallback = true;
            const top = suggestions.slice(0, 4);
            const langGuess = /[ëçäöüßàèéìòù]/i.test(message)
                ? 'local'
                : 'en';
            if (top.length) {
                reply =
                    langGuess === 'local'
                        ? `Ja disa vende nga TryToFindEverything që mund t'ju interesojnë:\n\n${top.map((s) => `• ${s.title} (${s.type}${s.city ? ' · ' + s.city : ''})`).join('\n')}\n\nHapni kartën për detaje, foto dhe kontakt.`
                        : `Here are some places from TryToFindEverything that may match what you're looking for:\n\n${top.map((s) => `• ${s.title} (${s.type}${s.city ? ' · ' + s.city : ''})`).join('\n')}\n\nOpen a card for details, photos, and contact info. You can also ask in any language — e.g. "hotel në Korçë", "best bars", "where to eat".`;
            } else {
                reply =
                    'I could not find matching places yet. Try Explore on the site, or tell me a city and type (hotel, restaurant, bar, tour…).';
            }
        }

        const followUpQuestions = Array.isArray(parsed?.followUpQuestions)
            ? parsed.followUpQuestions.filter((q) => typeof q === 'string').slice(0, 3)
            : [];

        return NextResponse.json({
            success: true,
            fallback,
            reply,
            suggestions,
            followUpQuestions,
            catalogCount: catalog.length,
        });
    } catch (error) {
        console.error('Ask AI error:', error);
        return NextResponse.json({ error: 'Ask AI failed. Please try again.' }, { status: 500 });
    }
}
