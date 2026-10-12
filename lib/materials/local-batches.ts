"use client";
import { batchSchema, type BatchDraft } from "./batch-contribution";

const databaseName = "calypso-contribution-drafts";
const legacyStoreName = "batches",
  storeName = "account-batches";
function checkOwner(ownerKey: string) {
  if (!ownerKey || ownerKey.length > 250)
    throw new Error("Sign in before accessing account drafts.");
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(
        new Error("Browser storage is unavailable. Export the draft instead."),
      );
      return;
    }
    const request = indexedDB.open(databaseName, 2);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(legacyStoreName))
        request.result.createObjectStore(legacyStoreName, { keyPath: "id" });
      if (!request.result.objectStoreNames.contains(storeName)) {
        const store = request.result.createObjectStore(storeName, {
          keyPath: ["ownerKey", "id"],
        });
        store.createIndex("ownerKey", "ownerKey");
      }
    };
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
  name = storeName,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(name, mode);
    const request = action(transaction.objectStore(name));
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
export async function saveLocalBatch(batch: BatchDraft, ownerKey: string) {
  checkOwner(ownerKey);
  const checked = batchSchema.parse({
    ...batch,
    updatedAt: new Date().toISOString(),
  });
  await transact("readwrite", (store) =>
    store.put({ ownerKey, id: checked.id, batch: checked }),
  );
  return checked;
}
export async function listLocalBatches(ownerKey: string) {
  checkOwner(ownerKey);
  const values = await transact<unknown[]>("readonly", (store) =>
    store.index("ownerKey").getAll(IDBKeyRange.only(ownerKey)),
  );
  return values
    .map((value) => batchSchema.parse((value as { batch: unknown }).batch))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function readLocalBatch(
  id: string,
  ownerKey: string,
): Promise<BatchDraft | null> {
  checkOwner(ownerKey);
  const value = await transact<{ batch: unknown } | undefined>(
    "readonly",
    (store) => store.get([ownerKey, id]),
  );
  return value ? batchSchema.parse(value.batch) : null;
}
export async function deleteLocalBatch(id: string, ownerKey: string) {
  checkOwner(ownerKey);
  await transact("readwrite", (store) => store.delete([ownerKey, id]));
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

/** Pre-account drafts are preserved; claiming copies rather than deletes them. */
export async function listUnassignedBatches() {
  const values = await transact<unknown[]>(
    "readonly",
    (store) => store.getAll(),
    legacyStoreName,
  );
  return values.map((value) => batchSchema.parse(value));
}
export async function copyUnassignedBatch(id: string, ownerKey: string) {
  checkOwner(ownerKey);
  const value = await transact<unknown>(
    "readonly",
    (store) => store.get(id),
    legacyStoreName,
  );
  if (!value) throw new Error("This unassigned draft was not found.");
  const original = batchSchema.parse(value);
  return saveLocalBatch(
    {
      ...original,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      permissionConfirmed: false,
    },
    ownerKey,
  );
}
