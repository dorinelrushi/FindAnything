import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';
import Review from '@/models/Review';
import Menu from '@/models/Menu';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ListingClient from '@/app/components/ListingClient';
import MenuPageClient from '@/app/components/MenuPageClient';
import BlogActions from '@/app/components/BlogActions';
import HomePageClient from '@/app/components/HomePageClient';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { cache } from 'react';

// Next.js 15: params must be awaited
export const dynamicParams = true;
export const revalidate = 3600;

// Unified Metadata Generator
export async function generateMetadata({ params }) {
    const { slug } = await params;
    if (!slug || slug.length === 0) return { title: 'Not Found' };

    const first = slug[0].toLowerCase();
    const second = slug[1];

    await dbConnect();

    // Blog Case
    if (first === 'blog') {
        if (!second) {
            return {
                title: 'Blog & Stories - TryToFindEverything',
                description: 'Read our latest blog posts and travel stories.',
            };
        }
        const blog = await getBlogData(second);
        if (!blog) return { title: 'Article Not Found' };
        return {
            title: `${blog.seoTitle || blog.title} - Blog`,
            description: blog.seoDescription || blog.excerpt || blog.title,
            alternates: { canonical: `/blog/${blog.slug}` },
        };
    }

    // Listing Case
    const type = first;
    if (!second) {
        const displayType = type.charAt(0).toUpperCase() + type.slice(1);
        return {
            title: `${displayType}s - TryToFindEverything`,
            description: `Browse all ${displayType}s.`,
            alternates: { canonical: `/${type}` },
        };
    }

    const data = await getListingData(second);
    if (!data || !data.listing) return { title: 'Listing Not Found' };
    
    const { listing } = data;
    return {
        title: `${listing.title} - ${listing.city}`,
        description: listing.description?.substring(0, 160),
        alternates: { canonical: `/${listing.type}/${listing.slug || listing._id}` },
    };
}

// Data Fetchers (with fallback matching)
const getListingData = cache(async (slugStr) => {
    try {
        await dbConnect();
        const lowerSlug = slugStr.toLowerCase();
        const escaped = lowerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedParts = lowerSlug.split('-').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const permissiveRegex = new RegExp(`^${escapedParts.join('.*')}$`, 'i');

        let listing = await Listing.findOne({
            $or: [
                { slug: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { title: { $regex: permissiveRegex } }
            ]
        }).populate('owner', 'name email phoneNumber phonePrefix');
    
        if (!listing && slugStr.match(/^[0-9a-fA-F]{24}$/)) {
            listing = await Listing.findById(slugStr).populate('owner', 'name email phoneNumber phonePrefix');
        }
        if (!listing) return null;

        // Non-blocking view increment
        Listing.findByIdAndUpdate(listing._id, { $inc: { views: 1 } }).catch(() => {});

        const reviews = await Review.find({ listing: listing._id }).populate('user', 'name').sort({ createdAt: -1 });
        const menu = await Menu.findOne({ listing: listing._id });

        return {
            listing: JSON.parse(JSON.stringify(listing)),
            reviews: JSON.parse(JSON.stringify(reviews)),
            menu: JSON.parse(JSON.stringify(menu))
        };
    } catch (e) {
        console.error(e);
        return null;
    }
});

const getBlogData = cache(async (slugStr) => {
    try {
        await dbConnect();
        const lowerSlug = slugStr.toLowerCase();
        const escaped = lowerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedParts = lowerSlug.split('-').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const permissiveRegex = new RegExp(`^${escapedParts.join('.*')}$`, 'i');

        const blog = await Blog.findOne({
            $or: [
                { slug: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { title: { $regex: permissiveRegex } }
            ]
        }).populate('author', 'name');
        return blog ? JSON.parse(JSON.stringify(blog)) : null;
    } catch (e) {
        return null;
    }
});

// Unified Page Component
export default async function CatchAllPage({ params }) {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
        return <HomePageClient />;
    }

    const first = slug[0]?.toLowerCase();
    const second = slug[1];
    const isMenu = slug[slug.length - 1]?.toLowerCase() === 'menu';

    // --- MENU VIEW (Catch /listing-type/slug/menu) ---
    if (isMenu && slug.length >= 2) {
        return <MenuPageClient params={Promise.resolve({ slug: slug })} />;
    }
    if (first === 'blog' && !second) {
        await dbConnect();
        const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 }).select('title slug excerpt coverImage tags createdAt author').lean();
        return <BlogListPage blogs={JSON.parse(JSON.stringify(blogs))} />;
    }

    // --- BLOG DETAIL VIEW ---
    if (first === 'blog' && second) {
        const blog = await getBlogData(second);
        if (!blog) notFound();

        // Get admin status
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

    // --- LISTING LIST VIEW ---
    if (first && !second) {
        await dbConnect();
        const listings = await Listing.find({ type: { $regex: new RegExp(`^${first}$`, 'i') } }).sort({ createdAt: -1 }).lean();
        // Fallback for custom types
        if (listings.length === 0 && !['hotel', 'restaurant', 'bar', 'bujtina', 'rentcar', 'tour', 'city'].includes(first)) {
            notFound();
        }
        return <ListingListPage type={first} listings={JSON.parse(JSON.stringify(listings))} />;
    }

    // --- LISTING DETAIL VIEW ---
    if (first && second) {
        const data = await getListingData(second);
        if (!data) notFound();
        return (
            <ListingClient 
                initialListing={data.listing} 
                initialReviews={data.reviews} 
                initialMenu={data.menu} 
                slug={second} 
            />
        );
    }

    notFound();
}

// Sub-components for better organization
function BlogListPage({ blogs }) {
    return (
        <div className="min-h-screen bg-bg-light/40 py-20 px-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black text-text-primary tracking-tight">Our <span className="text-brand">Stories</span></h1>
                    <p className="text-text-secondary mt-4 max-w-lg mx-auto">Discover guides and travel news from around the world.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <Link key={blog._id} href={`/blog/${blog.slug}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border-light">
                            <div className="aspect-video relative overflow-hidden bg-bg-light">
                                <img src={blog.coverImage || '/placeholder.jpg'} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-bold mb-3 group-hover:text-brand transition-colors line-clamp-2">{blog.title}</h3>
                                <p className="text-text-secondary text-sm line-clamp-3 mb-6 opacity-70 leading-relaxed">{blog.excerpt}</p>
                                <span className="text-brand font-black text-xs uppercase tracking-widest">Read Article →</span>
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
                    {(blog.tags || []).map(tag => (
                        <span key={tag} className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest">#{tag}</span>
                    ))}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-text-primary leading-tight mb-8">{blog.title}</h1>
                <div className="flex items-center justify-between py-6 border-y border-border-light mb-12">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Published</span>
                            <span className="font-bold text-text-primary">{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <BlogActions slug={blog.slug} userRole={userRole} />
                </div>
                <div className="prose prose-xl max-w-none text-text-primary/90 blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.blog-content p { margin-bottom: 2em; line-height: 1.8; } .blog-content h2 { font-size: 2.25rem; font-weight: 900; margin-top: 2em; }` }} />
        </div>
    );
}

function ListingListPage({ type, listings }) {
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
    return (
        <div className="min-h-screen bg-bg-light/30 py-16 px-6">
            <div className="container-wide max-w-[1200px] mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">Explore <span className="text-brand">{displayType}s</span></h1>
                    <p className="text-text-secondary mt-3">Showing {listings.length} results in this category.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {listings.map(listing => (
                        <Link key={listing._id} href={`/${listing.type}/${listing.slug || listing._id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-border-light">
                             <div className="aspect-[4/3] bg-bg-light relative overflow-hidden">
                                <img src={listing.image || '/placeholder.jpg'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                             </div>
                             <div className="p-5">
                                <h3 className="font-bold truncate group-hover:text-brand transition-colors">{listing.title}</h3>
                                <p className="text-sm text-text-secondary mt-1">📍 {listing.city}</p>
                             </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
