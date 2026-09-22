const CACHE_NAME = "piki-pwa-v1";
const APP_SHELL = ["/", "/manifest.json", "/piki-delivery-192.png", "/piki-delivery-512.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("piki-pwa-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => { if (event.request.method !== "GET") return; event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match("/")))); });
self.addEventListener("push", (event) => { const data = event.data?.json?.() || {}; event.waitUntil(self.registration.showNotification(data.title || "PIKI Delivery", { body: data.body || "Tienes una novedad en tu pedido.", icon: data.icon || "/piki-delivery-192.png", badge: "/piki-delivery-192.png", tag: data.tag || "piki-update" })); });
