/* =============================================================================
   SOKO FLOW SERVICE WORKER ENGINE (VERSION 4.0.0)
   Handles PWA caching, Leaflet Map assets, and API network fallback
   ============================================================================= */

const CACHE_NAME = 'sokoflow-v4.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/auth.html',
  '/dashboard.html',
  '/store.html',
  '/datastore.html',
  '/preorder.html',
  '/orders.html',
  '/imports.html',
  '/admin.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install Event - Pre-caching static assets & Leaflet map SDK
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v4.0.0] Pre-caching Soko Flow App Shell & Map SDK...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Purge Legacy Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW v4.0.0] Flushing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First for API, Stale-While-Revalidate for App Shell
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {});
        return cachedResponse || fetchPromise;
      })
    );
  }
});