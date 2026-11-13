// Offline-Modus: mit Internet immer die neueste Version laden, ohne Internet aus dem Speicher.
// CACHE muss zur Versionsnummer in version.js passen (tools/test-version.mjs prüft das).
const CACHE = "lernnest-v2";
const FILES = ["./", "index.html", "style.css", "version.js", "logic.js", "inhalte-bio.js", "begleiter.js", "app.js", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // höchstens 4 Sekunden auf das Netz warten, dann den Speicher nehmen
      const langsam = new Promise((_, nein) => setTimeout(() => nein(new Error("langsam")), 4000));
      const r = await Promise.race([fetch(e.request, { cache: "no-cache" }), langsam]);
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
