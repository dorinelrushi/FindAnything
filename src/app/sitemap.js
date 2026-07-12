import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';
import { LISTING_TYPES, normalizeSlugPart } from '@/lib/listingPath';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trytofindeverything.online').replace(/\/$/, '');

  // Core public pages for Google Search Console
  const staticRoutes = [
    { path: '', priority: 1, changeFrequency: 'daily' },
    { path: '/explore', priority: 0.9, changeFrequency: 'daily' },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/suggestions', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/budgets', priority: 0.6, changeFrequency: 'weekly' },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Category directory pages (always indexable)
  const categoryRoutes = LISTING_TYPES.map((type) => ({
    url: `${baseUrl}/${type}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  let dynamicRoutes = [];

  try {
    await dbConnect();

    const listings = await Listing.find({}, 'type slug city createdAt updatedAt').lean();

    const listingRoutes = listings
      .filter((listing) => listing.type)
      .map((listing) => {
        const type = normalizeSlugPart(listing.type);
        const slugPart = normalizeSlugPart(listing.slug) || String(listing._id);
        return {
          url: `${baseUrl}/${type}/${encodeURIComponent(slugPart)}`,
          lastModified: listing.updatedAt || listing.createdAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.75,
        };
      });

    // City landing pages from listing.city (slug-safe)
    const cities = [
      ...new Set(
        listings
          .map((l) => (l.city || '').trim())
          .filter(Boolean)
          .map((c) => normalizeSlugPart(c).replace(/\s+/g, '-'))
      ),
    ];
    const cityRoutes = cities.map((city) => ({
      url: `${baseUrl}/${encodeURIComponent(city)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    const blogs = await Blog.find({ published: true }, 'slug updatedAt createdAt').lean();
    const blogRoutes = blogs
      .filter((b) => b.slug)
      .map((blog) => ({
        url: `${baseUrl}/blog/${encodeURIComponent(normalizeSlugPart(blog.slug))}`,
        lastModified: blog.updatedAt || blog.createdAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.65,
      }));

    dynamicRoutes = [...listingRoutes, ...cityRoutes, ...blogRoutes];
  } catch (e) {
    console.error('Sitemap dynamic generation failed', e);
  }

  // Deduplicate by URL
  const seen = new Set();
  const all = [...staticRoutes, ...categoryRoutes, ...dynamicRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });

  return all;
}
