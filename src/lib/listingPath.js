/**
 * Canonical public paths and resilient listing lookup helpers.
 * Used for SEO redirects, sitemaps, and fixing intermittent 404s.
 */

export const LISTING_TYPES = ['hotel', 'restaurant', 'bar', 'bujtina', 'rentcar', 'tour', 'city'];

export function normalizeSlugPart(value) {
    if (value == null) return '';
    try {
        return decodeURIComponent(String(value)).toLowerCase().trim();
    } catch {
        return String(value).toLowerCase().trim();
    }
}

export function listingCanonicalPath(listing) {
    if (!listing) return '/';
    const type = normalizeSlugPart(listing.type || 'hotel');
    const slug = normalizeSlugPart(listing.slug) || String(listing._id);
    // Encode only when needed (spaces / unicode); keep clean ASCII slugs readable for SEO
    const safeSlug = /[^a-z0-9\-_]/.test(slug) ? encodeURIComponent(slug) : slug;
    return `/${type}/${safeSlug}`;
}

/**
 * Find a listing by URL slug segment (slug string or Mongo ObjectId).
 * Tries exact slug, case-insensitive slug, ObjectId, then loose title match.
 */
export async function findListingBySlugParam(Listing, slugParam) {
    if (!slugParam) return null;

    const raw = String(slugParam).trim();
    const lower = normalizeSlugPart(raw);

    // 1) Exact lowercase slug
    let listing = await Listing.findOne({ slug: lower }).populate(
        'owner',
        'name email phoneNumber phonePrefix'
    );

    // 2) Case-insensitive exact slug
    if (!listing) {
        const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        listing = await Listing.findOne({
            slug: { $regex: new RegExp(`^${escaped}$`, 'i') },
        }).populate('owner', 'name email phoneNumber phonePrefix');
    }

    // 3) Mongo ObjectId
    if (!listing && /^[0-9a-fA-F]{24}$/.test(raw)) {
        listing = await Listing.findById(raw).populate(
            'owner',
            'name email phoneNumber phonePrefix'
        );
    }

    // 4) Loose title match from hyphenated slug (last resort)
    if (!listing && lower.includes('-')) {
        const parts = lower
            .split('-')
            .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .filter(Boolean);
        if (parts.length > 0) {
            const permissiveRegex = new RegExp(`^${parts.join('.*')}$`, 'i');
            listing = await Listing.findOne({
                title: { $regex: permissiveRegex },
            }).populate('owner', 'name email phoneNumber phonePrefix');
        }
    }

    // 5) If still missing, try raw slug as stored (legacy non-lowercase)
    if (!listing && raw !== lower) {
        listing = await Listing.findOne({ slug: raw }).populate(
            'owner',
            'name email phoneNumber phonePrefix'
        );
    }

    return listing;
}

/**
 * Ensure listing has a valid public slug (auto-heal empty/undefined).
 */
export async function ensureListingSlug(listing, slugifyFn) {
    if (!listing) return listing;
    if (listing.slug && listing.slug !== 'undefined' && listing.slug !== 'null') {
        return listing;
    }
    if (!slugifyFn || !listing.title) {
        listing.slug = String(listing._id);
        try {
            await listing.save();
        } catch (_) {}
        return listing;
    }
    let base = slugifyFn(listing.title, { lower: true, strict: true }) || String(listing._id);
    let slug = base;
    let n = 1;
    const Listing = listing.constructor;
    while (await Listing.findOne({ slug, _id: { $ne: listing._id } })) {
        slug = `${base}-${n++}`;
    }
    listing.slug = slug;
    try {
        await listing.save();
    } catch (_) {}
    return listing;
}
