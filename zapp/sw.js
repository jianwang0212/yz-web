const CACHE_VERSION = "zapp-store-v5-20260509";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const STATIC_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "apps.json",
  "manifest.webmanifest",
  "icons/store.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apps/calculator.svg",
  "icons/apps/calculator-192.png",
  "icons/apps/calculator-512.png",
  "icons/apps/thisisyz.svg",
  "icons/apps/music-tool.svg",
  "icons/apps/socialpulse.svg",
  "icons/apps/airchat.svg",
  "icons/apps/workout.svg",
  "icons/apps/medical.svg",
  "icons/apps/food.svg",
  "icons/apps/homeschool.svg",
  "apps/workbench.html",
  "apps/workbench.css",
  "apps/workbench.js",
  "apps/calculator.html",
  "apps/calculator.css",
  "apps/calculator.js",
  "apps/calculator.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.endsWith("/apps.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    const fallback = url.pathname.endsWith("/apps/calculator.html")
      ? "apps/calculator.html"
      : url.pathname.endsWith("/apps/workbench.html")
        ? "apps/workbench.html"
        : "index.html";
    event.respondWith(networkFirst(request, fallback));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallback = null) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request, { ignoreSearch: true })) || (fallback && cache.match(fallback)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}
