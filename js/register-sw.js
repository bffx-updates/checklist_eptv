const VERSION_KEY = "inspecao.appVersion";
const VERSION_URL = "./app-version.json";
const CHECK_INTERVAL_MS = 2 * 60 * 1000;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("./service-worker.js").catch(() => null);
    registration?.update?.().catch(() => {});
    await checkForAppUpdate();
    window.setInterval(checkForAppUpdate, CHECK_INTERVAL_MS);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForAppUpdate();
  });

  window.addEventListener("focus", checkForAppUpdate);
}

async function checkForAppUpdate() {
  try {
    const version = await fetchCurrentVersion();
    if (!version) return;

    const currentVersion = localStorage.getItem(VERSION_KEY);
    if (!currentVersion) {
      localStorage.setItem(VERSION_KEY, version);
      return;
    }

    if (currentVersion !== version) {
      localStorage.setItem(VERSION_KEY, version);
      await clearAppCaches();
      location.reload();
    }
  } catch {
    // Sem rede ou sem arquivo de versão local: mantém a versão atual.
  }
}

async function fetchCurrentVersion() {
  const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" }
  });
  if (!response.ok) return "";

  const data = await response.json();
  return data.version || data.commit || "";
}

async function clearAppCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("inspecao-postos-")).map((key) => caches.delete(key)));
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
}
