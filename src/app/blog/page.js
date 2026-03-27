import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import Link from 'next/link';

export const metadata = {
    title: 'Blog & Stories - KorcaCity',
    description: 'Discover travel tips, local stories, and guides to the best places in Korce and around. Real stories by locals.',
    openGraph: {
        title: 'Blog & Stories - KorcaCity',
        description: 'Discover travel tips, local stories, and guides to the best places in Korce and around.',
        url: 'https://trytofindeverything.online/blog',
        type: 'website',
    },
};

export default async function BlogListPage() {
    let blogs = [];
    try {
        await dbConnect();
        blogs = await Blog.find({ published: true })
            .sort({ createdAt: -1 })
            .select('title slug excerpt coverImage tags createdAt')
            .lean();
    } catch (e) {
        console.error('Error fetching blogs on server', e);
    }

    return (
        <div className="min-h-screen bg-bg-light/40 py-20 px-6">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-20">
                    <span className="inline-block px-4 py-1.5 bg-brand/10 text-brand text-[10px] uppercase tracking-[0.2em] font-black rounded-full mb-6">
                        The KorcaCity Journal
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tight mb-8">
                        Our <span className="text-brand">Stories</span>
                    </h1>
                    <p className="text-text-secondary text-xl max-w-[600px] mx-auto leading-relaxed">
                        Discover hidden gems, local traditions, and the best experiences Korçe has to offer through our curated stories.
                    </p>
                </div>

                {blogs.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] shadow-soft border border-border-light">
                        <div className="text-6xl mb-6">✍️</div>
                        <h3 className="text-2xl font-bold text-text-primary mb-2">No Stories Yet</h3>
                        <p className="text-text-secondary">We are currently writing amazing content. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {blogs.map(blog => (
                            <BlogCard key={blog._id.toString()} blog={blog} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BlogCard({ blog }) {
    return (
        <Link href={`/blog/${blog.slug}`} className="group block">
            <article className="bg-white rounded-[2.5rem] overflow-hidden transition-all duration-500 h-full flex flex-col hover:-translate-y-3 hover:shadow-2xl border border-transparent hover:border-brand/10">
                <div className="relative h-[250px] overflow-hidden">
                    {blog.coverImage ? (
                        <img 
                            src={blog.coverImage} 
                            alt={blog.title} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                    ) : (
                        <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand/20 text-6xl">✏️</div>
                    )}
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                        {(blog.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} className="bg-white/90 backdrop-blur-md text-text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-[11px] font-black text-brand uppercase tracking-widest mb-4">
                        <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand/30" />
                        <span>By KorcaCity</span>
                    </div>
                    
                    <h2 className="text-2xl font-black mb-4 leading-tight text-text-primary group-hover:text-brand transition-colors duration-300">
                        {blog.title}
                    </h2>
                    
                    <p className="text-text-secondary text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                        {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : '')}
                    </p>
                    
                    <div className="flex items-center gap-2 text-text-primary font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all duration-300">
                        Read Full Story 
                        <span className="text-lg leading-none">→</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
