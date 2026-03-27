export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/login', '/register', '/dashboard/', '/profile'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      }
    ],
    sitemap: 'https://trytofindeverything.online/sitemap.xml',
  }
}
