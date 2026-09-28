const ECDH = { name: "ECDH", namedCurve: "P-256" } as const;

function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    const open = indexedDB.open("chat-keys", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("keys");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = run(open.result.transaction("keys", mode).objectStore("keys"));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

export async function getKeyPair(name: string) {
  const saved = await idb<CryptoKeyPair | undefined>("readonly", (s) => s.get(name));
  if (saved) return saved;
  const pair = await crypto.subtle.generateKey(ECDH, false, ["deriveKey"]);
  await idb("readwrite", (s) => s.put(pair, name));
  return pair;
}

export const exportPublicKey = (pair: CryptoKeyPair) =>
  crypto.subtle.exportKey("jwk", pair.publicKey);

export async function deriveSharedKey(pair: CryptoKeyPair, peerJwk: JsonWebKey) {
  const peer = await crypto.subtle.importKey("jwk", peerJwk, ECDH, false, []);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peer },
    pair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(key: CryptoKey, data: BufferSource) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const out = new Uint8Array(12 + cipher.length);
  out.set(iv);
  out.set(cipher, 12);
  return out;
}

export const decrypt = (key: CryptoKey, data: ArrayBuffer) =>
  crypto.subtle.decrypt({ name: "AES-GCM", iv: data.slice(0, 12) }, key, data.slice(12));
