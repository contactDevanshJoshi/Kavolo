import test from "node:test";
import assert from "node:assert";
import { encrypt, decrypt } from "../crypto.js";

test("AES-256-GCM: encrypts and decrypts accurately", () => {
  const testKey = "a380a42b163e965613689d2db45834d5d5c477972460d6e7fa85bc6a8d6e45ed";
  const plaintext = "my-secure-smtp-password-!@#$%^&*()";

  const ciphertext = encrypt(plaintext, testKey);
  assert.ok(ciphertext.includes(":"), "Ciphertext should be colon-delimited iv:authTag:encrypted");

  const recovered = decrypt(ciphertext, testKey);
  assert.strictEqual(recovered, plaintext, "Recovered plaintext must match original");
});

test("AES-256-GCM: rejects invalid keys or tampered ciphertext", () => {
  const testKey = "a380a42b163e965613689d2db45834d5d5c477972460d6e7fa85bc6a8d6e45ed";
  const plaintext = "secret";

  assert.throws(() => encrypt(plaintext, "invalid_key"), /Encryption key must be a 32-byte hex string/);

  const ciphertext = encrypt(plaintext, testKey);
  const tampered = ciphertext.slice(0, -2) + "ff";
  assert.throws(() => decrypt(tampered, testKey), /Unsupported state or unable to authenticate data/);
});
