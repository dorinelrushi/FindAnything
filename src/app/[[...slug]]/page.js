import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';
import Review from '@/models/Review';
import Menu from '@/models/Menu';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ListingClient from '@/app/components/ListingClient';
import MenuPageClient from '@/app/components/MenuPageClient';
import BlogActions from '@/app/components/BlogActions';
import HomePageClient from '@/app/components/HomePageClient';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { cache } from 'react';
import {
    LISTING_TYPES,
    normalizeSlugPart,
    listingCanonicalPath,
    findListingBySlugParam,
    ensureListingSlug,
} from '@/lib/listingPath';
import slugify from 'slugify';

// Always resolve live data so new listings never stick as cached 404s
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/**
 * Pre-generate directory paths for Google indexing (categories + all listing URLs).
 */
export async function generateStaticParams() {
    try {
        await dbConnect();
        const listings = await Listing.find({}, 'type slug').lean();
        const params = [];

        // Category indexes
        for (const type of LISTING_TYPES) {
            params.push({ slug: [type] });
        }

        // Every listing detail path
        for (const listing of listings) {
            const type = normalizeSlugPart(listing.type || 'hotel');
            const slug = normalizeSlugPart(listing.slug) || String(listing._id);
            if (type && slug) {
                params.push({ slug: [type, slug] });
            }
        }

        // Blog index + posts
        params.push({ slug: ['blog'] });
        const blogs = await Blog.find({ published: true }, 'slug').lean();
        for (const blog of blogs) {
            if (blog.slug) {
                params.push({ slug: ['blog', normalizeSlugPart(blog.slug)] });
            }
        }

        return params;
    } catch (e) {
        console.error('generateStaticParams failed', e);
        return LISTING_TYPES.map((type) => ({ slug: [type] }));
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        return {
            title: 'TryToFindEverything - Discover Hotels, Restaurants & More Worldwide',
            description:
                'Explore the best places, restaurants, and tours around the world. Hotels, Restaurants, Bars, Tours, Car Rentals and more.',
            alternates: { canonical: '/' },
        };
    }

    const first = normalizeSlugPart(slug[0]);
    const second = slug[1] ? normalizeSlugPart(slug[1]) : undefined;

    await dbConnect();

    if (first === 'blog') {
        if (!second) {
            return {
                title: 'Blog & Stories - TryToFindEverything',
                description: 'Read our latest blog posts and travel stories.',
                alternates: { canonical: '/blog' },
            };
        }
        const blog = await getBlogData(second);
        if (!blog) return { title: 'Article Not Found', robots: { index: false } };
        return {
            title: `${blog.seoTitle || blog.title} - Blog`,
            description: blog.seoDescription || blog.excerpt || blog.title,
            alternates: { canonical: `/blog/${blog.slug}` },
        };
    }

    if (!second) {
        const displayType = first.charAt(0).toUpperCase() + first.slice(1);
        return {
            title: `${displayType} - TryToFindEverything`,
            description: `Browse all ${displayType} listings and places.`,
            alternates: { canonical: `/${first}` },
        };
    }

    const data = await getListingData(second);
    if (!data || !data.listing) {
        return { title: 'Listing Not Found', robots: { index: false } };
    }

    const { listing } = data;
    const plainDesc = (listing.description || '')
        .replace(/<[^>]*>/g, '')
        .substring(0, 160);
    return {
        title: `${listing.title}${listing.city ? ` - ${listing.city}` : ''}`,
        description: plainDesc || `Discover ${listing.title} on TryToFindEverything.`,
        alternates: {
            canonical: listingCanonicalPath(listing),
        },
        openGraph: {
            title: listing.title,
            description: plainDesc,
            images: listing.image ? [listing.image] : undefined,
            type: 'website',
        },
    };
}

const getListingData = cache(async (slugStr) => {
    try {
        await dbConnect();
        let listing = await findListingBySlugParam(Listing, slugStr);
        if (!listing) return null;

        listing = await ensureListingSlug(listing, slugify);

        Listing.findByIdAndUpdate(listing._id, { $inc: { views: 1 } }).catch(() => {});

        const reviews = await Review.find({ listing: listing._id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        const menu = await Menu.findOne({ listing: listing._id });

        return {
            listing: JSON.parse(JSON.stringify(listing)),
            reviews: JSON.parse(JSON.stringify(reviews)),
            menu: JSON.parse(JSON.stringify(menu)),
        };
    } catch (e) {
        console.error('Listing Data Fetch Error:', e);
        return null;
    }
});

const getBlogData = cache(async (slugStr) => {
    try {
        await dbConnect();
        const lowerSlug = normalizeSlugPart(slugStr);
        let blog = await Blog.findOne({ slug: lowerSlug }).populate('author', 'name');
        if (!blog) {
            const escaped = lowerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            blog = await Blog.findOne({
                slug: { $regex: new RegExp(`^${escaped}$`, 'i') },
            }).populate('author', 'name');
        }
        return blog ? JSON.parse(JSON.stringify(blog)) : null;
    } catch (e) {
        return null;
    }
});

export default async function CatchAllPage({ params }) {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        return <HomePageClient />;
    }

    // Lowercase + decode enforcement for consistent indexing
    if (slug.some((s) => s !== s.toLowerCase())) {
        const lowerPath = slug
            .map((s) => encodeURIComponent(normalizeSlugPart(s)))
            .join('/');
        redirect(`/${lowerPath}`);
    }

    const first = normalizeSlugPart(slug[0]);
    const second = slug[1] ? normalizeSlugPart(slug[1]) : undefined;
    const isMenu = slug[slug.length - 1]?.toLowerCase() === 'menu';

    // Menu: /type/listing-slug/menu
    if (isMenu && slug.length >= 2) {
        return <MenuPageClient params={Promise.resolve({ slug })} />;
    }

    // Blog list
    if (first === 'blog' && !second) {
        await dbConnect();
        const blogs = await Blog.find({ published: true })
            .sort({ createdAt: -1 })
            .select('title slug excerpt coverImage tags createdAt author')
            .lean();
        return <BlogListPage blogs={JSON.parse(JSON.stringify(blogs))} />;
    }

    // Blog detail
    if (first === 'blog' && second) {
        const blog = await getBlogData(second);
        if (!blog) notFound();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        let userRole = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userRole = decoded.role;
            } catch (e) {}
        }
        return <BlogDetailPage blog={blog} userRole={userRole} />;
    }

    // Category or city directory (/hotel, /korca, …)
    if (first && !second) {
        await dbConnect();
        const listings = await Listing.find({
            $or: [
                { type: { $regex: new RegExp(`^${first}$`, 'i') } },
                { city: { $regex: new RegExp(`^${first}$`, 'i') } },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();

        const isKnownCity =
            listings.length > 0 ||
            (await Listing.exists({ city: { $regex: new RegExp(`^${first}$`, 'i') } }));

        if (!isKnownCity && !LISTING_TYPES.includes(first)) {
            notFound();
        }
        return (
            <ListingListPage
                type={first}
                listings={JSON.parse(JSON.stringify(listings))}
            />
        );
    }

    // Listing detail /type/slug — resilient lookup + canonical redirect
    if (first && second) {
        const data = await getListingData(second);
        if (!data) notFound();

        const actualType = normalizeSlugPart(data.listing.type);
        const actualSlug =
            normalizeSlugPart(data.listing.slug) || String(data.listing._id);

        // Always land on canonical type/slug (fixes wrong type, id vs slug, casing)
        if (first !== actualType || second !== actualSlug) {
            redirect(`/${actualType}/${encodeURIComponent(actualSlug)}`);
        }

        return (
            <ListingClient
                initialListing={data.listing}
                initialReviews={data.reviews}
                initialMenu={data.menu}
                slug={actualSlug}
            />
        );
    }

    notFound();
}

function BlogListPage({ blogs }) {
    return (
        <div className="min-h-screen bg-bg-light/40 py-20 px-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-text-primary tracking-tight">
                        Our <span className="text-brand">Stories</span>
                    </h1>
                    <p className="text-text-secondary mt-4 max-w-lg mx-auto">
                        Discover guides and travel news from around the world.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                        <Link
                            key={blog._id}
                            href={`/blog/${blog.slug}`}
                            className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border-light"
                        >
                            <div className="aspect-video relative overflow-hidden bg-bg-light">
                                <img
                                    src={blog.coverImage || '/placeholder.jpg'}
                                    alt={blog.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-bold mb-3 group-hover:text-brand transition-colors line-clamp-2">
                                    {blog.title}
                                </h3>
                                <p className="text-text-secondary text-sm line-clamp-3 mb-6 opacity-70 leading-relaxed">
                                    {blog.excerpt}
                                </p>
                                <span className="text-brand font-black text-xs uppercase tracking-widest">
                                    Read Article →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BlogDetailPage({ blog, userRole }) {
    return (
        <div className="min-h-screen bg-white pb-20 pt-10 px-6">
            <div className="max-w-[850px] mx-auto">
                <div className="flex flex-wrap gap-2 mb-6">
                    {(blog.tags || []).map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-text-primary leading-tight mb-8">
                    {blog.title}
                </h1>
                <div className="flex items-center justify-between py-6 border-y border-border-light mb-12">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">
                                Published
                            </span>
                            <span className="font-bold text-text-primary">
                                {blog.createdAt
                                    ? new Date(blog.createdAt).toLocaleDateString()
                                    : 'Recent'}
                            </span>
                        </div>
                    </div>
                    <BlogActions slug={blog.slug} userRole={userRole} />
                </div>
                <div
                    className="prose prose-xl max-w-none text-text-primary/90 blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />
            </div>
            <style
                dangerouslySetInnerHTML={{
                    __html: `.blog-content p { margin-bottom: 2em; line-height: 1.8; } .blog-content h2 { font-size: 2.25rem; font-weight: 900; margin-top: 2em; }`,
                }}
            />
        </div>
    );
}

function ListingListPage({ type, listings }) {
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
    return (
        <div className="min-h-screen bg-bg-light/30 py-16 px-6">
            <div className="container-wide max-w-[1200px] mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
                        Explore <span className="text-brand">{displayType}</span>
                    </h1>
                    <p className="text-text-secondary mt-3">
                        Showing {listings.length} results in this category.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {listings.map((listing) => {
                        const href = listingCanonicalPath(listing);
                        return (
                            <Link
                                key={listing._id}
                                href={href}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border-light"
                            >
                                <div className="aspect-[4/3] bg-bg-light relative overflow-hidden">
                                    <img
                                        src={listing.image || '/placeholder.jpg'}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        alt={listing.title || 'Listing'}
                                    />
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold truncate group-hover:text-brand transition-colors">
                                        {listing.title}
                                    </h3>
                                    <p className="text-sm text-text-secondary mt-1">
                                        📍 {listing.city}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
