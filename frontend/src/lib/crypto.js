// Utility to handle Web Crypto API for End-to-End Encryption (E2EE)

const DB_NAME = 'chat_e2ee_db';
const STORE_NAME = 'keys';

// Wrap IndexedDB in promises for easy async/await
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveKey(id, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(key, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getKey(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Checks if the local device has the private key for the logged-in user.
 */
export async function hasLocalPrivateKey(userId) {
  const key = await getKey(`privateKey_${userId}`);
  return !!key;
}

/**
 * Generates an RSA-OAEP keypair. 
 * Stores the private key securely in IndexedDB.
 * Returns the public key as a base64 string to be sent to the backend.
 */
export async function generateAndStoreKeyPair(userId) {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // false would be safer, but true allows extraction if debugging/backup is needed later
    ["encrypt", "decrypt"]
  );

  await saveKey(`privateKey_${userId}`, keyPair.privateKey);
  
  const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedAsBase64 = window.btoa(String.fromCharCode(...new Uint8Array(spki)));
  
  return exportedAsBase64;
}

/**
 * Imports a base64 encoded public key (from backend) into a CryptoKey object.
 */
export async function importPublicKey(base64Key) {
  const binaryDer = window.atob(base64Key);
  const binaryLen = binaryDer.length;
  const bytes = new Uint8Array(binaryLen);
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binaryDer.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    "spki",
    bytes.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Generates an ephemeral AES-GCM key used to encrypt a single message.
 */
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts arbitrary text string using the ephemeral AES-GCM key.
 * Returns base64 encoded ciphertext and Initialization Vector (IV).
 */
export async function encryptTextData(text, aesKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encoder.encode(text)
  );
  return {
    ciphertext: window.btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: window.btoa(String.fromCharCode(...new Uint8Array(iv)))
  };
}

/**
 * Decrypts base64 encoded ciphertext using the AES-GCM key.
 */
export async function decryptTextData(base64Ciphertext, base64Iv, aesKey) {
  const ciphertext = new Uint8Array(window.atob(base64Ciphertext).split('').map(c => c.charCodeAt(0)));
  const iv = new Uint8Array(window.atob(base64Iv).split('').map(c => c.charCodeAt(0)));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypts the AES key itself with a recipient's RSA Public Key.
 */
export async function encryptAESKeyWithRSA(aesKey, rsaPublicKey) {
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawAesKey
  );
  return window.btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));
}

/**
 * Decrypts the AES key using the local user's RSA Private Key (from IndexedDB).
 */
export async function decryptAESKeyWithRSA(userId, base64EncryptedAesKey) {
  const privateKey = await getKey(`privateKey_${userId}`);
  if (!privateKey) throw new Error("Private key missing for this specific message.");
  
  const encryptedBytes = new Uint8Array(window.atob(base64EncryptedAesKey).split('').map(c => c.charCodeAt(0)));
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBytes
  );
  
  return await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Helper to decrypt an array of message objects (or a single message).
 * Handles missing keys gracefully.
 */
export async function decryptMessageObjects(messages, currentUserId) {
  const isArray = Array.isArray(messages);
  const msgs = isArray ? messages : [messages];

  const decryptedMsgs = await Promise.all(msgs.map(async (msg) => {
    if (!msg.iv || !msg.encryptionKeys || msg.encryptionKeys.length === 0) return msg;

    try {
      const keyObj = msg.encryptionKeys.find(k => k.userId === currentUserId);
      if (!keyObj) return { ...msg, text: "🔒 E2EE Message: You are not an authorized recipient." };

      const aesKey = await decryptAESKeyWithRSA(currentUserId, keyObj.encryptedKey);
      const decryptedText = await decryptTextData(msg.text, msg.iv, aesKey);
      
      return { ...msg, text: decryptedText, isDecrypted: true };
    } catch (err) {
      console.error("Failed to decrypt message", msg._id, err);
      return { ...msg, text: "🔒 E2EE Decryption Failed. Private key missing or corrupted." };
    }
  }));

  return isArray ? decryptedMsgs : decryptedMsgs[0];
}
