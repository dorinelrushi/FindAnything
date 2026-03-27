import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

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
            alternates: {
                canonical: `https://trytofindeverything.online/blog/${blog.slug}`,
            },
            openGraph: {
                title: blog.seoTitle || blog.title,
                description: blog.seoDescription || blog.excerpt || '',
                url: `https://trytofindeverything.online/blog/${blog.slug}`,
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
