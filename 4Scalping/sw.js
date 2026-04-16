// ============================================
// 4Scalping — Service Worker (PWA Offline)
// ============================================

const CACHE_NAME = '4scalping-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/css/main.css',
    '/src/js/config.js',
    '/src/js/settings.js',
    '/src/js/api.js',
    '/src/js/indicators.js',
    '/src/js/predictor.js',
    '/src/js/ui.js',
    '/src/js/chart.js',
    '/src/js/app.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
];

// Install — cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network first for API, cache first for statics
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Binance API → her zaman network
    if (url.includes('binance.com')) {
        event.respondWith(fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
        return;
    }

    // Statics → cache first
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
