import dbConnect from '@/lib/db';
import Listing from '@/models/Listing';
import Blog from '@/models/Blog';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trytofindeverything.online';

  // Static routes
  const staticRoutes = ['', '/explore', '/blog', '/login', '/register', '/suggestions'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  let dynamicRoutes = [];

  try {
    await dbConnect();
    
    // Fetch all listings
    const listings = await Listing.find({}, 'type slug createdAt').lean();
    const listingRoutes = listings.map(listing => {
      const slugPart = (listing.slug || listing._id.toString()).toLowerCase();
      return {
        url: `${baseUrl}/${listing.type.toLowerCase()}/${slugPart}`,
        lastModified: listing.updatedAt || listing.createdAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    // Fetch all blog posts
    const blogs = await Blog.find({ published: true }, 'slug updatedAt createdAt').lean();
    const blogRoutes = blogs.map(blog => ({
      url: `${baseUrl}/blog/${blog.slug.toLowerCase()}`,
      lastModified: blog.updatedAt || blog.createdAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    dynamicRoutes = [...listingRoutes, ...blogRoutes];
  } catch (e) {
    console.error('Sitemap dynamic generation failed', e);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
