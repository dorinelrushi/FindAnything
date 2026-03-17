export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/register'],
      },
    ],
    sitemap: 'https://korcacity.com/sitemap.xml', // Update to actual domain if known
  }
}
