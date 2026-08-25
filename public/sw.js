var CACHE_NAME = 'bili-yuqing-v1';
var CACHE_URLS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/install.html',
  '/install.js',
  '/sw.js',
  '/site.webmanifest',
  '/icons/icon16.png',
  '/icons/icon48.png',
  '/icons/icon128.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS.map(function(url) {
        return new Request(url, { cache: 'no-cache' });
      })).catch(function(e) {
        console.warn('Cache addAll failed:', e);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.pathname.indexOf('/src/') === 0 || url.pathname.indexOf('/node_modules/') === 0) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, respClone).catch(function() {});
          });
        }
        return resp;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
