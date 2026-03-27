export default async function sitemap() {
  const baseUrl = 'https://trytofindeverything.online';

  // Static routes
  const routes = ['', '/explore', '/blog', '/login', '/register'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // We could fetch dynamic listing routes here if needed
    // const res = await fetch(`${baseUrl}/api/listings`);
    // const data = await res.json();
    // ... add to routes
  } catch (e) {
    console.error('Sitemap dynamic generation failed', e);
  }

  return routes;
}
