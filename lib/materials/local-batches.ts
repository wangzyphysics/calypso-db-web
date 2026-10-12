"use client";
import { batchSchema, type BatchDraft } from "./batch-contribution";

const databaseName = "calypso-contribution-drafts";
const storeName = "batches";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(
        new Error("Browser storage is unavailable. Export the draft instead."),
      );
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    let blocked = false;
    request.onupgradeneeded = () =>
      request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage could not be opened. Export the draft instead.",
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error("Another tab is blocking draft storage. Close it and retry."),
      );
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
  });
}
async function transact<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onabort = transaction.onerror = () => {
      db.close();
      reject(
        new Error(
          "Draft storage failed or is full. Export the draft to keep a copy.",
        ),
      );
    };
  });
}
export async function saveLocalBatch(batch: BatchDraft) {
  const checked = batchSchema.parse({
    ...batch,
    updatedAt: new Date().toISOString(),
  });
  await transact("readwrite", (store) => store.put(checked));
  return checked;
}
export async function listLocalBatches() {
  const values = await transact<unknown[]>("readonly", (store) =>
    store.getAll(),
  );
  return values
    .map((value) => batchSchema.parse(value))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function readLocalBatch(id: string): Promise<BatchDraft | null> {
  const value = await transact<unknown>("readonly", (store) => store.get(id));
  return value ? batchSchema.parse(value) : null;
}
export async function deleteLocalBatch(id: string) {
  await transact("readwrite", (store) => store.delete(id));
}
export function downloadText(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportLocalBatch(batch: BatchDraft) {
  downloadText(
    "calypso-batch-" + batch.id + ".json",
    JSON.stringify(batchSchema.parse(batch), null, 2) + "\n",
  );
}
