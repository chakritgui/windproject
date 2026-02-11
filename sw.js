const CACHE_NAME = 'app-v2';
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/favicon.ico',
            ]);
        })
    );
    self.skipWaiting(); 
});
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET' || 
        url.pathname.includes('/api/') || 
        url.pathname.includes('/admin') ||
        url.pathname === '/') {
        return;
    }
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        })
    );
});
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
});