import test from "node:test";
import assert from "node:assert";
import { seedDatabase } from "../fixtures/seed.js";
import { LEAD_STATUSES, TERMINAL_STATUSES } from "../schema.js";

test("Seed Fixtures: validate complete schema compliance", async () => {
  const result = await seedDatabase({ dryRun: true });

  assert.ok(result.tenant, "Tenant fixture must exist");
  assert.strictEqual(result.tenant.service_profile, "web_development");
  assert.strictEqual(result.tenant.service_profile_locked, true);

  assert.ok(result.campaign, "Campaign fixture must exist");
  assert.strictEqual(result.campaign.area, "Palanpur");

  assert.strictEqual(result.leads.length, 8, "Expected 8 sample leads");

  // Verify all 6 CRM statuses are represented in the fixtures
  const representedStatuses = new Set(result.leads.map(l => l.status));
  for (const status of LEAD_STATUSES) {
    assert.ok(representedStatuses.has(status), `Status ${status} must be represented in test fixtures`);
  }

  // Verify follow-up qualifying lead exists (last_message_at > 4 days and non-terminal status)
  const followupLead = result.leads.find(l => {
    if (TERMINAL_STATUSES.includes(l.status) || !l.last_message_at) return false;
    const diffDays = (Date.now() - new Date(l.last_message_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 4;
  });
  assert.ok(followupLead, "A lead qualifying for follow-up reminder (>4 days inactive) must be present in fixtures");
  assert.strictEqual(followupLead.business_name, "Elite Fitness Club");

  // Verify edge-case lead with no phone/email (EC-2)
  const noContactLead = result.leads.find(l => l.phone === null && l.email === null);
  assert.ok(noContactLead, "Lead with no phone/email (address only, EC-2) must be present in fixtures");
  assert.strictEqual(noContactLead.business_name, "Ambika Stationery Mart");
});
