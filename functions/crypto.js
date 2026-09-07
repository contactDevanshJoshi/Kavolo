import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits standard for GCM

/**
 * Encrypt a plaintext string using AES-256-GCM (SAD §9, SRS SEC-1)
 * @param {string} plaintext - Plaintext to encrypt
 * @param {string} hexKey - 32-byte (64 hex characters) encryption key
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext (all hex)
 */
export function encrypt(plaintext, hexKey) {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string");
  }
  if (!hexKey || hexKey.length !== 64) {
    throw new Error("Encryption key must be a 32-byte hex string (64 characters)");
  }

  const key = Buffer.from(hexKey, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string (SAD §9, SRS SEC-1)
 * @param {string} encryptedPayload - Formatted as iv:authTag:ciphertext
 * @param {string} hexKey - 32-byte (64 hex characters) encryption key
 * @returns {string} Decrypted plaintext string
 */
export function decrypt(encryptedPayload, hexKey) {
  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    throw new Error("Encrypted payload must be a string");
  }
  if (!hexKey || hexKey.length !== 64) {
    throw new Error("Encryption key must be a 32-byte hex string (64 characters)");
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = Buffer.from(hexKey, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
