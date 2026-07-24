import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';
import Job from '@/models/Job';
import { xaiChat, safeParseJson } from '@/lib/ai';
import { listingCanonicalPath } from '@/lib/listingPath';

export const dynamic = 'force-dynamic';

/** Full listing projection — all fields the AI needs to answer amenity / policy questions */
const LISTING_SELECT = [
    'title',
    'type',
    'city',
    'country',
    'address',
    'description',
    'category',
    'services',
    'slug',
    'image',
    'views',
    'scanCount',
    'whatsappNumber',
    'hotelData',
    'barData',
    'bujtinaData',
    'rentCarData',
    'tourData',
    'cityData',
].join(' ');

const TYPE_KEYWORDS = {
    hotel: ['hotel', 'hotels', 'hoteli', 'hôtels', 'alberghi', 'otel', 'ξενοδοχείο', 'hoteluri'],
    restaurant: [
        'restaurant', 'restaurants', 'restorant', 'food', 'eat', 'dining', 'cuisine',
        'manger', 'ristorante', 'essen', 'yemek', 'ushqim', 'ku te ha', 'where to eat',
    ],
    bar: ['bar', 'bars', 'cafe', 'café', 'pub', 'nightlife', 'cocktail', 'drink', 'birra', 'kafe'],
    bujtina: ['bujtina', 'guesthouse', 'guest house', 'agroturizem', 'agrotourism', 'bnb', 'b&b', 'pension'],
    tour: ['tour', 'tours', 'trip', 'excursion', 'sightseeing', 'guide', 'hiking', 'trek', 'ekskursion'],
    rentcar: ['rent car', 'car rental', 'rent a car', 'rental', 'makine', 'makinë', 'auto', 'hire car', 'makina'],
    city: ['city', 'cities', 'qytet', 'ville', 'stadt', 'şehir'],
};

const JOB_KEYWORDS = [
    'job', 'jobs', 'work', 'career', 'hiring', 'vacancy', 'vacancies', 'employment', 'position',
    'pune', 'punë', 'oferta pune', 'vende pune', 'lavoro', 'lavori', 'arbeit', 'emploi', 'iş',
    'δουλειά', 'empleo', 'trabajos', 'работа',
];

const BLOG_KEYWORDS = [
    'blog', 'blogs', 'article', 'articles', 'guide', 'guides', 'post', 'posts', 'news',
    'shkrim', 'artikull', 'udhëzues', 'articolo', 'guida', 'artikel',
];

const POPULAR_KEYWORDS = [
    'most visited', 'most popular', 'top visited', 'highest views', 'most views', 'trending',
    'most hotel', 'most hotels', 'who is the most', 'which is the most', 'top hotel',
    'më të vizituar', 'me te vizituar', 'më i vizituar', 'me i vizituar', 'më popullor',
    'più visitati', 'meistbesucht', 'plus visités', 'en çok ziyaret', 'más visitados',
];

/**
 * Amenity / feature filters visitors ask about (multilingual).
 * Each key maps to search terms used against DB text fields.
 */
const AMENITY_FILTERS = {
    pets: {
        terms: [
            'pet', 'pets', 'pet-friendly', 'pet friendly', 'dog', 'dogs', 'cat', 'cats',
            'animal', 'animals', 'hold pets', 'allow pets', 'allows pets', 'accept pets',
            'pets allowed', 'pet allowed', 'bring dog', 'with dog', 'with pets',
            'kafshë', 'kafshe', 'qen', 'mace', 'lejon kafshë', 'lejon kafshe',
            'animali', 'cani', 'gatti', 'animali ammessi',
            'haustier', 'hunde', 'katzen', 'haustiere erlaubt',
            'animaux', 'chiens', 'chats', 'animaux acceptés',
            'mascota', 'mascotas', 'perros', 'gatos',
            'evcil', 'hayvan', 'köpek', 'kedi',
        ],
        // Positive signals in listing text
        positive: [
            'allowed', 'welcome', 'accepted', 'yes', 'ok', 'permitted', 'friendly',
            'lejuar', 'po', 'pranohet', 'pranohen', 'mirëpritur', 'mirepritur',
            'ammessi', 'ammesso', 'sì', 'si', 'erlaubt', 'acceptés', 'aceptado', 'kabul',
        ],
        negative: [
            'not allowed', 'no pets', 'not accepted', 'forbidden', 'prohibited', 'no animals',
            'nuk lejohet', 'nuk pranohet', 'jo', 'non ammessi', 'nicht erlaubt', 'non acceptés',
            'no se permiten', 'yasak',
        ],
    },
    wifi: {
        terms: ['wifi', 'wi-fi', 'wi fi', 'internet', 'wireless', 'free wifi', 'wi-fi falas', 'wifi falas'],
        positive: ['wifi', 'wi-fi', 'internet', 'falas', 'free'],
        negative: [],
    },
    parking: {
        terms: ['parking', 'parkim', 'garage', 'car park', 'parkplatz', 'estacionamiento', 'otopark'],
        positive: ['parking', 'parkim', 'garage'],
        negative: [],
    },
    pool: {
        terms: ['pool', 'swimming', 'piscine', 'pishinë', 'pishine', 'havuz', 'schwimmbad'],
        positive: ['pool', 'swimming', 'piscine', 'pishin'],
        negative: [],
    },
    breakfast: {
        terms: ['breakfast', 'mëngjes', 'mengjes', 'colazione', 'frühstück', 'petit-déjeuner', 'kahvaltı'],
        positive: ['breakfast', 'mëngjes', 'mengjes', 'colazione'],
        negative: [],
    },
    ac: {
        terms: ['air conditioning', 'a/c', 'ac', 'klima', 'ajër i kondicionuar', 'climatisation', 'klimaanlage'],
        positive: ['air', 'klima', 'conditioning', 'ajër', 'ac'],
        negative: [],
    },
    family: {
        terms: ['family', 'children', 'kids', 'familjar', 'fëmijë', 'femije', 'bambini', 'kinder', 'enfants'],
        positive: ['family', 'children', 'kids', 'welcome', 'familjar', 'fëmij'],
        negative: [],
    },
    smoking: {
        terms: ['smoking', 'smoke', 'duhan', 'fumatori', 'rauchen'],
        positive: ['smoking', 'allowed', 'area'],
        negative: ['non-smoking', 'no smoking'],
    },
    liveMusic: {
        terms: ['live music', 'music', 'muzikë live', 'muzike live', 'live band'],
        positive: ['live', 'music', 'muzik'],
        negative: [],
    },
    transfer: {
        terms: ['airport transfer', 'transfer', 'shuttle', 'transfer aeroporti', 'navette'],
        positive: ['transfer', 'shuttle', 'airport', 'aeroport'],
        negative: [],
    },
};

const CHAT_PATTERNS = [
    /^(hi|hello|hey|hola|salut|bonjour|ciao|merhaba|γεια|hallo|servus|selam|përshëndetje|pershendetje)([\s!.,?]|$)/i,
    /^(how are you|how r u|how're you|si je|si jeni|come stai|cómo estás|como estas|nasılsın|nasilsin|ça va|ca va)([\s!.,?]|$)/i,
    /^(good morning|good afternoon|good evening|good night|good day)([\s!.,?]|$)/i,
    /^(thanks|thank you|thx|faleminderit|grazie|merci|danke|teşekkür|gracias)([\s!.,?]|$)/i,
    /^(ok|okay|cool|nice|great|awesome|perfect|alright|sure)([\s!.,?]|$)/i,
    /\b(who are you|what are you|what'?s your name|your name|introduce yourself|who r you)\b/i,
    /\b(kush je|kush jeni|çfarë je|cfare je|chi sei|quién eres|kimsin|wer bist du|qui es-tu)\b/i,
    /\b(are you (an |a )?ai|are you a bot|are you human)\b/i,
];

function stripHtml(html) {
    return String(html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function includesAny(text, words) {
    const lower = String(text || '').toLowerCase();
    return words.some((w) => lower.includes(w.toLowerCase()));
}

function detectTypes(text) {
    const lower = String(text || '').toLowerCase();
    const found = [];
    for (const [type, words] of Object.entries(TYPE_KEYWORDS)) {
        if (words.some((w) => lower.includes(w))) found.push(type);
    }
    return found;
}

/** Detect amenity/feature filters from visitor message */
function detectAmenities(message) {
    const lower = String(message || '').toLowerCase();
    const found = [];
    for (const [key, cfg] of Object.entries(AMENITY_FILTERS)) {
        if (cfg.terms.some((t) => lower.includes(t.toLowerCase()))) {
            found.push(key);
        }
    }
    return found;
}

function detectWantedCount(message) {
    const t = String(message || '').toLowerCase();

    const nMatch = t.match(
        /\b(?:just|only|exactly|top|show|give|suggest|recommend|another|one more|one|1)\s*(?:me\s+)?(\d+)\b/
    );
    if (nMatch) {
        const n = parseInt(nMatch[1], 10);
        if (n >= 1 && n <= 8) return n;
    }
    if (/\b(\d+)\s*(hotel|hotels|place|places|bar|bars|restaurant|job|jobs|more)\b/.test(t)) {
        const m = t.match(/\b(\d+)\s*(hotel|hotels|place|places|bar|bars|restaurant|job|jobs|more)\b/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (n >= 1 && n <= 8) return n;
        }
    }
    if (
        /\b(just one|only one|one more|another one|a single|one hotel|one more hotel|just 1|only 1|një|nje tjeter|një tjetër|edhe një|un altro|uno solo)\b/i.test(
            t
        )
    ) {
        return 1;
    }
    if (
        /\b(the most visited|most visited hotel|who is the most|which is the most|number one)\b/i.test(t) &&
        !/\b(top\s*[3-9]|list|all|several|some|few|disa)\b/i.test(t)
    ) {
        return 1;
    }
    if (/\b(a few|some|disa|alcuni|quelques)\b/i.test(t)) return 3;
    if (/\b(many|lots|all|lista|list)\b/i.test(t)) return 5;
    return null;
}

function isChatMessage(message) {
    const text = String(message || '').trim();
    if (!text || text.length > 160) return false;
    const looksLikeChat = CHAT_PATTERNS.some((re) => re.test(text));
    if (!looksLikeChat) return false;

    const lower = text.toLowerCase();
    const asksContent =
        includesAny(lower, JOB_KEYWORDS) ||
        includesAny(lower, BLOG_KEYWORDS) ||
        includesAny(lower, POPULAR_KEYWORDS) ||
        detectTypes(text).length > 0 ||
        detectAmenities(text).length > 0 ||
        /\b(suggest|recommend|show me|find|trego|gjej|cerca|cherche|allow|pets|wifi)\b/i.test(text);

    return !asksContent;
}

function detectLocation(message, dbCities, dbCountries) {
    const lowerMessage = String(message || '').toLowerCase();
    
    // Sort descending by length so longer names match first
    const sortedCities = [...dbCities].filter(Boolean).map(c => String(c).trim()).sort((a, b) => b.length - a.length);
    const sortedCountries = [...dbCountries].filter(Boolean).map(c => String(c).trim()).sort((a, b) => b.length - a.length);

    for (const city of sortedCities) {
        const cleanCity = city.toLowerCase();
        // Remove trailing declensions common in Albanian e.g. Tirana vs Tirane vs Vlora vs Vlore
        const stem = cleanCity.replace(/[aeë\s]$/, '');
        if (stem.length >= 3 && lowerMessage.includes(stem)) {
            return { type: 'city', value: city, stem };
        }
    }

    for (const country of sortedCountries) {
        const cleanCountry = country.toLowerCase();
        const stem = cleanCountry.replace(/[aeë\s]$/, '');
        if (stem.length >= 3 && lowerMessage.includes(stem)) {
            return { type: 'country', value: country, stem };
        }
    }

    return null;
}

function detectIntents(message, locationInfo = null) {
    const text = String(message || '').trim();
    const lower = text.toLowerCase();
    const intents = new Set();
    const chatOnly = isChatMessage(text);
    const wantedCount = detectWantedCount(text);
    const amenities = detectAmenities(text);
    const types = detectTypes(text);

    if (chatOnly && !locationInfo) {
        return {
            intents: ['chat'],
            types: [],
            amenities: [],
            isChatOnly: true,
            wantedCount: 0,
        };
    }

    if (includesAny(lower, JOB_KEYWORDS)) intents.add('jobs');
    if (includesAny(lower, BLOG_KEYWORDS)) intents.add('blogs');
    if (includesAny(lower, POPULAR_KEYWORDS)) intents.add('popular');
    if (types.length) intents.add('places');
    if (amenities.length) {
        intents.add('places');
        intents.add('amenities');
    }
    if (locationInfo) {
        intents.add('places');
    }

    if (
        /\b(website|site|trytofindeverything|what (can|do) you|help me|si mund|çfarë ofron|how (can|do) you help)\b/i.test(
            lower
        )
    ) {
        intents.add('site');
    }

    // Feature questions without type: still search places (e.g. "pet friendly?")
    if (
        !intents.size &&
        /\b(allow|allows|have|has|with|without|near|in|for|looking|need|want|lejon|ka|me)\b/i.test(lower)
    ) {
        intents.add('places');
    }

    if (!intents.size) {
        if (text.length < 12) intents.add('chat');
        else {
            intents.add('site');
            intents.add('places');
        }
    }

    if (intents.has('popular')) intents.add('places');

    let count = wantedCount;
    if (count == null) {
        if (intents.has('amenities')) count = 4;
        else if (intents.has('popular') && !/\b(top|list|some|few|disa)\b/i.test(lower)) count = 1;
        else if (intents.has('jobs')) count = 4;
        else if (intents.has('blogs')) count = 3;
        else if (intents.has('places')) count = 3;
        else if (intents.has('chat')) count = 0;
        else count = 3;
    }

    return {
        intents: [...intents],
        types,
        amenities,
        isChatOnly: intents.size === 1 && intents.has('chat'),
        wantedCount: count,
    };
}

function extractPriorSuggestionIds(history) {
    const ids = new Set();
    for (const m of history || []) {
        if (m?.role !== 'assistant') continue;
        if (Array.isArray(m.suggestions)) {
            for (const s of m.suggestions) {
                if (s?.id) ids.add(String(s.id));
            }
        }
    }
    return ids;
}

/** Flatten ALL listing fields into searchable + AI-readable text */
function listingSearchBlob(l) {
    const parts = [];
    const push = (v) => {
        if (v == null || v === '') return;
        if (Array.isArray(v)) {
            v.forEach(push);
            return;
        }
        if (typeof v === 'object') {
            Object.values(v).forEach(push);
            return;
        }
        if (typeof v === 'boolean') {
            if (v) parts.push('yes');
            return;
        }
        parts.push(String(v));
    };

    push(l.title);
    push(l.type);
    push(l.city);
    push(l.country);
    push(l.address);
    push(l.category);
    push(l.services);
    push(stripHtml(l.description));
    push(l.hotelData);
    push(l.barData);
    push(l.bujtinaData);
    push(l.rentCarData);
    push(l.tourData);
    push(l.cityData);

    return parts.join(' ').toLowerCase().replace(/\s+/g, ' ');
}

function mapListingFull(l) {
    const hd = l.hotelData || {};
    const bd = l.barData || {};
    const buj = l.bujtinaData || {};
    const rc = l.rentCarData || {};
    const td = l.tourData || {};
    const cd = l.cityData || {};

    const allServices = [
        ...(l.services || []),
        ...(hd.generalServices || []),
        ...(hd.additionalServices || []),
        ...(hd.roomAmenities || []),
        ...(hd.roomTypes || []),
        ...(bd.services || []),
        ...(bd.atmosphere || []),
        ...(buj.facilities || []),
        ...(buj.roomAmenities || []),
        ...(buj.style || []),
        ...(rc.extraServices || []),
        ...(rc.category || []),
        ...(td.inclusions || []),
    ].filter(Boolean);

    const policies = {
        pets: hd.policies?.pets || '',
        children: hd.policies?.children || '',
        cancellation: hd.policies?.cancellation || '',
        payment: hd.policies?.payment || '',
        barMinAge: bd.rules?.minAge || '',
        smokingArea: bd.rules?.smokingArea || '',
        suitableFor: bd.rules?.suitableFor || [],
    };

    const details = {
        hotelRooms: hd.totalRooms || null,
        hotelRoomTypes: hd.roomTypes || [],
        barFeatures: bd.features || {},
        bujtinaType: buj.accommodationType || '',
        bujtinaFood: buj.food || {},
        rentCar: rc.brandModel
            ? {
                  brandModel: rc.brandModel,
                  year: rc.year,
                  fuel: rc.fuelType,
                  transmission: rc.transmission,
                  seats: rc.seats,
                  prices: rc.prices,
              }
            : null,
        tour: td.duration
            ? {
                  duration: td.duration,
                  price: td.price,
                  maxTravelers: td.maxTravelers,
                  inclusions: td.inclusions || [],
              }
            : null,
        cityInfo: cd.bestTimeToVisit || cd.population ? cd : null,
    };

    const searchText = listingSearchBlob(l);

    return {
        kind: 'place',
        id: String(l._id),
        title: l.title || 'Untitled',
        type: l.type,
        city: l.city || '',
        country: l.country || '',
        address: l.address || '',
        category: l.category || '',
        services: allServices.slice(0, 30),
        policies,
        details,
        description: stripHtml(l.description).slice(0, 400),
        path: listingCanonicalPath(l),
        image: l.image || null,
        views: typeof l.views === 'number' ? l.views : 0,
        scanCount: typeof l.scanCount === 'number' ? l.scanCount : 0,
        whatsappNumber: l.whatsappNumber || '',
        searchText,
        // Compact line for the AI model
        amenitySummary: buildAmenitySummary(allServices, policies, details, l),
    };
}

function buildAmenitySummary(services, policies, details, l) {
    const bits = [];
    if (policies.pets) bits.push(`pets_policy="${policies.pets}"`);
    if (policies.children) bits.push(`children_policy="${policies.children}"`);
    if (policies.cancellation) bits.push(`cancellation="${policies.cancellation}"`);
    if (policies.payment) bits.push(`payment="${policies.payment}"`);
    if (services.length) bits.push(`services=[${services.slice(0, 20).join('; ')}]`);
    if (details.hotelRooms) bits.push(`rooms=${details.hotelRooms}`);
    if (details.hotelRoomTypes?.length) bits.push(`room_types=${details.hotelRoomTypes.join(',')}`);
    if (details.barFeatures?.liveMusicTonight) bits.push('live_music=yes');
    if (details.barFeatures?.openLate) bits.push('open_late=yes');
    if (details.bujtinaType) bits.push(`stay=${details.bujtinaType}`);
    if (details.bujtinaFood?.breakfast) bits.push(`breakfast="${details.bujtinaFood.breakfast}"`);
    if (details.rentCar) {
        bits.push(
            `car=${details.rentCar.brandModel} ${details.rentCar.year || ''} ${details.rentCar.transmission || ''}`
        );
    }
    if (details.tour) bits.push(`tour_duration=${details.tour.duration} price=${details.tour.price || ''}`);
    if (l.category) bits.push(`category=${l.category}`);
    return bits.join(' | ');
}

/**
 * Score how well a listing matches requested amenities (e.g. pets).
 * Higher = better match. Negative = clearly does NOT allow.
 * IMPORTANT: negative signals always win over positive — 'not allowed' must NEVER score positive.
 */
function scoreAmenityMatch(listing, amenities) {
    if (!amenities.length) return 0;
    const blob = listing.searchText || '';
    let score = 0;

    for (const key of amenities) {
        const cfg = AMENITY_FILTERS[key];
        if (!cfg) continue;

        const hasTerm = cfg.terms.some((t) => blob.includes(t.toLowerCase()));
        if (!hasTerm) {
            // Special: pets often only in policies.pets without word "pet" in Albanian
            if (key === 'pets') {
                const petsPolicy = (listing.policies?.pets || '').toLowerCase();
                if (!petsPolicy) {
                    score -= 1; // unknown
                    continue;
                }
                // Check negative FIRST and with full priority
                const isNeg =
                    cfg.negative.some((n) => petsPolicy.includes(n)) ||
                    /not allowed|no pets|nuk lejohet|non ammessi|nicht erlaubt|forbidden|prohibited/i.test(petsPolicy);
                if (isNeg) { score -= 20; continue; }
                // Only check positive AFTER confirming no negative
                const isPos =
                    cfg.positive.filter((p) => p !== 'allowed').some((p) => petsPolicy.includes(p)) ||
                    /\bpets? allowed\b|\bpet.?friendly\b|\bwelcome\b|\bpermitted\b|\blejuar\b|\bpranohet\b|\bammessi\b|\berlaubt\b/i.test(petsPolicy);
                if (isPos) score += 25;
                else if (petsPolicy && !isNeg) score += 5; // non-empty policy, neutral/unknown
                continue;
            }
            score -= 2;
            continue;
        }

        // Has amenity term in data
        if (key === 'pets') {
            const petsPolicy = (listing.policies?.pets || '').toLowerCase();
            const combinedText = (petsPolicy + ' ' + blob).toLowerCase();
            // Negative check has absolute priority
            const isNeg =
                cfg.negative.some((n) => combinedText.includes(n)) ||
                /not allowed|no pets|nuk lejohet|non ammessi|nicht erlaubt|forbidden|prohibited|not accepted/i.test(combinedText);
            if (isNeg) { score -= 25; continue; }
            // Positive only when no negative found
            const isPos =
                cfg.positive.filter((p) => p !== 'allowed').some((p) => combinedText.includes(p)) ||
                /\bpets? allowed\b|\bpet.?friendly\b|\bwelcome\b|\bpermitted\b|\blejuar\b|\bpranohet\b|\bammessi\b|\berlaubt\b/i.test(combinedText);
            if (isPos) score += 30;
            else score += 8; // term present but no clear signal
        } else {
            score += 15;
            if (cfg.positive.some((p) => blob.includes(p))) score += 5;
            if (cfg.negative.some((n) => blob.includes(n))) score -= 10;
        }
    }

    return score;
}

function mapJob(j) {
    return {
        kind: 'job',
        id: String(j._id),
        title: j.title,
        type: 'job',
        companyName: j.companyName || '',
        city: j.location || '',
        country: '',
        description: stripHtml(j.description).slice(0, 320),
        path: '/jobs',
        applicationLink: j.applicationLink || '',
        image: null,
        views: 0,
    };
}

function mapBlog(b) {
    return {
        kind: 'blog',
        id: String(b._id),
        title: b.title,
        type: 'blog',
        city: '',
        country: '',
        description: stripHtml(b.excerpt || b.content).slice(0, 320),
        path: `/blog/${b.slug}`,
        image: b.coverImage || null,
        tags: (b.tags || []).slice(0, 6),
        views: 0,
    };
}

/** Build MongoDB filter for amenity keywords across nested fields */
function buildAmenityDbFilter(amenities) {
    if (!amenities.length) return null;

    const or = [];
    for (const key of amenities) {
        const cfg = AMENITY_FILTERS[key];
        if (!cfg) continue;
        for (const term of cfg.terms.slice(0, 12)) {
            const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            or.push(
                { services: re },
                { description: re },
                { category: re },
                { 'hotelData.policies.pets': re },
                { 'hotelData.policies.children': re },
                { 'hotelData.generalServices': re },
                { 'hotelData.additionalServices': re },
                { 'hotelData.roomAmenities': re },
                { 'barData.services': re },
                { 'barData.atmosphere': re },
                { 'barData.rules.suitableFor': re },
                { 'bujtinaData.facilities': re },
                { 'bujtinaData.roomAmenities': re },
                { 'bujtinaData.food.breakfast': re },
                { 'rentCarData.extraServices': re },
                { 'tourData.inclusions': re }
            );
        }
    }
    return or.length ? { $or: or } : null;
}

async function loadWebsiteContext(message, intentInfo, excludeIds = new Set(), locationInfo = null) {
    const { intents, types, amenities = [], isChatOnly } = intentInfo;

    const [totalListings, totalJobs, totalBlogs, typeCounts] = await Promise.all([
        Listing.countDocuments({}),
        Job.countDocuments({ active: true }),
        Blog.countDocuments({ published: { $ne: false } }),
        Listing.aggregate([{ $group: { _id: '$type', count: { $sum: 1 }, totalViews: { $sum: '$views' } } }]),
    ]);

    const stats = {
        totalListings,
        totalJobs,
        totalBlogs,
        byType: Object.fromEntries(
            typeCounts.map((t) => [t._id || 'unknown', { count: t.count, totalViews: t.totalViews || 0 }])
        ),
    };

    if (isChatOnly) {
        return { stats, places: [], jobs: [], blogs: [], topVisited: [], matchedAmenities: amenities };
    }

    let places = [];
    let topByViews = [];
    let jobs = [];
    let blogs = [];

    const wantPlaces =
        intents.includes('places') ||
        intents.includes('popular') ||
        intents.includes('site') ||
        intents.includes('amenities');
    const wantJobs = intents.includes('jobs') || intents.includes('site');
    const wantBlogs = intents.includes('blogs') || intents.includes('site');

    if (wantPlaces) {
        const baseQuery = {};
        if (types.length === 1) baseQuery.type = types[0];
        else if (types.length > 1) baseQuery.type = { $in: types };
        
        // Default hotels when talking about pets + no type (often hotels)
        if (!types.length && amenities.includes('pets')) {
            baseQuery.type = { $in: ['hotel', 'bujtina'] };
        }

        // Add location filters
        if (locationInfo) {
            if (locationInfo.type === 'city') {
                baseQuery.city = { $regex: new RegExp(locationInfo.stem, 'i') };
            } else if (locationInfo.type === 'country') {
                baseQuery.country = { $regex: new RegExp(locationInfo.stem, 'i') };
            }
        }

        // 1) Prefer DB matches for amenities
        const amenityFilter = buildAmenityDbFilter(amenities);
        if (amenityFilter) {
            const matched = await Listing.find({ ...baseQuery, ...amenityFilter })
                .select(LISTING_SELECT)
                .sort({ views: -1 })
                .limit(50)
                .lean();
            places = matched;
        }

        // 2) Always load a strong catalog slice with FULL data for AI
        const catalog = await Listing.find(baseQuery)
            .select(LISTING_SELECT)
            .sort({ views: -1, createdAt: -1 })
            .limit(80)
            .lean();

        // 3) If still thin, load more of all types in that location if specified
        let extra = [];
        if (catalog.length < 40) {
            const extraQuery = locationInfo
                ? (locationInfo.type === 'city'
                    ? { city: { $regex: new RegExp(locationInfo.stem, 'i') } }
                    : { country: { $regex: new RegExp(locationInfo.stem, 'i') } })
                : {};
            extra = await Listing.find(extraQuery)
                .select(LISTING_SELECT)
                .sort({ views: -1 })
                .limit(100)
                .lean();
        }

        // Merge unique
        const seen = new Set();
        const merged = [];
        for (const p of [...places, ...catalog, ...extra]) {
            const id = String(p._id);
            if (seen.has(id)) continue;
            seen.add(id);
            merged.push(p);
        }
        places = merged;

        // Top by views (full data)
        const popularQuery = { ...baseQuery };
        topByViews = await Listing.find(popularQuery)
            .select(LISTING_SELECT)
            .sort({ views: -1, scanCount: -1 })
            .limit(15)
            .lean();

        // Map + score amenity relevance
        let mapped = places.map(mapListingFull);

        if (amenities.length) {
            mapped = mapped
                .map((p) => ({ ...p, matchScore: scoreAmenityMatch(p, amenities) }))
                .sort((a, b) => b.matchScore - a.matchScore || b.views - a.views);

            // Put positive matches first; keep some unknowns for honesty
            const positive = mapped.filter((p) => p.matchScore > 0);
            const unknown = mapped.filter((p) => p.matchScore === 0 || (p.matchScore > -10 && p.matchScore <= 0));
            const negative = mapped.filter((p) => p.matchScore <= -10);
            mapped = [...positive, ...unknown.slice(0, 10), ...negative.slice(0, 5)];
        } else if (intents.includes('popular')) {
            mapped.sort((a, b) => b.views - a.views);
        }

        if (excludeIds.size) {
            const fresh = mapped.filter((p) => !excludeIds.has(p.id));
            if (fresh.length) mapped = [...fresh, ...mapped.filter((p) => excludeIds.has(p.id))];
        }

        places = mapped.slice(0, 60);
        topByViews = topByViews.map(mapListingFull);
    }

    if (wantJobs) {
        const jobQuery = { active: true };
        if (locationInfo) {
            jobQuery.location = { $regex: new RegExp(locationInfo.stem, 'i') };
        }
        jobs = await Job.find(jobQuery)
            .select('title companyName location description applicationLink createdAt')
            .sort({ createdAt: -1 })
            .limit(25)
            .lean()
            .then((rows) => rows.map(mapJob));
    }

    if (wantBlogs) {
        const blogQuery = { published: { $ne: false } };
        if (locationInfo) {
            const re = new RegExp(locationInfo.stem, 'i');
            blogQuery.$or = [
                { title: re },
                { content: re },
                { excerpt: re },
                { tags: re }
            ];
        }
        blogs = await Blog.find(blogQuery)
            .select('title slug excerpt content coverImage tags createdAt')
            .sort({ createdAt: -1 })
            .limit(12)
            .lean()
            .then((rows) => rows.map(mapBlog));
    }

    return {
        stats,
        places,
        jobs,
        blogs,
        topVisited: (topByViews.length ? topByViews : places).slice(0, 10),
        matchedAmenities: amenities,
    };
}

function buildSystemPrompt(wantedCount, amenities, locationInfo = null, currentListing = null) {
    const locationNote = locationInfo
        ? `\nLOCATION FOCUS: Visitor is asking about ${locationInfo.value}. Only suggest places, jobs, or blogs in ${locationInfo.value}.`
        : '';

    const amenityNote = amenities.length
        ? `\nAMENITY FOCUS: Visitor asked about: ${amenities.join(', ')}.
- Use each place's amenitySummary, services, and policies (especially pets_policy).
- ONLY recommend places that CLEARLY match (e.g. pets allowed / welcome / pet-friendly).
- If policy says "Not allowed" / "No" / "Nuk lejohet" — do NOT recommend them under any circumstances.
- If there are no matches or only negative/unknown matches for the requested amenity in the requested location, you MUST state that clearly in your "reply" (e.g. "I'm sorry, I couldn't find any pet-friendly hotels in Tirana.") and you MUST leave the "suggestions" array completely empty [].`
        : '';

    const currentListingNote = currentListing
        ? `\nCURRENT LISTING CONTEXT: The user is currently browsing the page for "${currentListing.title}" (${currentListing.type} in ${currentListing.city || ''}).
- When the user asks page-specific questions (like "do you allow pets?", "what is the price?", "what are your services?", "where are you located?") or uses pronouns like "you", "this place", "here", "this hotel", they are referring to this current listing.
- Answer their questions about "${currentListing.title}" using the provided details in the CURRENT PAGE LISTING BEING VIEWED section in the prompt. Do not invent details.`
        : '';

    return `You are the official AI Travel Assistant for TryToFindEverything (trytofindeverything.online), a platform designed to help tourists discover businesses, places, and experiences in Albania.

Your primary goal is to help visitors find relevant, useful, and trustworthy information while guiding them toward real businesses and destinations available on the TryToFindEverything platform.

You read live website database data to answer questions about hotels, restaurants, bars, tours, car rentals, jobs, and blogs.

${locationNote}${amenityNote}${currentListingNote}

## CORE RULE: NEVER HALLUCINATE BUSINESSES

You must NEVER invent, create, assume, or fabricate the existence of any business.

You may ONLY recommend businesses that are explicitly provided to you through the platform's database, search results, or trusted business data supplied in the current context (WEBSITE DATA / CURRENT PAGE LISTING).

If a business is not present in the provided database or search results, you MUST NOT recommend it as a business listed on TryToFindEverything.

Never create or assume:
* Business names, hotel names, restaurant names, bar names
* Addresses, phone numbers, WhatsApp numbers
* Menus, prices, reviews, ratings, opening hours
* Services, facilities, locations, special offers, discounts, events

If this information is not available in the provided data, do not guess it.

## WHEN NO BUSINESS IS FOUND

If the user's request requires a business search and no matching business is found in the platform's available data, clearly explain something like:

"I couldn't find a matching business on TryToFindEverything based on the information currently available."

Do not replace missing results with invented businesses. Leave "suggestions" empty [].

You may provide general travel advice or ask the user to change or broaden their search, but always clearly distinguish between general knowledge and businesses actually listed on the platform.

## BUSINESS RECOMMENDATIONS

When recommending businesses, only use businesses returned by the platform's database.

Base recommendations only on verified information available in the provided business data.

Do NOT say unsupported claims like "has the best seafood" unless that claim is explicitly supported by reliable data.

Avoid unsupported superlatives such as: Best, Cheapest, Most popular, Number one, Highest rated, Most authentic — unless the platform provides reliable data supporting the claim.

## BE TRANSPARENT

Always distinguish between:
1. Information directly available from TryToFindEverything listings.
2. General travel knowledge.
3. Information provided by the user.

Never present assumptions as facts. If you are unsure, say so. If information is missing, say that it is not currently available.

Trust and transparency are more important than giving an answer to every question.

## SEARCH AND FILTERING

When the user asks for recommendations, understand their intent and identify relevant criteria such as:
* Location, city, category, type of business, cuisine, preferences, activities
* Distance, if location data is available
* Available services
* User's budget, only if reliable price information exists

Use the available platform data to find the closest relevant matches.
If the user asks for a specific location, prioritize businesses in that location.
If the user asks for a specific type of business, do not recommend unrelated businesses.
If the user asks for something that does not exist in the platform's database, be transparent about it.

## WHATSAPP AND CONTACT

If a business listing contains a WhatsApp contact, you may direct the user to contact the business through WhatsApp.

Never invent or generate a WhatsApp number.
Never claim that a business is available on WhatsApp unless the provided business data confirms it.

When appropriate, encourage the user to contact the business directly for: current availability, prices, reservations, special requests, updated opening hours, services.

## MENUS AND PRICES

Never invent menu items or prices.
If a menu is available in the business data, you may summarize or reference it.
If no menu or price information is available, say something like:
"Menu and pricing information is not currently available on this listing. You can contact the business directly through WhatsApp for the latest information."
Never estimate or guess prices.

## REVIEWS AND RATINGS

Never fabricate reviews, ratings, testimonials, or visitor experiences.
If reviews or ratings are not available, do not create them.
Do not claim that a business is highly rated unless reliable rating data is provided.

## TRAVEL ASSISTANCE

You are not only a business directory assistant. You are also an Albania Travel Concierge.

You can help tourists with:
* Trip planning, city exploration, activity suggestions
* General information about Albania, travel ideas, cultural information
* Food and cuisine, beaches, historical sites, nature
* Transportation guidance and general travel questions

When creating travel plans, prioritize businesses and places available on TryToFindEverything whenever relevant.
If a specific business is not available in the platform's database, you may provide general information about a destination, but do not falsely present an external business as a TryToFindEverything listing.

## PERSONALIZED RECOMMENDATIONS

When possible, ask useful follow-up questions before making recommendations (e.g. location, days staying, preferred experiences, travel party).
Do not ask unnecessary questions if the user's request is already clear.

## RESPONSE STYLE

Be friendly, natural, concise, and helpful.
Speak like a knowledgeable local travel concierge, not like a generic chatbot.
Always chat back in the same language as the visitor (English, Albanian, Italian, German, Turkish, Greek, etc.).

Give clear recommendations and explain why they match the user's request, but only using information supported by the available data.

When recommending a listed business, provide useful actions when available:
* View business profile, view menu, contact via WhatsApp, explore location, discover similar businesses

Do not overwhelm users with unnecessary information.

## IMPORTANT PRIORITY ORDER

Always follow these priorities:
1. Accuracy
2. Transparency
3. Trust
4. Relevance
5. Helpfulness

Never sacrifice accuracy or trust just to provide an answer.

## FINAL RULE

If you do not know something, say you do not know.
If the platform does not have the requested business, say so.
If information is missing, do not invent it.
If the user asks for a recommendation, use only real businesses provided by the platform's available database or search results.

Your job is not to pretend to know everything.
Your job is to help tourists discover Albania through accurate information, real businesses, and trustworthy recommendations.

## APP-SPECIFIC RULES

1. Chat/greetings/who-are-you → friendly answer, suggestions=[].
2. Never invent places. Only WEBSITE DATA.
3. For hotels/bars/etc. use amenitySummary + services + policies to answer accurately.
4. "Pets" / "hold pets" / "pet friendly" → check pets_policy and services carefully.
5. QUANTITY: return at most ${wantedCount} suggestion cards (0 for chat).
6. "One more" → a different place not already shown.
7. Most visited → highest views first.
8. Be specific: name, city, why it matches (quote policy/service).
9. If you suggest a place, list it in "suggestions" AND mention it in the "reply". If no matching place exists, the "suggestions" array must be empty [].

OUTPUT only valid JSON:
{
  "intent": "chat|places|jobs|blogs|popular|amenities|mixed|site",
  "reply": "professional natural answer",
  "suggestions": [
    {
      "kind": "place|job|blog",
      "id": "from data",
      "title": "exact",
      "type": "hotel|restaurant|bar|bujtina|rentcar|tour|city|job|blog",
      "city": "",
      "country": "",
      "path": "exact path",
      "image": null,
      "applicationLink": "",
      "why": "short reason citing policy/service if relevant",
      "views": 0
    }
  ],
  "followUpQuestions": ["up to 2"]
}`;
}

function buildUserPayload(message, history, ctx, intentInfo, excludeIds, currentListing = null, currentListingReviews = []) {
    const historyText = (history || [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${String(m.content).slice(0, 500)}`)
        .join('\n');

    if (intentInfo.isChatOnly && !currentListing) {
        return `MODE: chat only
SITE: ${ctx.stats.totalListings} places, ${ctx.stats.totalJobs} jobs, ${ctx.stats.totalBlogs} blogs.
CONVERSATION:
${historyText || '(new)'}
VISITOR: ${message}
Reply as professional concierge. suggestions=[].`;
    }

    // Ranked places with full amenity data for the model
    const placesBlock = ctx.places
        .map((p, i) => {
            const score = typeof p.matchScore === 'number' ? ` matchScore=${p.matchScore}` : '';
            return `${i + 1}. id=${p.id} | ${p.title} | type=${p.type} | views=${p.views}${score}
   location: ${[p.city, p.country, p.address].filter(Boolean).join(' · ')}
   path=${p.path}
   ${p.amenitySummary || ''}
   desc: ${(p.description || '').slice(0, 200)}`;
        })
        .join('\n\n');

    const jobsBlock = ctx.jobs
        .map(
            (j, i) =>
                `${i + 1}. id=${j.id} | ${j.title} @ ${j.companyName} | ${j.city} | apply=${j.applicationLink} | ${j.description}`
        )
        .join('\n');

    const blogsBlock = ctx.blogs
        .map((b, i) => `${i + 1}. id=${b.id} | ${b.title} | path=${b.path} | ${b.description}`)
        .join('\n');

    const topBlock = ctx.topVisited
        .map((p, i) => `${i + 1}. id=${p.id} | ${p.title} (${p.type}) views=${p.views} path=${p.path}`)
        .join('\n');

    const currentListingBlock = currentListing
        ? `CURRENT PAGE LISTING BEING VIEWED:
id=${currentListing.id || currentListing._id} | ${currentListing.title} | type=${currentListing.type} | city=${currentListing.city || ''} | country=${currentListing.country || ''} | address=${currentListing.address || ''}
${currentListing.amenitySummary || ''}
desc: ${(currentListing.description || '').slice(0, 400)}

CURRENT LISTING REVIEWS:
${currentListingReviews.map(r => `- ${r.rating}★: "${r.comment}"`).join('\n') || 'No reviews yet'}\n\n`
        : '';

    return `MODE: full website search using database
${currentListingBlock}INTENTS: ${intentInfo.intents.join(', ')}
TYPES: ${intentInfo.types.join(', ') || 'any'}
AMENITIES REQUESTED: ${intentInfo.amenities?.join(', ') || 'none'}
MAX CARDS: ${intentInfo.wantedCount}
ALREADY SHOWN IDS: ${[...excludeIds].join(', ') || 'none'}

STATS: ${JSON.stringify(ctx.stats)}

TOP BY VIEWS:
${topBlock || 'n/a'}

FULL PLACES FROM DATABASE (${ctx.places.length}) — includes policies/services:
${placesBlock || 'none'}

JOBS:
${jobsBlock || 'none'}

BLOGS:
${blogsBlock || 'none'}

CONVERSATION:
${historyText || '(new)'}

VISITOR MESSAGE:
${message}

Answer accurately from database fields above. Max ${intentInfo.wantedCount} suggestion(s).`;
}

function resolveSuggestions(parsed, ctx, maxCount) {
    if (maxCount <= 0) return [];

    const placeById = new Map(ctx.places.map((p) => [p.id, p]));
    const jobById = new Map(ctx.jobs.map((j) => [j.id, j]));
    const blogById = new Map(ctx.blogs.map((b) => [b.id, b]));
    const raw = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const out = [];

    for (const s of raw) {
        if (out.length >= maxCount) break;
        const kind = s.kind || (s.type === 'job' ? 'job' : s.type === 'blog' ? 'blog' : 'place');
        const id = String(s.id || '');

        if (kind === 'job') {
            const real = jobById.get(id) || ctx.jobs.find((j) => j.title === s.title);
            if (!real) continue;
            out.push({
                kind: 'job',
                id: real.id,
                title: real.title,
                type: 'job',
                city: real.city,
                country: '',
                path: '/jobs',
                image: null,
                applicationLink: real.applicationLink || '',
                companyName: real.companyName || '',
                why: s.why || '',
                views: 0,
            });
            continue;
        }

        if (kind === 'blog') {
            const real = blogById.get(id) || ctx.blogs.find((b) => b.path === s.path || b.title === s.title);
            if (!real) continue;
            out.push({
                kind: 'blog',
                id: real.id,
                title: real.title,
                type: 'blog',
                city: '',
                country: '',
                path: real.path,
                image: real.image,
                why: s.why || '',
                views: 0,
            });
            continue;
        }

        const real =
            placeById.get(id) ||
            ctx.places.find((p) => p.path === s.path) ||
            ctx.places.find((p) => p.title === s.title);
        if (!real) continue;
        out.push({
            kind: 'place',
            id: real.id,
            title: real.title,
            type: real.type,
            city: real.city,
            country: real.country,
            path: real.path,
            image: real.image,
            why: s.why || real.policies?.pets || (real.views ? `${real.views} views` : ''),
            views: real.views || 0,
        });
    }

    return out.slice(0, maxCount);
}

function fallbackAmenitySuggestions(ctx, amenities, maxCount, excludeIds) {
    let list = ctx.places.filter((p) => !excludeIds.has(p.id));

    if (amenities.length) {
        list = list
            .map((p) => ({ ...p, matchScore: p.matchScore ?? scoreAmenityMatch(p, amenities) }))
            .filter((p) => p.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore || b.views - a.views);
    }

    return list.slice(0, maxCount).map((p) => ({
        kind: 'place',
        id: p.id,
        title: p.title,
        type: p.type,
        city: p.city,
        country: p.country,
        path: p.path,
        image: p.image,
        why:
            amenities.includes('pets') && p.policies?.pets
                ? `Pets: ${p.policies.pets}`
                : p.services?.slice(0, 3).join(', ') || (p.views ? `${p.views} views` : 'On this website'),
        views: p.views || 0,
    }));
}

function fallbackReply(message, intentInfo, ctx, excludeIds, locationInfo = null) {
    const locationLabel = locationInfo ? ` in ${locationInfo.value}` : '';

    if (intentInfo.isChatOnly) {
        const lower = String(message || '').toLowerCase();
        if (/\b(who are you|what are you|kush je|chi sei|quién eres|kimsin|wer bist du|qui es-tu)\b/i.test(lower)) {
            return {
                reply: "Hi there! 👋 I'm Ask AI, your personal concierge on TryToFindEverything. I have access to this website's real database — hotels, restaurants, bars, tours, car rentals, jobs, and blog guides. Just ask me anything, in any language you prefer!\n\nTry something like: \"hotels that allow pets\", \"bars with live music in Korçë\", or \"jobs available\".",
                suggestions: [],
                followUpQuestions: ['Hotels that allow pets', 'Most visited hotel', 'Show available jobs'],
            };
        }
        if (/\b(how are you|si je|si jeni|comment ça va|come stai|nasılsın)\b/i.test(lower)) {
            return {
                reply: "I'm doing great, thank you for asking! 😊 Ready to help you discover amazing places. Would you like hotel suggestions, restaurant picks, or maybe info about local tours? Just say the word!",
                suggestions: [],
                followUpQuestions: ['Pet-friendly hotels', 'Best restaurants', 'Tours & activities'],
            };
        }
        if (/\b(good morning|good afternoon|good evening|mirëmëngjes|mirëdita|mirëmbrëma)\b/i.test(lower)) {
            return {
                reply: "Good day to you! 🌟 Welcome to TryToFindEverything. I'm here to help you find the best hotels, restaurants, activities, and more. What can I help you discover today?",
                suggestions: [],
                followUpQuestions: ['Hotels with free Wi-Fi', 'Most popular places', 'Show jobs'],
            };
        }
        return {
            reply: "Hello there! 👋 I'm Ask AI on TryToFindEverything — your friendly local guide to the best hotels, restaurants, bars, tours, car rentals, and more. Ask me anything in your language!\n\nFor example: \"pet-friendly hotels in Tirana\", \"most visited hotel\", \"bars with live music\", or \"available jobs\".",
            suggestions: [],
            followUpQuestions: ['Hotels that allow pets', 'Show jobs', 'Most visited hotel'],
        };
    }

    const max = Math.max(1, intentInfo.wantedCount || 3);
    const amenities = intentInfo.amenities || [];

    if (amenities.length || intentInfo.intents.includes('places') || intentInfo.intents.includes('amenities')) {
        const suggestions = fallbackAmenitySuggestions(ctx, amenities, max, excludeIds);
        if (amenities.includes('pets')) {
            if (suggestions.length) {
                const loc = suggestions[0].city ? ` in ${suggestions[0].city}` : '';
                return {
                    reply:
                        suggestions.length === 1
                            ? `Great news! 🐾 I found a pet-friendly option${loc}: **${suggestions[0].title}**. ${suggestions[0].why ? `(${suggestions[0].why})` : ''} I recommend checking the listing for full details, or contacting them via WhatsApp to confirm before your trip.`
                            : `I found ${suggestions.length} places that appear to welcome pets! 🐾 Please confirm the pet policy directly with the property before you travel — policies can vary.`,
                    suggestions,
                    followUpQuestions: ['One more pet-friendly option', 'Hotels with parking', 'Show restaurants'],
                };
            }
            // No pet-friendly options found
            const cityHint = locationInfo ? ` in ${locationInfo.value}` : '';
            const altCities = locationInfo && locationInfo.value.toLowerCase().includes('tiran')
                ? 'Korçë or Vlorë'
                : locationInfo && locationInfo.value.toLowerCase().includes('korc')
                    ? 'Tirana or Vlorë'
                    : 'another city';
            return {
                reply: `I'm sorry — I searched all hotels and guesthouses${cityHint} in our database and couldn't find any with a confirmed "pets allowed" policy right now. 🐾\n\nHere's what you can do:\n• Try asking about **${altCities}** instead\n• Contact a hotel directly via WhatsApp (click on any listing)\n• Check the **Explore** page and filter manually\n\nWould you like me to suggest great hotels${cityHint} without the pet filter?`,
                suggestions: [],
                followUpQuestions: [
                    locationInfo ? `Show all hotels${cityHint}` : 'Show all hotels',
                    `Hotels in ${altCities.split(' or ')[0]}`,
                    'Show guesthouses'
                ],
            };
        }

        if (suggestions.length) {
            return {
                reply: `Here ${suggestions.length === 1 ? 'is a great match' : `are ${suggestions.length} options`} from our database that fit your request${locationLabel}! 🎯`,
                suggestions,
                followUpQuestions: ['One more suggestion', 'Show bars', 'Jobs'],
            };
        }

        // No results for this query/location
        return {
            reply: `Hmm, I couldn't find anything matching your request${locationLabel} right now. 🔍\n\nTry broadening your search — for example, ask for a specific type (hotel, restaurant, bar) or remove the location filter. I search the full website database!`,
            suggestions: [],
            followUpQuestions: ['Show all hotels', 'Restaurants near me', 'Show jobs'],
        };
    }

    if (intentInfo.intents.includes('jobs') && ctx.jobs.length) {
        const list = ctx.jobs.filter((j) => !excludeIds.has(j.id)).slice(0, max);
        return {
            reply: `Here ${list.length === 1 ? 'is a job opening' : `are ${list.length} job openings`} from this website${locationLabel}! 💼`,
            suggestions: list.map((j) => ({ ...j, why: j.companyName || 'Open role' })),
            followUpQuestions: ['Show another job', 'Pet-friendly hotels', 'Most popular places'],
        };
    }

    if (intentInfo.intents.includes('jobs') && !ctx.jobs.length) {
        return {
            reply: `I didn't find any active job listings${locationLabel} in our database right now. New opportunities are posted regularly — check back soon! 💼\n\nMeanwhile, can I help you find hotels, restaurants, or local activities?`,
            suggestions: [],
            followUpQuestions: ['Hotels that allow pets', 'Most visited hotel', 'Show restaurants'],
        };
    }

    return {
        reply: `Hey! 😊 I'm your local guide on TryToFindEverything. Tell me what you're looking for — hotels, restaurants, bars, tours, car rentals, jobs, or travel tips. Try something like:\n\n• "hotels that allow pets in Tirana"\n• "bars with live music"\n• "most visited hotel"\n• "jobs available"`,
        suggestions: [],
        followUpQuestions: ['Hotels that allow pets', 'Most visited hotel', 'Show jobs'],
    };
}

export async function POST(req) {
    try {
        const body = await req.json();
        const message = String(body.message || '').trim();
        const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
        const currentSlug = body.currentSlug ? String(body.currentSlug).trim() : null;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        if (message.length > 2500) {
            return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
        }

        if (!process.env.XAI_API_KEY) {
            return NextResponse.json(
                { error: 'AI is not configured. Add XAI_API_KEY to the environment.' },
                { status: 503 }
            );
        }

        await dbConnect();

        // Load current listing context if user is on a detail page
        let currentListing = null;
        let currentListingReviews = [];
        if (currentSlug) {
            currentListing = await Listing.findOne({
                slug: { $regex: new RegExp(`^${currentSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            }).select(LISTING_SELECT).lean();
            if (!currentListing) {
                // Try finding by ID
                if (currentSlug.match(/^[0-9a-fA-F]{24}$/)) {
                    currentListing = await Listing.findById(currentSlug).select(LISTING_SELECT).lean();
                }
            }
            if (currentListing) {
                currentListing = mapListingFull(currentListing);
                currentListingReviews = await Review.find({ listing: currentListing.id })
                    .select('rating comment')
                    .limit(5)
                    .lean();
            }
        }

        const [dbCities, dbCountries] = await Promise.all([
            Listing.distinct('city'),
            Listing.distinct('country')
        ]);
        const locationInfo = detectLocation(message, dbCities, dbCountries);

        const intentInfo = detectIntents(message, locationInfo);
        const excludeIds = extractPriorSuggestionIds(history);
        const ctx = await loadWebsiteContext(message, intentInfo, excludeIds, locationInfo);

        const maxCards = intentInfo.isChatOnly ? 0 : Math.min(8, Math.max(0, intentInfo.wantedCount ?? 3));

        const system = buildSystemPrompt(maxCards, intentInfo.amenities || [], locationInfo, currentListing);
        const userPayload = buildUserPayload(
            message,
            history,
            ctx,
            { ...intentInfo, wantedCount: maxCards },
            excludeIds,
            currentListing,
            currentListingReviews
        );

        const chatMessages = [
            ...history
                .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
                .slice((intentInfo.isChatOnly && !currentListing) ? -6 : -4)
                .map((m) => ({ role: m.role, content: String(m.content).slice(0, 500) })),
            { role: 'user', content: userPayload },
        ];

        let parsed = null;
        let fallback = false;
        let raw = '';

        try {
            raw = await xaiChat({
                system,
                messages: chatMessages,
                temperature: intentInfo.isChatOnly ? 0.7 : 0.35,
                maxTokens: intentInfo.isChatOnly ? 800 : 2200,
            });
            parsed = safeParseJson(raw);
        } catch (aiErr) {
            console.error('Ask AI xaiChat error:', aiErr.message);
            fallback = true;
        }

        let reply =
            (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) ||
            (raw && !parsed ? raw.replace(/```json[\s\S]*$/i, '').trim().slice(0, 1200) : '');

        let suggestions = intentInfo.isChatOnly ? [] : resolveSuggestions(parsed, ctx, maxCards);

        let followUpQuestions = Array.isArray(parsed?.followUpQuestions)
            ? parsed.followUpQuestions.filter((q) => typeof q === 'string').slice(0, 3)
            : [];

        if (intentInfo.isChatOnly) {
            suggestions = [];
            if (!reply) {
                const fb = fallbackReply(message, intentInfo, ctx, excludeIds, locationInfo);
                reply = fb.reply;
                followUpQuestions = fb.followUpQuestions;
                fallback = true;
            }
        } else if (!reply) {
            const fb = fallbackReply(message, intentInfo, ctx, excludeIds, locationInfo);
            reply = fb.reply;
            if (!suggestions.length) suggestions = (fb.suggestions || []).slice(0, maxCards);
            if (!followUpQuestions.length) followUpQuestions = fb.followUpQuestions;
            fallback = true;
        } else if (!suggestions.length && maxCards > 0) {
            const fb = fallbackReply(message, intentInfo, ctx, excludeIds, locationInfo);
            suggestions = (fb.suggestions || []).slice(0, maxCards);
        }

        // For amenity queries, strictly drop any suggestions that do not have a positive match score
        if ((intentInfo.amenities || []).length && suggestions.length) {
            const byId = new Map(ctx.places.map((p) => [p.id, p]));
            const scored = suggestions.map((s) => {
                const full = byId.get(s.id);
                const matchScore = full
                    ? full.matchScore ?? scoreAmenityMatch(full, intentInfo.amenities)
                    : 0;
                return { s, matchScore };
            });
            suggestions = scored.filter((x) => x.matchScore > 0).map((x) => x.s);

            // If all suggestions were stripped, replace reply with honest no-results message
            if (!suggestions.length && reply) {
                const fb = fallbackReply(message, intentInfo, ctx, excludeIds, locationInfo);
                reply = fb.reply;
                if (fb.followUpQuestions?.length) followUpQuestions = fb.followUpQuestions;
                fallback = true;
            }
        }

        suggestions = suggestions.slice(0, maxCards);

        return NextResponse.json({
            success: true,
            fallback,
            intent: parsed?.intent || intentInfo.intents[0] || 'places',
            reply,
            suggestions,
            followUpQuestions,
            meta: {
                wantedCount: maxCards,
                amenities: intentInfo.amenities || [],
                placesLoaded: ctx.places.length,
                jobsLoaded: ctx.jobs.length,
                blogsLoaded: ctx.blogs.length,
            },
        });
    } catch (error) {
        console.error('Ask AI error:', error);
        return NextResponse.json({ error: 'Ask AI failed. Please try again.' }, { status: 500 });
    }
}
