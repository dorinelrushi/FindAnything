'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BlogDetailPage({ params }) {
    const { slug } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetch(`/api/blog/${slug}`)
            .then(r => r.json())
            .then(d => { setBlog(d.blog || null); setLoading(false); })
            .catch(() => setLoading(false));
    }, [slug]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        setDeleting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/blog/${slug}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/blog');
            } else {
                alert('Failed to delete');
                setDeleting(false);
            }
        } catch (err) {
            alert('Error deleting blog');
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-light flex items-center justify-center text-text-secondary font-bold">
            Loading article...
        </div>
    );

    if (!blog) return (
        <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center text-text-primary gap-6">
            <h1 className="text-6xl font-black text-brand">404</h1>
            <p className="text-xl font-medium text-text-secondary">Blog post not found.</p>
            <Link href="/blog" className="btn-primary px-8 py-3">← Back to Blog</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            {blog.coverImage && (
                <div className="relative h-[400px] md:h-[500px] w-full mt-4 max-w-7xl mx-auto rounded-3xl overflow-hidden">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            )}

            <div className="max-w-[800px] mx-auto px-6 py-12 md:py-20">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-8 text-sm font-medium text-text-secondary">
                    <Link href="/" className="hover:text-brand transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/blog" className="hover:text-brand transition-colors">Blog</Link>
                    <span>/</span>
                    <span className="text-text-primary line-clamp-1">{blog.title}</span>
                </div>

                {/* Tags */}
                {(blog.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {blog.tags.map(tag => (
                            <span key={tag} className="px-4 py-1.5 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-wider">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary leading-tight mb-8">
                    {blog.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-border-light mb-10">
                    <div className="flex items-center gap-6">
                        <span className="font-medium text-text-secondary text-sm">
                            📅 {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {blog.author?.name && (
                            <span className="font-bold text-text-primary text-sm">✍️ {blog.author.name}</span>
                        )}
                    </div>
                    {/* Admin Controls */}
                    {user?.role === 'admin' && (
                        <div className="flex gap-3">
                            <Link href={`/admin/blog/edit/${blog.slug}`} className="px-4 py-2 bg-text-primary text-white rounded-xl text-xs font-bold shadow-soft hover:bg-black transition-colors">✏️ Edit</Link>
                            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold shadow-soft hover:bg-red-100 transition-colors">
                                {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Blog Content */}
                <div
                    className="blog-content prose prose-lg max-w-none text-text-primary prose-headings:font-bold prose-headings:text-text-primary prose-a:text-brand hover:prose-a:text-brand-hover prose-img:rounded-3xl prose-img:shadow-soft"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Back */}
                <div className="mt-16 pt-8 border-t border-border-light text-center">
                    <Link href="/blog" className="inline-block px-8 py-4 bg-bg-light hover:bg-border-light text-text-primary font-bold rounded-xl transition-colors shadow-soft">
                        ← All Articles
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                .blog-content p { margin-bottom: 1.5em; line-height: 1.8; color: var(--text-secondary); }
                .blog-content h1 { font-size: 2.5em; margin-bottom: 0.5em; }
                .blog-content h2 { font-size: 2em; margin-top: 1.5em; margin-bottom: 0.5em; }
                .blog-content h3 { font-size: 1.5em; margin-top: 1.5em; margin-bottom: 0.5em; }
                .blog-content ul, .blog-content ol { margin-left: 1.5em; margin-bottom: 1.5em; color: var(--text-secondary); }
                .blog-content li { margin-bottom: 0.5em; }
                .blog-content blockquote {
                    border-left: 4px solid var(--brand);
                    background: var(--bg-light);
                    padding: 1em 1.5em;
                    border-radius: 0 16px 16px 0;
                    font-style: italic;
                    color: var(--text-secondary);
                    margin: 1.5em 0;
                }
                .blog-content img {
                    border-radius: 20px;
                    border: 1px solid var(--border-light);
                    background: var(--bg-light);
                }
            `}</style>
        </div>
    );
}
