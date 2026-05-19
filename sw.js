const CACHE_NAME = 'saz-portal-v3';
const ASSETS_TO_CACHE = [
  '/portal_resultados/',
  '/portal_resultados/index.html',
  '/portal_resultados/manifest.json',
  '/portal_resultados/saz.jpg'
];

// Instalación: cachea los archivos principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: limpia caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: sirve desde cache si está disponible, sino va a la red
self.addEventListener('fetch', event => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return;

  // No cachear requests a Firebase, Drive ni APIs externas
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('drive.google.com') ||
    url.hostname.includes('allorigins.win') ||
    url.hostname.includes('generativelanguage')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cachear recursos válidos nuevos
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Si falla la red y no hay cache, devuelve la página principal
      return caches.match('/portal_resultados/index.html');
    })
  );
});
