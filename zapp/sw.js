const CACHE_VERSION = "zapp-store-v81-20260523-gt";
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
  "icons/apps/thisisyz.svg",
  "icons/apps/music-tool.svg",
  "icons/apps/socialpulse.svg",
  "icons/apps/moments-memory.svg",
  "icons/apps/zi-health.svg",
  "icons/apps/ziyin-voiceover.svg",
  "icons/apps/live-call.svg",
  "apps/live-call.html",
  "apps/live-call.css",
  "apps/live-call.js",
  "icons/apps/zi-style-reply.svg",
  "apps/zi-style-reply.html",
  "apps/zi-style-reply.css",
  "apps/zi-style-reply.js",
  "apps/zi-style-reply-memory.json",
  "apps/ziyin-voiceover.html",
  "apps/ziyin-voiceover.css",
  "apps/ziyin-voiceover.js",
  "apps/zi-health.html",
  "apps/moments-memory.html",
  "apps/moments-memory.css",
  "apps/moments-memory.js",
  "apps/moments-memory-data.json",
  "apps/friend-crm.html",
  "apps/friend-crm.css",
  "apps/friend-crm.js",
  "apps/friend-crm-data.enc.json",
  "icons/apps/gt.svg",
  "apps/qhrb-net-worth.html",
  "apps/qhrb-net-worth.css",
  "apps/qhrb-net-worth.js",
  "apps/qhrb-san-ci-can-sai-data.json",
  "apps/gt.html",
  "apps/gt.css",
  "apps/gt.js",
  "apps/gt-data.json",
  "icons/apps/finance.svg",
  "apps/ly-fund.html",
  "apps/ly-fund.css",
  "apps/ly-fund.js",
  "apps/ly-fund-data.enc.json",
  "apps/boa-finance.html",
  "apps/boa-finance.css",
  "apps/boa-finance.js",
  "apps/boa-finance-data.enc.json"
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

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.pathname.endsWith("/apps.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    const fallback = url.pathname.endsWith("/apps/moments-memory.html")
      ? "apps/moments-memory.html"
      : url.pathname.endsWith("/apps/friend-crm.html")
      ? "apps/friend-crm.html"
      : url.pathname.endsWith("/apps/live-call.html")
      ? "apps/live-call.html"
      : url.pathname.endsWith("/apps/zi-style-reply.html")
      ? "apps/zi-style-reply.html"
      : url.pathname.endsWith("/apps/ziyin-voiceover.html")
      ? "apps/ziyin-voiceover.html"
      : url.pathname.endsWith("/apps/zi-health.html")
      ? "apps/zi-health.html"
      : url.pathname.endsWith("/apps/gt.html")
      ? "apps/gt.html"
      : url.pathname.endsWith("/apps/qhrb-net-worth.html")
      ? "apps/qhrb-net-worth.html"
      : url.pathname.endsWith("/apps/ly-fund.html")
      ? "apps/ly-fund.html"
      : url.pathname.endsWith("/apps/boa-finance.html")
        ? "apps/boa-finance.html"
        : "index.html";
    event.respondWith(networkFirst(request, fallback));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallback = null) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
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
