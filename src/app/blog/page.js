'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogListPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/blog')
            .then(r => r.json())
            .then(d => { setBlogs(d.blogs || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#0b0b0f', color: 'white', padding: '60px 20px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '3px', color: '#a29bfe', fontWeight: '700' }}>Our Journal</span>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', marginTop: '10px', background: 'linear-gradient(135deg, #fff, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Blog & Stories
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: '500px', margin: '15px auto 0' }}>
                        Discover travel tips, local stories, and guides to the best places around the world.
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>Loading articles...</div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>No blog posts yet. Check back soon! ✍️</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '30px' }}>
                        {blogs.map(blog => (
                            <BlogCard key={blog._id} blog={blog} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BlogCard({ blog }) {
    return (
        <Link href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'white' }}>
            <article style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'rgba(162,155,254,0.3)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
                {blog.coverImage && (
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', transition: 'transform 0.8s ease', display: 'block' }} />
                    </div>
                )}
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {(blog.tags || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                            {blog.tags.slice(0, 3).map(tag => (
                                <span key={tag} style={{ fontSize: '0.7rem', background: 'rgba(162,155,254,0.15)', color: '#a29bfe', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px', lineHeight: '1.3' }}>{blog.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
                        {blog.excerpt?.substring(0, 120)}...
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span style={{ color: '#a29bfe', fontSize: '0.9rem', fontWeight: '700' }}>Read more →</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
