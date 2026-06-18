const CACHE_NAME = 'printbazaar-android-v1';
const DATA_CACHE_NAME = 'printbazaar-data-v1';
const IMAGE_CACHE_NAME = 'printbazaar-images-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  const url = new URL(e.request.url);

  // Strategy for API requests (Catalog data)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(e.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(e.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(e.request);
          });
      })
    );
    return;
  }

  // Strategy for Product Images
  if (e.request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
    e.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((response) => {
          if (response) {
            // Fetch updated image in background
            fetch(e.request)
              .then((networkResponse) => {
                if (networkResponse.status === 200) {
                  cache.put(e.request, networkResponse.clone());
                }
              })
              .catch(() => {});
            return response;
          }
          return fetch(e.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(e.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Return a fallback image if necessary, but we can just resolve to error
              return new Response(null, { status: 404 });
            });
        });
      })
    );
    return;
  }

  // Strategy for other assets (App shell)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached plus fetch freshly in background to update
          fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(e.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Return index.html as offline fallback for SPA routing
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});

// Service Worker Notification System listener
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = e.data.payload;
    e.waitUntil(
      self.registration.showNotification(title, {
        icon: '/manifest.json', // fallback or placeholder
        badge: '/manifest.json',
        ...options
      })
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
