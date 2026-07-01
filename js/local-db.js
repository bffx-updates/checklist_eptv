const DB_NAME = "inspecao-postos";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pendingVisitas")) {
        db.createObjectStore("pendingVisitas", { keyPath: "localId" });
      }
      if (!db.objectStoreNames.contains("historicoLocal")) {
        db.createObjectStore("historicoLocal", { keyPath: "localId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = callback(store);

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => db.close());
}

export async function savePendingVisit(visit) {
  const item = {
    ...visit,
    localId: visit.localId || crypto.randomUUID(),
    pending: true,
    savedAt: new Date().toISOString()
  };
  await tx("pendingVisitas", "readwrite", (store) => store.put(item));
  return item;
}

export async function listPendingVisits() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("pendingVisitas").objectStore("pendingVisitas").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function removePendingVisit(localId) {
  await tx("pendingVisitas", "readwrite", (store) => store.delete(localId));
}

export async function saveLocalHistory(visit) {
  const item = {
    ...visit,
    localId: visit.localId || crypto.randomUUID(),
    savedAt: visit.savedAt || new Date().toISOString()
  };
  await tx("historicoLocal", "readwrite", (store) => store.put(item));
  return item;
}

export async function listLocalHistory() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("historicoLocal").objectStore("historicoLocal").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}
