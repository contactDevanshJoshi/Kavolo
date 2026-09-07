import { defineSecret } from "firebase-functions/params";

/**
 * Secret Manager bindings for Cloud Functions 2nd Gen
 * Ref: SAD §9, §10, SRS SEC-1, SEC-3
 */

// Groq Account A: Used strictly for keyword generation & batched lead scoring (BR-1)
export const groqApiKeyA = defineSecret("GROQ_API_KEY_A");

// Groq Account B: Used strictly for on-demand personalized message generation (BR-2)
export const groqApiKeyB = defineSecret("GROQ_API_KEY_B");

// Symmetric AES-256-GCM encryption key for tenant third-party credentials (SEC-1)
export const credentialEncryptionKey = defineSecret("CREDENTIAL_ENCRYPTION_KEY");
