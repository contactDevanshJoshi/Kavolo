import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}

/**
 * Health check endpoint for Cloud Functions
 */
export const healthcheck = onRequest((request, response) => {
  logger.info("Health check ping received", { structuredData: true });
  response.status(200).json({ status: "ok", service: "kavolo-functions", timestamp: new Date().toISOString() });
});
