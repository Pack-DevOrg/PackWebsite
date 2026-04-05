type StorageAreaKind = "local" | "session";

interface EncryptedStorageOptions {
  readonly namespace: string;
  readonly area: StorageAreaKind;
}

interface EncryptedPayload {
  readonly v: 1;
  readonly iv: string;
  readonly data: string;
}

const KEY_DB_NAME = "pack-secure-storage";
const KEY_STORE_NAME = "crypto-keys";
const KEY_DB_VERSION = 1;

const keyPromises = new Map<string, Promise<CryptoKey>>();

const isBrowser = typeof window !== "undefined";

const isEncryptedPayloadShape = (value: unknown): value is EncryptedPayload =>
  typeof value === "object" &&
  value !== null &&
  (value as { v?: unknown }).v === 1 &&
  typeof (value as { iv?: unknown }).iv === "string" &&
  typeof (value as { data?: unknown }).data === "string";

const getStorage = (area: StorageAreaKind): Storage | null => {
  if (!isBrowser) {
    return null;
  }
  return area === "local" ? window.localStorage : window.sessionStorage;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const openKeyDatabase = async (): Promise<IDBDatabase | null> => {
  if (!isBrowser || typeof indexedDB === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(KEY_DB_NAME, KEY_DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(KEY_STORE_NAME)) {
          database.createObjectStore(KEY_STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const readStoredKey = async (
  database: IDBDatabase,
  keyName: string,
): Promise<CryptoKey | null> =>
  new Promise((resolve) => {
    try {
      const transaction = database.transaction(KEY_STORE_NAME, "readonly");
      const request = transaction.objectStore(KEY_STORE_NAME).get(keyName);
      request.onsuccess = () => {
        resolve(
          typeof CryptoKey !== "undefined" && request.result instanceof CryptoKey
            ? request.result
            : null,
        );
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

const persistKey = async (
  database: IDBDatabase,
  keyName: string,
  key: CryptoKey,
): Promise<void> =>
  new Promise((resolve) => {
    try {
      const transaction = database.transaction(KEY_STORE_NAME, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.objectStore(KEY_STORE_NAME).put(key, keyName);
    } catch {
      resolve();
    }
  });

const createEncryptionKey = async (): Promise<CryptoKey> => {
  if (
    typeof crypto === "undefined" ||
    !crypto.subtle ||
    typeof crypto.subtle.generateKey !== "function"
  ) {
    throw new Error("Web Crypto is not available.");
  }

  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
};

const getOrCreateKey = async (namespace: string): Promise<CryptoKey> => {
  const cached = keyPromises.get(namespace);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const database = await openKeyDatabase();

    if (database) {
      const existingKey = await readStoredKey(database, namespace);
      if (existingKey) {
        database.close();
        return existingKey;
      }

      const generatedKey = await createEncryptionKey();
      await persistKey(database, namespace, generatedKey);
      database.close();
      return generatedKey;
    }

    return createEncryptionKey();
  })();

  keyPromises.set(namespace, promise);
  return promise;
};

const encodePayload = async (
  key: CryptoKey,
  value: string,
): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );
  const payload: EncryptedPayload = {
    v: 1,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  };
  return JSON.stringify(payload);
};

const decodePayload = async (
  key: CryptoKey,
  payloadText: string,
): Promise<string | null> => {
  let payload: EncryptedPayload;

  try {
    payload = JSON.parse(payloadText) as EncryptedPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.iv !== "string" ||
    typeof payload.data !== "string"
  ) {
    return null;
  }

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(payload.iv),
      },
      key,
      fromBase64(payload.data),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
};

export const createEncryptedStorage = ({
  namespace,
  area,
}: EncryptedStorageOptions) => {
  const readRaw = (): string | null => {
    const storage = getStorage(area);
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(namespace);
    } catch {
      return null;
    }
  };

  const removeRaw = (): void => {
    const storage = getStorage(area);
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(namespace);
    } catch {
      // Ignore storage failures.
    }
  };

  return {
    readRaw,
    removeRaw,
    readPlaintextFallback(): string | null {
      const raw = readRaw();
      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as unknown;
        return isEncryptedPayloadShape(parsed) ? null : raw;
      } catch {
        return raw;
      }
    },
    async getItem(): Promise<string | null> {
      const raw = readRaw();
      if (!raw) {
        return null;
      }

      try {
        const key = await getOrCreateKey(namespace);
        const decrypted = await decodePayload(key, raw);
        if (decrypted != null) {
          return decrypted;
        }
      } catch {
        // If the key layer is unavailable, treat the entry as unreadable.
      }

      return null;
    },
    async setItem(value: string): Promise<void> {
      const storage = getStorage(area);
      if (!storage) {
        return;
      }

      try {
        const key = await getOrCreateKey(namespace);
        const encrypted = await encodePayload(key, value);
        storage.setItem(namespace, encrypted);
      } catch {
        // Ignore persistence failures so the app can continue in memory.
      }
    },
    async removeItem(): Promise<void> {
      removeRaw();
    },
  };
};
