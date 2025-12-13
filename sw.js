const CACHE_NAME = 'label-calc-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './icon-192.png',
    './icon-512.png',
    './prices.json',
    './splash-bg.jpg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
