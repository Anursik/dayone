/* DAYONE service worker — генерируется scripts/postbuild.mjs при каждой сборке.
 * Цель: после первого открытия приложение работает без интернета.
 * - Страницы: сначала сеть (чтобы приходили обновления), при отсутствии сети — кэш.
 * - /_next/static/*: файлы с хэшем в имени, неизменяемые — сначала кэш.
 * - Скрипт Telegram: сначала сеть, без сети — сохранённая копия.
 * Данные пользователя здесь не участвуют — они в IndexedDB.
 */
const VERSION = "__VERSION__";
const BASE = "__BASE__";
const PRECACHE = __PRECACHE__;
const CACHE = `dayone-${VERSION}`;
const RUNTIME = "dayone-runtime";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("dayone-") && k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function networkFirst(request, { navigation = false, timeout = 5000 } = {}) {
  try {
    const response = await fetchWithTimeout(request, timeout);
    if (response.ok || response.type === "opaque") {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: navigation });
    if (cached) return cached;
    if (navigation) {
      const shell = await caches.match(`${BASE}/`);
      if (shell) return shell;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (!url.pathname.startsWith(`${BASE}/`)) return;
    if (request.mode === "navigate") {
      event.respondWith(networkFirst(request, { navigation: true, timeout: 4000 }));
    } else if (url.pathname.startsWith(`${BASE}/_next/static/`)) {
      event.respondWith(cacheFirst(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (url.hostname === "telegram.org") {
    event.respondWith(networkFirst(request, { timeout: 4000 }));
  }
});
