// Couture AI Atelier - Service Worker Powered by Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (self.workbox) {
  // Use debug logs only in non-production
  self.workbox.setConfig({ debug: false });

  // 1. Precache Core Shell Fallback assets if any (or skip for runtime-driven approach)
  self.workbox.core.skipWaiting();
  self.workbox.core.clientsClaim();

  // 2. Cache HTML/Document navigation with a NetworkFirst strategy (ensures fresh load but falls back to cache offline)
  self.workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new self.workbox.strategies.NetworkFirst({
      cacheName: 'atelier-pages',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 3 * 24 * 60 * 60, // 3 Days
        }),
      ],
    })
  );

  // 3. Cache static assets (CSS, JS, manifest, fonts) using Stale-While-Revalidate
  self.workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'manifest' ||
      request.destination === 'font',
    new self.workbox.strategies.StaleWhileRevalidate({
      cacheName: 'atelier-assets',
    })
  );

  // 4. Cache Google Web Fonts
  self.workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new self.workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
    })
  );

  // 5. Cache UI images and vector elements using Cache-First strategy
  self.workbox.routing.registerRoute(
    ({ request, url }) => 
      request.destination === 'image' && 
      !url.pathname.includes('/api/'), // Avoid caching dynamically generated API images here
    new self.workbox.strategies.CacheFirst({
      cacheName: 'atelier-images',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

} else {
  console.warn('Workbox failed to initialize inside the Couture AI Service Worker context.');
}
