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
        <div style={{ minHeight: '100vh', background: '#0b0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            Loading article...
        </div>
    );

    if (!blog) return (
        <div style={{ minHeight: '100vh', background: '#0b0b0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '20px' }}>
            <h1 style={{ fontSize: '3rem' }}>404</h1>
            <p>Blog post not found.</p>
            <Link href="/blog" className="btn">← Back to Blog</Link>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0b0b0f', color: 'white' }}>
            {/* Hero */}
            {blog.coverImage && (
                <div style={{ position: 'relative', height: 'clamp(280px, 50vw, 500px)', overflow: 'hidden' }}>
                    <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0b0b0f 0%, transparent 50%)' }} />
                </div>
            )}

            <div style={{ maxWidth: '780px', margin: '0 auto', padding: '50px 20px 100px' }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                    <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</Link>
                    <span>/</span>
                    <Link href="/blog" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Blog</Link>
                    <span>/</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{blog.title}</span>
                </div>

                {/* Tags */}
                {(blog.tags || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                        {blog.tags.map(tag => (
                            <span key={tag} style={{ fontSize: '0.75rem', background: 'rgba(162,155,254,0.15)', color: '#a29bfe', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '900', lineHeight: '1.15', marginBottom: '20px', background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {blog.title}
                </h1>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '15px 0', marginBottom: '40px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                        📅 {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    {blog.author?.name && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>✍️ {blog.author.name}</span>
                    )}
                    {/* Admin Controls */}
                    {user?.role === 'admin' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            <Link href={`/admin/blog/edit/${blog.slug}`} className="btn" style={{ background: '#74b9ff', textDecoration: 'none', padding: '6px 14px', fontSize: '0.85rem' }}>✏️ Edit</Link>
                            <button onClick={handleDelete} disabled={deleting} className="btn" style={{ background: '#ff7675', padding: '6px 14px', fontSize: '0.85rem' }}>
                                {deleting ? '⏳' : '🗑️ Delete'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Blog Content */}
                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Back */}
                <div style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '30px' }}>
                    <Link href="/blog" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textDecoration: 'none' }}>← All Articles</Link>
                </div>
            </div>

            <style jsx global>{`
                .blog-content { font-size: 1.1rem; line-height: 1.9; color: rgba(255,255,255,0.85); }
                .blog-content h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 900; margin: 40px 0 15px; color: white; }
                .blog-content h2 { font-size: clamp(1.3rem, 3vw, 1.9rem); font-weight: 800; margin: 35px 0 12px; color: #a29bfe; }
                .blog-content h3 { font-size: clamp(1.1rem, 2.5vw, 1.5rem); font-weight: 700; margin: 25px 0 10px; color: #fd79a8; }
                .blog-content p { margin: 0 0 20px; }
                .blog-content ul, .blog-content ol { padding-left: 28px; margin: 15px 0 25px; }
                .blog-content li { margin-bottom: 10px; }
                .blog-content blockquote { border-left: 4px solid #a29bfe; padding: 15px 25px; margin: 25px 0; background: rgba(162,155,254,0.07); border-radius: 0 12px 12px 0; font-style: italic; color: rgba(255,255,255,0.7); font-size: 1.15rem; }
                .blog-content img { max-width: 100%; border-radius: 16px; margin: 20px 0; box-shadow: 0 10px 40px rgba(0,0,0,0.5); display: block; }
                .blog-content figure { margin: 25px 0; text-align: center; }
                .blog-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 35px 0; }
                .blog-content a { color: #a29bfe; text-decoration: underline; }
                .blog-content strong { color: white; }
                @media (max-width: 640px) {
                    .blog-content { font-size: 1rem; }
                    .blog-content blockquote { padding: 12px 16px; }
                }
            `}</style>
        </div>
    );
}
