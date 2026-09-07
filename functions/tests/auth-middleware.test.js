import test from "node:test";
import assert from "node:assert";
import { assertCallableAuth, requireAuthHttp } from "../middleware/auth.js";

test("assertCallableAuth: throws unauthenticated when request.auth is missing", () => {
  assert.throws(
    () => assertCallableAuth({}),
    /Authentication required/
  );
  assert.throws(
    () => assertCallableAuth({ auth: null }),
    /Authentication required/
  );
  assert.throws(
    () => assertCallableAuth({ auth: { uid: "" } }),
    /Authentication required/
  );
});

test("assertCallableAuth: returns auth context for authenticated non-admin", () => {
  const req = {
    auth: {
      uid: "user-123",
      token: { email: "user@example.com", is_admin: false }
    }
  };
  const auth = assertCallableAuth(req);
  assert.strictEqual(auth.uid, "user-123");
  assert.strictEqual(auth.email, "user@example.com");
  assert.strictEqual(auth.is_admin, false);
});

test("assertCallableAuth: enforces admin claim when requireAdmin is true", () => {
  const nonAdminReq = {
    auth: {
      uid: "tenant-456",
      token: { email: "tenant@example.com", is_admin: false }
    }
  };
  assert.throws(
    () => assertCallableAuth(nonAdminReq, { requireAdmin: true }),
    /Forbidden: Admin privileges required/
  );

  const adminReq = {
    auth: {
      uid: "admin-789",
      token: { email: "talk.unicornsgroup@gmail.com", is_admin: true }
    }
  };
  const auth = assertCallableAuth(adminReq, { requireAdmin: true });
  assert.strictEqual(auth.uid, "admin-789");
  assert.strictEqual(auth.is_admin, true);
});

test("requireAuthHttp: rejects unauthenticated requests with 401", async () => {
  let handlerCalled = false;
  const wrapped = requireAuthHttp(async () => {
    handlerCalled = true;
  });

  const req = { headers: {} };
  let responseStatus = null;
  let responseBody = null;

  const res = {
    status(s) {
      responseStatus = s;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    }
  };

  await wrapped(req, res);
  assert.strictEqual(handlerCalled, false);
  assert.strictEqual(responseStatus, 401);
  assert.ok(responseBody.error.includes("Missing or invalid Authorization header"));
});
