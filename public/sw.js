// ============================================================
// Ganga Dairy Farm — Service Worker
// Strategy: Cache-first for static assets, Network-first for API
// ============================================================

const CACHE_NAME = 'ganga-dairy-v1';
const STATIC_CACHE = 'ganga-static-v1';
const IMAGE_CACHE  = 'ganga-images-v1';

// Core app shell pages and assets to pre-cache
const APP_SHELL = [
  '/',
  '/dashboard/',
  '/milk-entry/',
  '/customers/',
  '/billing/',
  '/payments/',
  '/reports/',
  '/settings/',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: pre-cache app shell ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual adds so one failure doesn't block the rest
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── Supabase API → Network only (never cache auth/data) ────
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) {
    return; // Let browser handle normally
  }

  // ── Next.js internal → Network only ────────────────────────
  if (url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.startsWith('/_next/on-demand-entries')) {
    return;
  }

  // ── Images → Cache-first with fallback ─────────────────────
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // ── Static assets (_next/static) → Cache-first ─────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // ── HTML navigation → Network-first with offline fallback ──
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        })
    );
    return;
  }

  // ── Everything else → Network-first ────────────────────────
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Background Sync: queue failed requests ───────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
