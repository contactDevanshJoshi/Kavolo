import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * One-time Admin SDK script to set the is_admin custom claim (SRS AUTHZ-2, FR-30)
 * Usage: node scripts/set-admin-claim.js <email_or_uid>
 */
export async function setAdminClaim(identifier) {
  if (!identifier || typeof identifier !== "string") {
    throw new Error("Please provide a valid email or UID as an argument.");
  }

  if (!getApps().length) {
    initializeApp();
  }

  const auth = getAuth();
  let user;

  if (identifier.includes("@")) {
    try {
      user = await auth.getUserByEmail(identifier.trim());
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        console.log(`ℹ User ${identifier} not found. Creating user in Firebase Auth...`);
        user = await auth.createUser({
          email: identifier.trim(),
          emailVerified: true
        });
      } else {
        throw err;
      }
    }
  } else {
    user = await auth.getUser(identifier.trim());
  }

  // Preserve existing claims if any, and set is_admin: true
  const currentClaims = user.customClaims || {};
  const updatedClaims = { ...currentClaims, is_admin: true };

  await auth.setCustomUserClaims(user.uid, updatedClaims);
  const verifiedUser = await auth.getUser(user.uid);

  console.log(`✅ [Admin Claim] Successfully set is_admin=true for:`);
  console.log(`   - Email: ${verifiedUser.email}`);
  console.log(`   - UID:   ${verifiedUser.uid}`);
  console.log(`   - Claims:`, verifiedUser.customClaims);

  return verifiedUser;
}

if (process.argv[1]?.endsWith("set-admin-claim.js")) {
  const target = process.argv[2];
  if (!target) {
    console.error("❌ Usage: node scripts/set-admin-claim.js <email_or_uid>");
    process.exit(1);
  }

  setAdminClaim(target)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Failed to set admin claim:", err.message);
      process.exit(1);
    });
}
