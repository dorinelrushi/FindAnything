export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trytofindeverything.online').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/blog',
          '/blog/',
          '/hotel',
          '/restaurant',
          '/bar',
          '/bujtina',
          '/rentcar',
          '/tour',
          '/city',
          '/suggestions',
          '/budgets',
          '/sitemap.xml',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/login',
          '/register',
          '/dashboard/',
          '/profile',
          '/favorites',
          '/scan/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/login', '/profile', '/scan/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
