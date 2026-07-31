import type { DeviceTodaySnapshot, TodayData, TodayEvent } from "./today-types";

const DATABASE_NAME = "zury-offline";
const DATABASE_VERSION = 2;
const STORE_NAME = "today-snapshots";
export interface PlannerSnapshot { key: string; savedAt: string; data: { calendar: TodayData["calendar"]; events: TodayEvent[] } }

export async function saveTodaySnapshot(key: string, data: TodayData): Promise<void> {
  const database = await openDatabase();
  await runRequest(database, "readwrite", (store) => store.put({
    key,
    savedAt: new Date().toISOString(),
    data,
  } satisfies DeviceTodaySnapshot));
}

export async function getTodaySnapshot(key: string): Promise<DeviceTodaySnapshot | null> {
  const database = await openDatabase();
  return runRequest<DeviceTodaySnapshot | undefined>(database, "readonly", (store) => store.get(key))
    .then((snapshot) => snapshot ?? null);
}

export async function clearUserSnapshots(userId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (typeof cursor.key === "string" && cursor.key.startsWith(`${userId}:`)) cursor.delete();
      cursor.continue();
    };
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function savePlannerSnapshot(key: string, data: PlannerSnapshot["data"]): Promise<void> {
  const database = await openDatabase();
  await runRequest(database, "readwrite", (store) => store.put({ key, savedAt: new Date().toISOString(), data } satisfies PlannerSnapshot));
}

export async function getPlannerSnapshot(key: string): Promise<PlannerSnapshot | null> {
  const database = await openDatabase();
  return runRequest<PlannerSnapshot | undefined>(database, "readonly", (store) => store.get(key)).then((snapshot) => snapshot ?? null);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains("conversation-threads")) database.createObjectStore("conversation-threads", { keyPath: "key" });
      if (!database.objectStoreNames.contains("conversation-pending")) database.createObjectStore("conversation-pending", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRequest<T = IDBValidKey>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  execute: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = execute(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}
