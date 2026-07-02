const CACHE_NAME = "inspecao-postos-v15";
const APP_SHELL = [
  "./",
  "./login.html",
  "./index.html",
  "./scanner.html",
  "./posto.html",
  "./chamado.html",
  "./checklist.html",
  "./historico.html",
  "./senha.html",
  "./configuracoes.html",
  "./css/styles.css",
  "./firebase-config.js",
  "./js/data.js",
  "./js/local-db.js",
  "./js/firebase-service.js",
  "./js/ui.js",
  "./js/login.js",
  "./js/home.js",
  "./js/scanner.js",
  "./js/posto.js",
  "./js/chamado.js",
  "./js/checklist.js",
  "./js/checklist-icons.js",
  "./js/historico.js",
  "./js/senha.js",
  "./js/configuracoes.js",
  "./manifest.webmanifest",
  "./assets/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.hostname.includes("googleapis.com") && !url.hostname.includes("gstatic.com")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match("./login.html"));
      return cached || network;
    })
  );
});
