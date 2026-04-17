/**
 * folder-store.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Persists a FileSystemDirectoryHandle across page reloads using IndexedDB.
 * localStorage cannot hold file handles, but IndexedDB can store them.
 */

const DB_NAME    = "autoworx-folder-store";
const STORE_NAME = "handles";
const KEY        = "loa-sync-folder";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Persist the directory handle. */
export async function saveFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put(handle, KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Retrieve the persisted handle. */
export async function loadFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
    req.onerror   = () => reject(req.error);
  });
}

/** Clear the storage. */
export async function clearFolderHandle(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(KEY);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** 
 * Validate permission on a handle. 
 * Checks if readwrite permission is already granted.
 */
export async function validateFolderHandle(handle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> {
  try {
    // queryPermission does not trigger a prompt.
    // Use 'any' cast to avoid TS error if File System Access API types are incomplete.
    const state = await (handle as any).queryPermission({ mode: "readwrite" });
    if (state === "granted") return handle;
    
    // If 'prompt' or 'denied', we consider it invalid for auto-restoration.
    return null;
  } catch (e) {
    return null;
  }
}
