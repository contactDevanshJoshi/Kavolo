import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  validateTenant,
  validateLead,
  validateConversation,
  validateCampaign
} from "../schema.js";
import {
  MOCK_TENANT,
  MOCK_LEADS,
  MOCK_CAMPAIGN
} from "./seed-data.js";

/**
 * Validates and seeds Firestore collections with mock fixtures
 * Supports both dry-run schema validation and live Firestore/emulator write
 */
export async function seedDatabase(options = { dryRun: false }) {
  console.log("🌱 [Seed] Validating fixture dataset against Firestore schema...");

  // 1. Validate Tenant
  const validTenant = validateTenant(MOCK_TENANT);
  console.log(`✓ Validated tenant fixture: ${validTenant.uid} (${validTenant.service_profile})`);

  // 2. Validate Campaign
  const validCampaign = validateCampaign(MOCK_CAMPAIGN);
  console.log(`✓ Validated campaign fixture: ${validCampaign.area} - ${validCampaign.niche}`);

  // 3. Validate Leads & Conversations
  const validatedLeads = [];
  for (const lead of MOCK_LEADS) {
    const validLead = validateLead(lead);
    const validConversations = [];
    if (lead.conversations) {
      for (const conv of lead.conversations) {
        validConversations.push(validateConversation(conv));
      }
    }
    validatedLeads.push({
      ...validLead,
      id: lead.id,
      conversations: validConversations
    });
  }
  console.log(`✓ Validated ${validatedLeads.length} leads across all statuses (New, Contacted, Replied, Interested, Converted, Lost)`);

  if (options.dryRun) {
    console.log("✨ [Seed] Dry-run complete. All fixtures are 100% schema-compliant.");
    return { tenant: validTenant, campaign: validCampaign, leads: validatedLeads };
  }

  // Live Firestore Seeding
  if (!getApps().length) {
    initializeApp();
  }
  const db = getFirestore();

  console.log(`🚀 [Seed] Writing documents to Firestore (Project: ${db.projectId || "emulator/default"})...`);

  // Write Tenant
  await db.collection("tenants").doc(validTenant.uid).set(validTenant);

  // Write Campaign under Tenant
  await db.collection("tenants").doc(validTenant.uid).collection("campaigns").doc(MOCK_CAMPAIGN.id).set(validCampaign);

  // Write Leads and Conversations under Tenant
  for (const lead of validatedLeads) {
    const { id, conversations, ...leadData } = lead;
    const leadRef = db.collection("tenants").doc(validTenant.uid).collection("leads").doc(id);
    await leadRef.set(leadData);

    if (conversations && conversations.length > 0) {
      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        await leadRef.collection("conversations").doc(`msg-${i + 1}`).set(conv);
      }
    }
  }

  console.log(`✅ [Seed] Successfully seeded 1 tenant, 1 campaign, ${validatedLeads.length} leads with conversation subcollections.`);
  return { tenant: validTenant, campaign: validCampaign, leads: validatedLeads };
}

// Allow CLI execution
if (process.argv[1]?.endsWith("seed.js")) {
  const isDryRun = process.argv.includes("--dry-run");
  seedDatabase({ dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ [Seed] Error:", err);
      process.exit(1);
    });
}
