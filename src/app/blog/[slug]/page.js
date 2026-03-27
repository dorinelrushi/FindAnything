import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogActions from './BlogActions';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Allow slugs added after build to render on demand (not 404)
export const dynamicParams = true;
// Revalidate blog pages every hour
export const revalidate = 3600;

// Pre-render published blog pages at build time
export async function generateStaticParams() {
    try {
        await dbConnect();
        const blogs = await Blog.find({ published: true }, 'slug').lean();
        return blogs.map((blog) => ({
            slug: blog.slug,
        }));
    } catch (e) {
        console.error('Failed to generate static params for blog', e);
        return [];
    }
}

async function getBlogData(slug) {
    try {
        await dbConnect();
        const lowerSlug = slug.toLowerCase();
        
        // Safety: Escape any regex special characters in the slug parts
        const escapedParts = slug.split('-').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const permissiveTitleRegex = new RegExp(`^${escapedParts.join('.*')}$`, 'i');
        
        const blog = await Blog.findOne({ 
            $or: [
                { slug: { $regex: new RegExp(`^${lowerSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                { title: { $regex: permissiveTitleRegex } }
            ]
        }).populate('author', 'name');
        return blog;
    } catch (e) {
        console.error('Error fetching blog data', e);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const blog = await getBlogData(slug);

    if (!blog) {
        return {
            title: '404 - Article Not Found',
            description: 'The requested blog article could not be found.'
        };
    }

    const title = blog.seoTitle || blog.title;
    const description = blog.seoDescription || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').substring(0, 160);

    return {
        title: `${title} - KorcaCity Blog`,
        description,
        alternates: {
            canonical: `/blog/${blog.slug}`,
        },
        openGraph: {
            title,
            description,
            url: `/blog/${blog.slug}`,
            images: [
                {
                    url: blog.coverImage || '/og-image.jpg',
                    width: 1200,
                    height: 630,
                    alt: blog.title,
                },
            ],
            type: 'article',
            publishedTime: blog.createdAt,
            modifiedTime: blog.updatedAt,
            authors: [blog.author?.name || 'KorcaCity Team'],
            tags: blog.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [blog.coverImage || '/og-image.jpg'],
        },
    };
}

export default async function BlogDetailPage({ params }) {
    const { slug } = await params;
    const blog = await getBlogData(slug);

    if (!blog) {
        notFound();
    }

    // Check admin status for controls
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let userRole = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userRole = decoded.role;
        } catch (e) {}
    }

    // Structured Data (JSON-LD)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        image: blog.coverImage,
        datePublished: blog.createdAt,
        dateModified: blog.updatedAt,
        author: {
            '@type': 'Person',
            name: blog.author?.name || 'KorcaCity Team',
        },
        description: blog.excerpt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `/blog/${blog.slug}`,
        },
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero */}
            {blog.coverImage && (
                <div className="relative h-[400px] md:h-[550px] w-full mt-4 max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-2xl transition-all hover:scale-[1.01] duration-700">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(blog.tags || []).map(tag => (
                                <span key={tag} className="px-5 py-2 bg-brand text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                            {blog.title}
                        </h1>
                    </div>
                </div>
            )}

            <div className="max-w-[850px] mx-auto px-6 py-12 md:py-20">
                {!blog.coverImage && (
                    <>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(blog.tags || []).map(tag => (
                                <span key={tag} className="px-4 py-1.5 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-wider">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-text-primary leading-tight mb-8">
                            {blog.title}
                        </h1>
                    </>
                )}

                {/* Breadcrumb - Hidden on top hero but show here */}
                <div className="flex items-center gap-2 mb-10 text-sm font-semibold text-text-secondary overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
                    <Link href="/" className="hover:text-brand transition-colors">Home</Link>
                    <span className="opacity-40">/</span>
                    <Link href="/blog" className="hover:text-brand transition-colors">Blog</Link>
                    <span className="opacity-40">/</span>
                    <span className="text-text-primary line-clamp-1">{blog.title}</span>
                </div>

                {/* Meta & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-border-light mb-12">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Published</span>
                            <span className="font-bold text-text-primary">
                                {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        {blog.author?.name && (
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Author</span>
                                <span className="font-bold text-text-primary">✍️ {blog.author.name}</span>
                            </div>
                        )}
                    </div>
                    
                    <BlogActions slug={blog.slug} userRole={userRole} />
                </div>

                {/* Blog Content */}
                <div
                    className="blog-content prose prose-xl max-w-none text-text-primary/90 prose-headings:font-black prose-headings:text-text-primary prose-a:text-brand hover:prose-a:underline prose-img:rounded-3xl prose-img:shadow-2xl prose-blockquote:border-brand prose-blockquote:bg-bg-light/50 prose-blockquote:rounded-r-3xl"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Bottom Back Button */}
                <div className="mt-24 pt-12 border-t border-border-light text-center">
                    <Link 
                        href="/blog" 
                        className="group inline-flex items-center gap-3 px-10 py-5 bg-text-primary hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl hover:-translate-y-1"
                    >
                        <span className="transition-transform group-hover:-translate-x-1">←</span> View All Articles
                    </Link>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .blog-content { 
                    font-size: 1.125rem;
                    line-height: 1.8;
                }
                .blog-content p { margin-bottom: 2em; color: #374151; }
                .blog-content h1 { font-size: 3rem; margin-top: 2em; margin-bottom: 1rem; letter-spacing: -0.02em; }
                .blog-content h2 { font-size: 2.25rem; margin-top: 1.8em; margin-bottom: 1rem; letter-spacing: -0.01em; }
                .blog-content h3 { font-size: 1.5rem; margin-top: 1.5em; margin-bottom: 0.8rem; }
                .blog-content ul, .blog-content ol { margin-left: 1.5em; margin-bottom: 2em; }
                .blog-content li { margin-bottom: 0.8em; }
                .blog-content blockquote {
                    padding: 2rem 2.5rem;
                    font-style: italic;
                    font-size: 1.25rem;
                    margin: 2.5rem 0;
                    color: var(--text-primary);
                }
                .blog-content img {
                    margin: 3rem 0;
                    width: 100%;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
