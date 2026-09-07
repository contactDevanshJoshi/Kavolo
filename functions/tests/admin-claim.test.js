import test from "node:test";
import assert from "node:assert";
import { setAdminClaim } from "../scripts/set-admin-claim.js";

test("setAdminClaim: rejects empty or invalid arguments", async () => {
  await assert.rejects(
    () => setAdminClaim(""),
    /Please provide a valid email or UID/
  );
  await assert.rejects(
    () => setAdminClaim(null),
    /Please provide a valid email or UID/
  );
});
