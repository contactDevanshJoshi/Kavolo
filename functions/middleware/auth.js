import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Authentication and Authorization Middleware for Cloud Functions (SAD §4.1, §7.2, SRS AUTH-2, AUTHZ-2, SEC-6)
 */

/**
 * Extracts and verifies Firebase ID Token from standard Authorization header
 * @param {import("express").Request} req
 * @returns {Promise<{ uid: string, email: string, is_admin: boolean, token: object }>}
 */
export async function verifyTokenFromHeader(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or invalid Authorization header. Format must be 'Bearer <token>'.");
    err.status = 401;
    err.code = "auth/unauthorized";
    throw err;
  }

  const idToken = authHeader.split("Bearer ")[1]?.trim();
  if (!idToken) {
    const err = new Error("Empty Bearer token provided.");
    err.status = 401;
    err.code = "auth/unauthorized";
    throw err;
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      is_admin: Boolean(decodedToken.is_admin),
      token: decodedToken
    };
  } catch (error) {
    logger.warn("ID token verification failed:", error.message);
    const err = new Error(`Invalid or expired session token: ${error.message}`);
    err.status = 401;
    err.code = "auth/invalid-token";
    throw err;
  }
}

/**
 * Higher-order wrapper for HTTP (onRequest) Cloud Functions requiring authentication
 * @param {Function} handler - (req, res, user) => Promise<void>
 * @param {Object} options - { requireAdmin?: boolean }
 */
export function requireAuthHttp(handler, options = { requireAdmin: false }) {
  return async (req, res) => {
    try {
      const user = await verifyTokenFromHeader(req);

      if (options.requireAdmin && !user.is_admin) {
        logger.warn(`Forbidden: Non-admin UID '${user.uid}' attempted admin endpoint.`);
        res.status(403).json({
          error: "Forbidden: Admin privileges required (SRS AUTHZ-2)",
          code: "auth/permission-denied"
        });
        return;
      }

      req.user = user;
      return await handler(req, res, user);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        error: err.message,
        code: err.code || "auth/unauthorized"
      });
    }
  };
}

/**
 * Asserts authentication and optional admin claim for Callable (onCall) Cloud Functions
 * @param {import("firebase-functions/v2/https").CallableRequest} request
 * @param {Object} options - { requireAdmin?: boolean }
 * @returns {{ uid: string, email: string, is_admin: boolean, token: object }}
 */
export function assertCallableAuth(request, options = { requireAdmin: false }) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required. Request must include a valid Firebase Auth session token."
    );
  }

  const isAdmin = Boolean(request.auth.token?.is_admin);

  if (options.requireAdmin && !isAdmin) {
    logger.warn(`Forbidden: Non-admin UID '${request.auth.uid}' attempted admin callable.`);
    throw new HttpsError(
      "permission-denied",
      "Forbidden: Admin privileges required (SRS AUTHZ-2, SEC-6)."
    );
  }

  return {
    uid: request.auth.uid,
    email: request.auth.token?.email || null,
    is_admin: isAdmin,
    token: request.auth.token
  };
}
