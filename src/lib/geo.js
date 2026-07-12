/**
 * Client IP + rough geo from request headers / free lookup.
 * Prefer platform headers (Vercel/Cloudflare), then optional IP API.
 */

export function getClientIp(req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf.trim();
    return '0.0.0.0';
}

export function geoFromHeaders(req) {
    const countryCode =
        req.headers.get('x-vercel-ip-country') ||
        req.headers.get('cf-ipcountry') ||
        req.headers.get('x-country-code') ||
        '';
    const city =
        req.headers.get('x-vercel-ip-city') ||
        req.headers.get('cf-ipcity') ||
        '';
    const region =
        req.headers.get('x-vercel-ip-country-region') ||
        req.headers.get('x-vercel-ip-region') ||
        '';
    const country = countryCode && countryCode !== 'XX' ? countryCode : '';

    return {
        countryCode: country || '',
        country: country || '',
        city: city ? decodeURIComponent(city) : '',
        region: region || '',
    };
}

/**
 * Enrich geo via free ip-api.com (no key). Skip private / local IPs.
 */
export async function lookupGeoByIp(ip) {
    if (!ip || ip === '0.0.0.0' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
        return null;
    }
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,timezone`,
            { signal: controller.signal }
        );
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.status !== 'success') return null;
        return {
            country: data.country || '',
            countryCode: data.countryCode || '',
            region: data.regionName || '',
            city: data.city || '',
            timezone: data.timezone || '',
        };
    } catch {
        return null;
    }
}

export async function resolveScanGeo(req, ip) {
    const fromHeaders = geoFromHeaders(req);
    if (fromHeaders.countryCode || fromHeaders.city) {
        return {
            ...fromHeaders,
            timezone: '',
        };
    }
    const looked = await lookupGeoByIp(ip);
    return looked || { country: '', countryCode: '', region: '', city: '', timezone: '' };
}
