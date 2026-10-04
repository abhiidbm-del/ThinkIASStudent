export interface RecordingDraft { owner: string; sessionId: string; blob: Blob; }

// A completed recording remains recoverable after refresh until its upload succeeds.
export async function recordingDraft(owner: string, write?: RecordingDraft | null): Promise<RecordingDraft | undefined> {
  if (!owner || typeof indexedDB === 'undefined') return undefined;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('exam-recording-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'owner' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<RecordingDraft | undefined>((resolve, reject) => {
      const transaction = db.transaction('drafts', write === undefined ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = write === undefined ? store.get(owner) : write === null ? store.delete(owner) : store.put(write);
      transaction.oncomplete = () => resolve(write === undefined ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
