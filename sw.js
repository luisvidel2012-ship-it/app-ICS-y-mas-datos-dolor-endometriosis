const C="csi-v1",F=["./","index.html","src/styles.css","src/csi.js","src/app.js","manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
