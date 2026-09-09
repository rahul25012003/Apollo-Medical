// Service worker for the IFPC 2026 (apollo-medical) home page. Registered
// with scope "/t/apollo-medical" (see PwaRegister.tsx), so it never
// intercepts requests for any other tenant, the dashboard, or any API route
// outside that path — the browser enforces that scope boundary itself.

const CACHE_NAME = "ifpc-2026-v2";
const APP_SHELL = [
  "/t/apollo-medical",
  "/manifest-ifpc.json",
  "/ifpc/nimhans-logo.png",
  "/ifpc/ranzcp-logo.png",
  "/ifpc/convention-centre.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ifpc/") || url.pathname === "/manifest-ifpc.json") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      }))
    );
    return;
  }

  // Pages under our scope (the home page itself, and anything nested under
  // it such as the badge print page): network-first, cache fallback offline.
  if (url.pathname === "/t/apollo-medical" || url.pathname.startsWith("/t/apollo-medical/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/t/apollo-medical")))
    );
  }
});
