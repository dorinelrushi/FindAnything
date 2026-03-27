export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/register'],
      },
    ],
    sitemap: 'https://trytofindeverything.online/sitemap.xml',
  }
}
