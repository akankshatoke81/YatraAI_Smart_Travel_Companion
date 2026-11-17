// Lightweight IndexedDB helper for YatraAI Offline Mode
const DB_NAME = "YatraAI_Offline_DB";
const DB_VERSION = 1;

export interface OfflineDestination {
  id: number;
  name: string;
  category: string;
  district_name: string;
  region_name: string;
  latitude: number;
  longitude: number;
  entry_fee: number;
  opening_hours: string;
  visit_duration: string;
  description: string;
  history?: string;
  architecture?: string;
  image_path?: string;
  image_attribution?: string;
  saved_at?: string;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("destinations")) {
        db.createObjectStore("destinations", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("itineraries")) {
        db.createObjectStore("itineraries", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("road_nodes")) {
        db.createObjectStore("road_nodes", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDestinationsOffline(destinations: OfflineDestination[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("destinations", "readwrite");
    const store = tx.objectStore("destinations");
    const now = new Date().toISOString();

    for (const d of destinations) {
      store.put({ ...d, saved_at: now });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineDestinations(): Promise<OfflineDestination[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("destinations", "readonly");
    const store = tx.objectStore("destinations");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineStorage(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["destinations", "itineraries", "road_nodes"], "readwrite");
    tx.objectStore("destinations").clear();
    tx.objectStore("itineraries").clear();
    tx.objectStore("road_nodes").clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

