// Dynamic SEO metadata for blog detail pages
// Uses direct DB query instead of HTTP self-fetch so it works in production
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export async function generateMetadata({ params }) {
    const { slug } = await params;

    try {
        await dbConnect();
        const blog = await Blog.findOne({ slug, published: true }).lean();

        if (!blog) {
            return { title: 'Blog Post Not Found - TryToFindEverything' };
        }

        return {
            title: blog.seoTitle || `${blog.title} | TryToFindEverything`,
            description: blog.seoDescription || blog.excerpt || '',
            keywords: (blog.tags || []).join(', '),
            openGraph: {
                title: blog.seoTitle || blog.title,
                description: blog.seoDescription || blog.excerpt || '',
                images: blog.coverImage ? [{ url: blog.coverImage }] : [],
                type: 'article',
            },
        };
    } catch {
        return { title: 'Blog - TryToFindEverything', description: 'Read our latest blog posts.' };
    }
}

export default function BlogDetailLayout({ children }) {
    return children;
}
