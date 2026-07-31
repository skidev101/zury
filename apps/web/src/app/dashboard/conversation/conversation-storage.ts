const DATABASE_NAME = "zury-offline";
const DATABASE_VERSION = 2;
const THREADS = "conversation-threads";
const PENDING = "conversation-pending";

export interface CachedThread {
  key: string;
  userId: string;
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface PendingMessage {
  id: string;
  userId: string;
  conversationId: string | null;
  content: string;
  timezone: string;
  createdAt: string;
}

export async function saveCachedThread(thread: Omit<CachedThread, "key">): Promise<void> {
  const database = await openDatabase();
  await request(database, THREADS, "readwrite", (store) => store.put({ ...thread, key: `${thread.userId}:${thread.id}` }));
}

export async function listCachedThreads(userId: string): Promise<CachedThread[]> {
  const database = await openDatabase();
  const values = await request<CachedThread[]>(database, THREADS, "readonly", (store) => store.getAll());
  return values.filter((thread) => thread.userId === userId).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteCachedThread(userId: string, conversationId: string): Promise<void> {
  const database = await openDatabase();
  await request(database, THREADS, "readwrite", (store) => store.delete(`${userId}:${conversationId}`));
}

export async function savePendingMessage(message: PendingMessage): Promise<void> {
  const database = await openDatabase();
  await request(database, PENDING, "readwrite", (store) => store.put(message));
}

export async function listPendingMessages(userId: string): Promise<PendingMessage[]> {
  const database = await openDatabase();
  const values = await request<PendingMessage[]>(database, PENDING, "readonly", (store) => store.getAll());
  return values.filter((message) => message.userId === userId).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function deletePendingMessage(id: string): Promise<void> {
  const database = await openDatabase();
  await request(database, PENDING, "readwrite", (store) => store.delete(id));
}

export async function clearConversationData(userId: string): Promise<void> {
  const database = await openDatabase();
  await Promise.all([clearOwned(database, THREADS, userId), clearOwned(database, PENDING, userId)]);
  database.close();
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains("today-snapshots")) open.result.createObjectStore("today-snapshots", { keyPath: "key" });
      if (!open.result.objectStoreNames.contains(THREADS)) open.result.createObjectStore(THREADS, { keyPath: "key" });
      if (!open.result.objectStoreNames.contains(PENDING)) open.result.createObjectStore(PENDING, { keyPath: "id" });
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

function request<T = IDBValidKey>(database: IDBDatabase, storeName: string, mode: IDBTransactionMode, execute: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const result = execute(transaction.objectStore(storeName));
    result.onsuccess = () => resolve(result.result);
    result.onerror = () => reject(result.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

function clearOwned(database: IDBDatabase, storeName: string, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const cursorRequest = transaction.objectStore(storeName).openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if ((cursor.value as { userId?: string }).userId === userId) cursor.delete();
      cursor.continue();
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
