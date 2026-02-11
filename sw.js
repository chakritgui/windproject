const CACHE_NAME = 'pstg-v2';
self.addEventListener('install', e => {
    self.skipWaiting();
});
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET' || 
        url.pathname === '/' || 
        url.pathname.includes('/admin') ||
        url.pathname.includes('/api/')) {
        return;
    }
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (e.request.url.match(/\.(?:js|css|png|jpg|jpeg|svg|ico)$/)) {
                        cache.put(e.request, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        })
    );
});