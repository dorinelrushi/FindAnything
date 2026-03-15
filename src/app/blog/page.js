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
        <div className="min-h-screen bg-white text-text-primary py-16 px-6">
            <div className="max-w-[1100px] mx-auto">
                <div className="text-center mb-16">
                    <span className="text-xs uppercase tracking-widest text-brand font-bold">Our Journal</span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mt-3 text-text-primary">
                        Blog & Stories
                    </h1>
                    <p className="text-text-secondary text-lg max-w-[500px] mx-auto mt-4">
                        Discover travel tips, local stories, and guides to the best places around the world.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-text-secondary">Loading articles...</div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 text-text-secondary">No blog posts yet. Check back soon! ✍️</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <Link href={`/blog/${blog.slug}`} className="group no-underline outline-none">
            <article className="bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col hover:-translate-y-2 hover:shadow-airbnb hover:border-brand/30">
                {blog.coverImage && (
                    <div className="h-[200px] overflow-hidden">
                        <img 
                            src={blog.coverImage} 
                            alt={blog.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                    </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                    {(blog.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {blog.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[11px] bg-brand/10 text-brand px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <h2 className="text-xl font-bold mb-3 leading-tight text-text-primary group-hover:text-brand transition-colors">
                        {blog.title}
                    </h2>
                    <p className="text-text-secondary text-sm leading-relaxed mb-5 flex-1 line-clamp-3">
                        {blog.excerpt?.substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center border-t border-border-light pt-4 mt-auto">
                        <span className="text-xs text-text-secondary font-medium">
                            {new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="text-brand text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read more <span aria-hidden="true">&rarr;</span>
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
