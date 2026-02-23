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
self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body || '',
                icon: '/assets/img/icon-192x192.png',
                badge: '/assets/img/badge-72x72.png',
                vibrate: [100, 50, 100],
                data: {
                    url: data.url || '/'
                }
            };

            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        } catch (e) {
            console.error('Push error:', e);
        }
    }
});
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});