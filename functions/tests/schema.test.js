import test from "node:test";
import assert from "node:assert";
import {
  LEAD_STATUSES,
  SERVICE_PROFILES,
  CHANNELS,
  validateSearchInput,
  validateLimits,
  validateTenant,
  validateLead,
  validateConversation,
  validateCampaign,
  ValidationError
} from "../schema.js";

test("Schema Enums: match SRS specifications", () => {
  assert.deepStrictEqual(
    LEAD_STATUSES,
    ["New", "Contacted", "Replied", "Interested", "Converted", "Lost"],
    "Lead statuses must match FR-25 exactly"
  );
  assert.deepStrictEqual(
    SERVICE_PROFILES,
    ["web_development", "whatsapp_automation"],
    "Service profiles must match BR-3 exactly"
  );
  assert.deepStrictEqual(
    CHANNELS,
    ["whatsapp", "email"],
    "Channels must be whatsapp and email"
  );
});

test("VAL-1: validateSearchInput enforces non-empty 2-60 char bounds", () => {
  const valid = validateSearchInput("  Palanpur  ", "  Dentists  ");
  assert.strictEqual(valid.area, "Palanpur");
  assert.strictEqual(valid.niche, "Dentists");

  assert.throws(() => validateSearchInput("", "Dentists"), /Area must be between 2 and 60 characters/);
  assert.throws(() => validateSearchInput("A", "Dentists"), /Area must be between 2 and 60 characters/);
  assert.throws(() => validateSearchInput("Palanpur", "A".repeat(61)), /Niche must be between 2 and 60 characters/);
});

test("VAL-6: validateLimits enforces positive integers and bounds", () => {
  const limits = validateLimits({ leads_per_click: 12, leads_per_day: 20 });
  assert.strictEqual(limits.leads_per_click, 12);
  assert.strictEqual(limits.leads_per_day, 20);
  assert.strictEqual(limits.followup_threshold_days, 4); // Default intact

  assert.throws(() => validateLimits({ leads_per_click: 0 }), /must be a positive integer/);
  assert.throws(() => validateLimits({ leads_per_click: -5 }), /must be a positive integer/);
  assert.throws(() => validateLimits({ leads_per_click: 10.5 }), /must be a positive integer/);
  assert.throws(() => validateLimits({ send_delay_min_sec: 25, send_delay_max_sec: 10 }), /cannot exceed/);
});

test("SRS §6.1: validateTenant validates tenant structure", () => {
  const validTenant = validateTenant({
    uid: "test-uid-123",
    service_profile: "web_development",
    email: "test@example.com"
  });

  assert.strictEqual(validTenant.uid, "test-uid-123");
  assert.strictEqual(validTenant.service_profile, "web_development");
  assert.strictEqual(validTenant.limits.leads_per_click, 10);

  assert.throws(() => validateTenant({}), /Tenant uid is required/);
  assert.throws(() => validateTenant({ uid: "123", service_profile: "invalid_profile" }), /Invalid service_profile/);
});

test("SRS §6.2: validateLead validates lead model and constraints", () => {
  const validLead = validateLead({
    place_id: "ChIJ12345",
    business_name: "Apex Dental Clinic",
    address: "MG Road, Palanpur",
    opportunity_score: 85,
    ai_score: 9,
    problem_summary: "No mobile responsive website found."
  });

  assert.strictEqual(validLead.place_id, "ChIJ12345");
  assert.strictEqual(validLead.status, "New");
  assert.strictEqual(validLead.ai_score, 9);
  assert.strictEqual(validLead.unread_count, 0);

  // ai_score range 1-10 (FR-9)
  assert.throws(() => validateLead({
    place_id: "ChIJ1",
    business_name: "A",
    address: "B",
    opportunity_score: 50,
    ai_score: 11
  }), /ai_score must be an integer between 1 and 10/);

  // problem_summary <= 240 chars (FR-9)
  assert.throws(() => validateLead({
    place_id: "ChIJ1",
    business_name: "A",
    address: "B",
    opportunity_score: 50,
    problem_summary: "X".repeat(241)
  }), /problem_summary must be a string up to 240 characters/);

  // status strictly matching allowed set (FR-25)
  assert.throws(() => validateLead({
    place_id: "ChIJ1",
    business_name: "A",
    address: "B",
    opportunity_score: 50,
    status: "RandomStatus"
  }), /Invalid lead status/);
});

test("SRS §6.3: validateConversation enforces direction, channel & caps (VAL-5)", () => {
  const validMsg = validateConversation({
    direction: "outbound",
    channel: "whatsapp",
    body: "Hello, noticed your clinic lacks a website."
  });
  assert.strictEqual(validMsg.direction, "outbound");
  assert.strictEqual(validMsg.status, "sent");

  // Empty body blocked (VAL-4)
  assert.throws(() => validateConversation({
    direction: "outbound",
    channel: "whatsapp",
    body: "   "
  }), /body is required and must not be empty/);

  // WhatsApp cap 4096 chars (VAL-5)
  assert.throws(() => validateConversation({
    direction: "outbound",
    channel: "whatsapp",
    body: "W".repeat(4097)
  }), /WhatsApp body cannot exceed 4096 characters/);

  // Email cap 20000 chars (VAL-5)
  assert.throws(() => validateConversation({
    direction: "outbound",
    channel: "email",
    body: "E".repeat(20001)
  }), /Email body cannot exceed 20000 characters/);
});
