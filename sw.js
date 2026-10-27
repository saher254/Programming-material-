// sw.js - Service Worker مع إشعارات
const CACHE_NAME = 'bakaloria-v2';
const RUNTIME_CACHE = 'bakaloria-runtime-v2';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/login.html',
    '/manifest.json',
    '/logo.png'
];

// ✅ تثبيت
self.addEventListener('install', (event) => {
    console.log('🔧 SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
            .catch((err) => console.error('❌ Precache failed:', err))
    );
});

// ✅ تفعيل
self.addEventListener('activate', (event) => {
    console.log('✅ SW: Activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ✅ استراتيجية الجلب
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (!request.url.startsWith('http')) return;

    // تجاهل Firebase و Google APIs
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('youtube.com')) {
        return;
    }

    // HTML: Network First
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
        );
        return;
    }

    // ملفات تانية: Cache First
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response));
                    }
                }).catch(() => {});
                return cached;
            }
            return fetch(request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
                }
                return response;
            }).catch(() => new Response('offline', { status: 503 }));
        })
    );
});

// ✅ استقبال رسائل من الصفحة
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    // ✅ إشعار جديد جاي من الصفحة
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: icon || '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'bakaloria-notif',
            requireInteraction: false
        });
    }
});

// ✅ الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/index.html');
            }
        })
    );
});
