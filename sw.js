/* DAYONE service worker — генерируется scripts/postbuild.mjs при каждой сборке.
 * Цель: после первого открытия приложение работает без интернета.
 * - Страницы: сначала сеть (чтобы приходили обновления), при отсутствии сети — кэш.
 * - /_next/static/*: файлы с хэшем в имени, неизменяемые — сначала кэш.
 * - Скрипт Telegram: сначала сеть, без сети — сохранённая копия.
 * Данные пользователя здесь не участвуют — они в IndexedDB.
 */
const VERSION = "669d8720d3c7";
const BASE = "/dayone";
const PRECACHE = ["/dayone/__next.__PAGE__.txt","/dayone/__next._full.txt","/dayone/__next._tree.txt","/dayone/_next/static/chunks/0cz1d0mv5g_q7.js","/dayone/_next/static/chunks/0gpbnc-yqow-7.js","/dayone/_next/static/chunks/0i738iycxdc8w.js","/dayone/_next/static/chunks/0ine1yk0ilqqy.js","/dayone/_next/static/chunks/0jmtcsc_rbspu.js","/dayone/_next/static/chunks/0n2ok4tvpiol2.js","/dayone/_next/static/chunks/0nj6fkkcjkgs8.js","/dayone/_next/static/chunks/0oa7qqtjlvx2g.js","/dayone/_next/static/chunks/0p98uvc44vq8d.js","/dayone/_next/static/chunks/0uk63h0tuavo5.js","/dayone/_next/static/chunks/0vkr2s_ub5a0k.js","/dayone/_next/static/chunks/0w7layauo-xn8.js","/dayone/_next/static/chunks/14q5vz14yolv6.js","/dayone/_next/static/chunks/184uqvnmye_9u.js","/dayone/_next/static/chunks/1f22gya9ptklb.css","/dayone/_next/static/chunks/1t5j-l7te44gp.js","/dayone/_next/static/chunks/1tp67jqkuo6ch.js","/dayone/_next/static/chunks/1ua2kfq9s-me6.js","/dayone/_next/static/chunks/1w3km6xvw1eud.js","/dayone/_next/static/chunks/1wnov70f88xjy.js","/dayone/_next/static/chunks/2r6-e9__swnjc.js","/dayone/_next/static/chunks/2tmc-yn6anut_.js","/dayone/_next/static/chunks/2tmk6av89-e88.js","/dayone/_next/static/chunks/2u2-s5n7hxwr_.js","/dayone/_next/static/chunks/3-rpbka_o6oyd.js","/dayone/_next/static/chunks/334un-cxog9ei.js","/dayone/_next/static/chunks/37o-o5gomp_bc.js","/dayone/_next/static/chunks/3aa9kfsugbjrt.js","/dayone/_next/static/chunks/3bhyw5gaxh90r.js","/dayone/_next/static/chunks/3f7ipj59stclq.js","/dayone/_next/static/chunks/3h9vk9pmi-vcr.js","/dayone/_next/static/chunks/3j4bfjkpwt-9n.js","/dayone/_next/static/chunks/3lbm-r_1xmrrq.js","/dayone/_next/static/chunks/3tni5o2h732w7.js","/dayone/_next/static/chunks/4101s0w05kawx.js","/dayone/_next/static/chunks/turbopack-0o078yl88--q6.js","/dayone/_next/static/e51N0PwmwQ7EiQXVJHZ_g/_buildManifest.js","/dayone/_next/static/e51N0PwmwQ7EiQXVJHZ_g/_clientMiddlewareManifest.js","/dayone/_next/static/e51N0PwmwQ7EiQXVJHZ_g/_ssgManifest.js","/dayone/_next/static/media/276a8f4fe816cb6b-s.p.2v2sz4qlut9s1.woff2","/dayone/_next/static/media/33ee198db9637ef4-s.23qr8woi9ij9e.woff2","/dayone/_next/static/media/82450a180bcad83c-s.p.0p-wng2nn8o-p.woff2","/dayone/_next/static/media/82b67ad56d243b47-s.09bkcrcuv-0po.woff2","/dayone/_next/static/media/fbb7028efdf70529-s.1_0gbi-gsbqmd.woff2","/dayone/_next/static/media/ffc7b595a48b6846-s.3q9gh2jvntrwt.woff2","/dayone/_next/static/media/icon.40mwui6hl3ako.svg","/dayone/habits/__next._full.txt","/dayone/habits/__next._tree.txt","/dayone/habits/__next.habits/__PAGE__.txt","/dayone/habits/archive/__next._full.txt","/dayone/habits/archive/__next._tree.txt","/dayone/habits/archive/__next.habits/archive/__PAGE__.txt","/dayone/habits/archive/","/dayone/habits/archive/index.txt","/dayone/habits/","/dayone/habits/index.txt","/dayone/habits/view/__next._full.txt","/dayone/habits/view/__next._tree.txt","/dayone/habits/view/__next.habits/view/__PAGE__.txt","/dayone/habits/view/","/dayone/habits/view/index.txt","/dayone/icon.svg","/dayone/","/dayone/index.txt","/dayone/nutrition/__next._full.txt","/dayone/nutrition/__next._tree.txt","/dayone/nutrition/__next.nutrition/__PAGE__.txt","/dayone/nutrition/foods/__next._full.txt","/dayone/nutrition/foods/__next._tree.txt","/dayone/nutrition/foods/__next.nutrition/foods/__PAGE__.txt","/dayone/nutrition/foods/","/dayone/nutrition/foods/index.txt","/dayone/nutrition/","/dayone/nutrition/index.txt","/dayone/nutrition/recipes/__next._full.txt","/dayone/nutrition/recipes/__next._tree.txt","/dayone/nutrition/recipes/__next.nutrition/recipes/__PAGE__.txt","/dayone/nutrition/recipes/","/dayone/nutrition/recipes/index.txt","/dayone/profile/__next._full.txt","/dayone/profile/__next._tree.txt","/dayone/profile/__next.profile/__PAGE__.txt","/dayone/profile/analytics/__next._full.txt","/dayone/profile/analytics/__next._tree.txt","/dayone/profile/analytics/__next.profile/analytics/__PAGE__.txt","/dayone/profile/analytics/","/dayone/profile/analytics/index.txt","/dayone/profile/edit/__next._full.txt","/dayone/profile/edit/__next._tree.txt","/dayone/profile/edit/__next.profile/edit/__PAGE__.txt","/dayone/profile/edit/","/dayone/profile/edit/index.txt","/dayone/profile/health/__next._full.txt","/dayone/profile/health/__next._tree.txt","/dayone/profile/health/__next.profile/health/__PAGE__.txt","/dayone/profile/health/","/dayone/profile/health/index.txt","/dayone/profile/health/metric/__next._full.txt","/dayone/profile/health/metric/__next._tree.txt","/dayone/profile/health/metric/__next.profile/health/metric/__PAGE__.txt","/dayone/profile/health/metric/","/dayone/profile/health/metric/index.txt","/dayone/profile/","/dayone/profile/index.txt","/dayone/profile/journal/__next._full.txt","/dayone/profile/journal/__next._tree.txt","/dayone/profile/journal/__next.profile/journal/__PAGE__.txt","/dayone/profile/journal/","/dayone/profile/journal/index.txt","/dayone/profile/settings/__next._full.txt","/dayone/profile/settings/__next._tree.txt","/dayone/profile/settings/__next.profile/settings/__PAGE__.txt","/dayone/profile/settings/","/dayone/profile/settings/index.txt","/dayone/workouts/__next._full.txt","/dayone/workouts/__next._tree.txt","/dayone/workouts/__next.workouts/__PAGE__.txt","/dayone/workouts/active/__next._full.txt","/dayone/workouts/active/__next._tree.txt","/dayone/workouts/active/__next.workouts/active/__PAGE__.txt","/dayone/workouts/active/","/dayone/workouts/active/index.txt","/dayone/workouts/exercise/__next._full.txt","/dayone/workouts/exercise/__next._tree.txt","/dayone/workouts/exercise/__next.workouts/exercise/__PAGE__.txt","/dayone/workouts/exercise/","/dayone/workouts/exercise/index.txt","/dayone/workouts/exercises/__next._full.txt","/dayone/workouts/exercises/__next._tree.txt","/dayone/workouts/exercises/__next.workouts/exercises/__PAGE__.txt","/dayone/workouts/exercises/","/dayone/workouts/exercises/index.txt","/dayone/workouts/","/dayone/workouts/index.txt","/dayone/workouts/program/__next._full.txt","/dayone/workouts/program/__next._tree.txt","/dayone/workouts/program/__next.workouts/program/__PAGE__.txt","/dayone/workouts/program/","/dayone/workouts/program/index.txt","/dayone/workouts/session/__next._full.txt","/dayone/workouts/session/__next._tree.txt","/dayone/workouts/session/__next.workouts/session/__PAGE__.txt","/dayone/workouts/session/","/dayone/workouts/session/index.txt"];
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
