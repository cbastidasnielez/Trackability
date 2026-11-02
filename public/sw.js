/* Mariapnel 🐧 como app: un service worker prudente.
   Siempre pide primero la versión nueva a internet (así los cambios se ven
   en cuanto se publican) y solo si no hay conexión, o tarda demasiado,
   sirve la última copia guardada. No toca /api, ni otros dominios
   (Supabase, YouTube…), ni audio o vídeo. */
var CACHE = 'mariapnel-v1';
var BASICO = ['/', '/entrenar', '/recetas', '/manifest.json',
              '/apple-touch-icon.png', '/icon-192.png', '/mariapnel.jpeg'];
var ESPERA_PAGINA = 4000;   // en el gimnasio con poca cobertura: a los 4 s, la copia

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(BASICO.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function guardar(req, res) {
  if (res && res.ok && res.type === 'basic') {
    var copia = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copia); });
  }
  return res;
}

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/api/') === 0) return;
  if (req.headers.has('range') || req.destination === 'audio' || req.destination === 'video') return;

  if (req.mode === 'navigate') {
    // las páginas: internet primero, con un límite de espera
    ev.respondWith(new Promise(function (resolver) {
      var hecho = false;
      function copia() {
        return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('/'); });
      }
      var t = setTimeout(function () {
        copia().then(function (r) { if (r && !hecho) { hecho = true; resolver(r); } });
      }, ESPERA_PAGINA);
      fetch(req).then(function (res) {
        guardar(req, res);
        if (!hecho) { hecho = true; clearTimeout(t); resolver(res); }
      }).catch(function () {
        clearTimeout(t);
        copia().then(function (r) {
          if (!hecho) { hecho = true; resolver(r || Response.error()); }
        });
      });
    }));
    return;
  }

  // el resto (scripts, imágenes, fotos): internet primero; sin conexión, la copia
  ev.respondWith(fetch(req).then(function (res) { return guardar(req, res); })
    .catch(function () { return caches.match(req); }));
});
