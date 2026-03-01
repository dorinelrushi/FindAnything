// Dynamic SEO metadata for blog detail pages
export async function generateMetadata({ params }) {
    const { slug } = await params;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/blog/${slug}`, { cache: 'no-store' });

        if (!res.ok) {
            return { title: 'Blog - TryToFindEverything', description: 'Read our latest blog posts.' };
        }

        const data = await res.json();
        const blog = data.blog;

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
        return { title: 'Blog - TryToFindEverything' };
    }
}

export default function BlogDetailLayout({ children }) {
    return children;
}
