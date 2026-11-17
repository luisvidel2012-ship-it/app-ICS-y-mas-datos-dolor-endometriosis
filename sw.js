// Red primero: si hay internet se usa siempre la versión más reciente (importante para el consentimiento);
// la copia guardada solo se usa sin conexión.
const C = "csi-v3";
const F = ["./", "index.html", "src/styles.css", "src/config.js", "src/consent.js", "src/csi.js", "src/app.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "icons/logo-kc.png", "icons/hojas.svg", "fonts/dm-serif-display-400.woff2", "fonts/nunito-sans-400.woff2", "fonts/nunito-sans-700.woff2", "fonts/nunito-sans-800.woff2"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(F))); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;   // los envíos a Google pasan directo
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request)));
});
