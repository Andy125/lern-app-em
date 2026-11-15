// Offline-Speicher: Seite zuerst aus dem Netz (damit Updates sofort ankommen), sonst aus dem Cache.
// Löscht nur eigene alte Caches (englisch-b2-*), nie die der Lernnest-App auf derselben Domain.
const C = "englisch-b2-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("englisch-b2-") && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    if (r.mode === "navigate") {
      e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put("./index.html", cp)); return res; }).catch(() => caches.match("./index.html")));
      return;
    }
    e.respondWith(caches.match(r).then(m => m || fetch(r)));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(C).then(c => c.match(r).then(m => { const f = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => m); return m || f; })));
  }
});
