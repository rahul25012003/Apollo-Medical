// Service worker for the IFPC 2026 (apollo-medical) home page. Registered
// with scope "/t/apollo-medical" (see PwaRegister.tsx), so it never
// intercepts requests for any other tenant, the dashboard, or any API route
// outside that path — the browser enforces that scope boundary itself.

// The tenant is served at "/" in production (DEFAULT_TENANT_SLUG) and at
// "/t/apollo-medical" locally, so the shell covers both.
const CACHE_NAME = "ifpc-2026-v4";
const SHELL_URL = self.registration.scope.endsWith("/t/apollo-medical")
  ? "/t/apollo-medical"
  : "/";
const APP_SHELL = [
  SHELL_URL,
  "/manifest-ifpc.json",
  "/manifest-ifpc-root.json",
  "/ifpc/nimhans-logo.png",
  "/ifpc/nimhans-icon-192.png",
  "/ifpc/nimhans-icon-512.png",
  "/ifpc/nimhans-icon-180.png",
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
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ifpc/") || url.pathname.startsWith("/manifest-ifpc")) {
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
  // Only handle navigations inside this worker's own scope; the browser
  // already limits us to it, so this just picks the right offline fallback.
  if (request.mode === "navigate" || url.pathname.startsWith("/t/apollo-medical")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(SHELL_URL)))
    );
  }
});
