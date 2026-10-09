const BUILD_ID = "0f686a0af27c";
const CACHE_PREFIX = "piki-customer-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const APP_SHELL = ["/","/riders","/partners","/admin","/manifest.json","/manifest-riders.json","/manifest-partners.json","/manifest-admin.json","/piki-mascot-192.png","/piki-mascot-512.png","/piki-hero.webp"];
const CONTROL_PATHS = new Set(["/sw.js", "/release.json", "/manifest.json", "/manifest-riders.json", "/manifest-partners.json", "/manifest-admin.json", "/piki-mascot-192.png", "/piki-mascot-512.png"]);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset)));
    // Keep a new worker waiting; only the required-update UI sends SKIP_WAITING.
  })());
});

/* PIKI_PWA_MIGRATION_2026_09 */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || CONTROL_PATHS.has(url.pathname) || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || request.headers.has("authorization") || request.headers.get("cache-control") === "no-store") return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          event.waitUntil(cache.put("/", response.clone()));
        }
        return response;
      } catch {
        return (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  })());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || "" }; }
  const title = typeof payload.title === "string" ? payload.title : "PIKI";
  const body = typeof payload.body === "string" ? payload.body : "Tienes una actualización.";
  const path = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/piki-delivery-192.png",
    badge: "/piki-delivery-192.png",
    tag: typeof payload.tag === "string" ? payload.tag : "piki-notification",
    renotify: Boolean(payload.renotify),
    data: { path },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.path || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existing) { await existing.navigate(target).catch(() => undefined); return existing.focus(); }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => clients.forEach((client) => client.postMessage({ type: "PIKI_PUSH_SUBSCRIPTION_CHANGED" }))));
});
