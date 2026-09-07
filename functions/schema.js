/**
 * Kavolo Firestore Schema Definitions & Validation Rules
 * Source of Truth: Kavolo_SRS_v1.md §6 & §7
 */

// SRS §6.2 / FR-25: Exactly six allowed lead statuses
export const LEAD_STATUSES = Object.freeze([
  "New",
  "Contacted",
  "Replied",
  "Interested",
  "Converted",
  "Lost"
]);

// Terminal statuses that do not qualify for follow-ups (FR-27)
export const TERMINAL_STATUSES = Object.freeze(["Converted", "Lost"]);

// SRS §6.1 / BR-3: Two Service Profiles supported in MVP
export const SERVICE_PROFILES = Object.freeze([
  "web_development",
  "whatsapp_automation"
]);

// SRS §6.3: Communication channels
export const CHANNELS = Object.freeze(["whatsapp", "email"]);

// SRS §6.3: Message directions
export const MESSAGE_DIRECTIONS = Object.freeze(["inbound", "outbound"]);

// SRS §6.3: Outbound send statuses
export const SEND_STATUSES = Object.freeze(["sent", "failed"]);

// SRS §5 / BR-4, BR-5, BR-6: MVP Default limits
export const DEFAULT_LIMITS = Object.freeze({
  leads_per_click: 10,
  leads_per_day: 15,
  followup_threshold_days: 4,
  send_delay_min_sec: 8,
  send_delay_max_sec: 20
});

/**
 * Validation error helper
 */
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * VAL-1: Area and niche validation
 */
export function validateSearchInput(area, niche) {
  if (typeof area !== "string" || area.trim().length < 2 || area.trim().length > 60) {
    throw new ValidationError("Area must be between 2 and 60 characters", "area");
  }
  if (typeof niche !== "string" || niche.trim().length < 2 || niche.trim().length > 60) {
    throw new ValidationError("Niche must be between 2 and 60 characters", "niche");
  }
  return {
    area: area.trim(),
    niche: niche.trim()
  };
}

/**
 * VAL-6: Tenant-configurable limits validation
 */
export function validateLimits(limits = {}) {
  const merged = { ...DEFAULT_LIMITS, ...limits };
  for (const [key, val] of Object.entries(merged)) {
    if (!Number.isInteger(val) || val <= 0) {
      throw new ValidationError(`Limit '${key}' must be a positive integer`, key);
    }
  }
  if (merged.send_delay_min_sec > merged.send_delay_max_sec) {
    throw new ValidationError("send_delay_min_sec cannot exceed send_delay_max_sec", "send_delay_min_sec");
  }
  return merged;
}

/**
 * SRS §6.1: Tenant document schema validator
 */
export function validateTenant(data) {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Tenant data must be an object", "root");
  }
  if (!data.uid || typeof data.uid !== "string") {
    throw new ValidationError("Tenant uid is required and must be a string", "uid");
  }
  if (!data.service_profile || !SERVICE_PROFILES.includes(data.service_profile)) {
    throw new ValidationError(`Invalid service_profile. Must be one of: ${SERVICE_PROFILES.join(", ")}`, "service_profile");
  }
  if (data.email_template) {
    if (typeof data.email_template.greeting !== "string" || typeof data.email_template.signature !== "string") {
      throw new ValidationError("email_template must contain greeting and signature strings", "email_template");
    }
  }

  return {
    uid: data.uid,
    email: data.email || null,
    service_profile: data.service_profile,
    service_profile_locked: Boolean(data.service_profile_locked),
    email_template: data.email_template || { greeting: "Hi {{name}},", signature: "Best,\nDevansh" },
    smtp_config: data.smtp_config || null,
    imap_config: data.imap_config || null,
    whatsapp_session_ref: data.whatsapp_session_ref || null,
    limits: validateLimits(data.limits),
    created_at: data.created_at || new Date(),
    updated_at: new Date()
  };
}

/**
 * SRS §6.2: Lead document schema validator
 */
export function validateLead(data) {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Lead data must be an object", "root");
  }
  if (!data.place_id || typeof data.place_id !== "string") {
    throw new ValidationError("place_id is required", "place_id");
  }
  if (!data.business_name || typeof data.business_name !== "string") {
    throw new ValidationError("business_name is required", "business_name");
  }
  if (!data.address || typeof data.address !== "string") {
    throw new ValidationError("address is required", "address");
  }
  if (typeof data.opportunity_score !== "number" || data.opportunity_score < 0 || data.opportunity_score > 100) {
    throw new ValidationError("opportunity_score must be a number between 0 and 100", "opportunity_score");
  }

  // ai_score is optional until scored, but if present must be integer 1-10 (FR-9)
  if (data.ai_score !== undefined && data.ai_score !== null) {
    if (!Number.isInteger(data.ai_score) || data.ai_score < 1 || data.ai_score > 10) {
      throw new ValidationError("ai_score must be an integer between 1 and 10", "ai_score");
    }
  }

  // problem_summary is optional until scored, capped at 240 chars (FR-9)
  if (data.problem_summary !== undefined && data.problem_summary !== null) {
    if (typeof data.problem_summary !== "string" || data.problem_summary.length > 240) {
      throw new ValidationError("problem_summary must be a string up to 240 characters", "problem_summary");
    }
  }

  // status must strictly match FR-25
  const status = data.status || "New";
  if (!LEAD_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid lead status '${status}'. Must be one of: ${LEAD_STATUSES.join(", ")}`, "status");
  }

  if (data.last_message_channel && !CHANNELS.includes(data.last_message_channel)) {
    throw new ValidationError(`Invalid last_message_channel. Must be one of: ${CHANNELS.join(", ")}`, "last_message_channel");
  }

  return {
    place_id: data.place_id,
    business_name: data.business_name.trim(),
    phone: data.phone || null,
    email: data.email || null,
    address: data.address.trim(),
    opportunity_score: Math.round(data.opportunity_score),
    ai_score: data.ai_score ?? null,
    problem_summary: data.problem_summary ? data.problem_summary.trim() : null,
    status,
    last_message_preview: data.last_message_preview || null,
    last_message_at: data.last_message_at || null,
    last_message_channel: data.last_message_channel || null,
    unread_count: typeof data.unread_count === "number" ? Math.max(0, data.unread_count) : 0,
    created_at: data.created_at || new Date()
  };
}

/**
 * SRS §6.3: Conversation message schema validator
 */
export function validateConversation(data) {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Conversation message must be an object", "root");
  }
  if (!data.direction || !MESSAGE_DIRECTIONS.includes(data.direction)) {
    throw new ValidationError(`direction must be one of: ${MESSAGE_DIRECTIONS.join(", ")}`, "direction");
  }
  if (!data.channel || !CHANNELS.includes(data.channel)) {
    throw new ValidationError(`channel must be one of: ${CHANNELS.join(", ")}`, "channel");
  }
  if (!data.body || typeof data.body !== "string" || data.body.trim().length === 0) {
    throw new ValidationError("body is required and must not be empty", "body");
  }

  // VAL-5 channel length caps
  if (data.channel === "whatsapp" && data.body.length > 4096) {
    throw new ValidationError("WhatsApp body cannot exceed 4096 characters", "body");
  }
  if (data.channel === "email" && data.body.length > 20000) {
    throw new ValidationError("Email body cannot exceed 20000 characters", "body");
  }

  if (data.direction === "outbound" && data.status && !SEND_STATUSES.includes(data.status)) {
    throw new ValidationError(`Outbound status must be one of: ${SEND_STATUSES.join(", ")}`, "status");
  }

  return {
    direction: data.direction,
    channel: data.channel,
    body: data.body.trim(),
    sent_at: data.sent_at || (data.direction === "outbound" ? new Date() : null),
    received_at: data.received_at || (data.direction === "inbound" ? new Date() : null),
    status: data.direction === "outbound" ? (data.status || "sent") : null,
    error: data.error || null
  };
}

/**
 * SRS §6.4: Campaign schema validator
 */
export function validateCampaign(data) {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Campaign must be an object", "root");
  }
  const { area, niche } = validateSearchInput(data.area, data.niche);

  if (!data.service_profile || !SERVICE_PROFILES.includes(data.service_profile)) {
    throw new ValidationError(`Invalid service_profile: ${data.service_profile}`, "service_profile");
  }
  if (!Array.isArray(data.keywords_generated) || data.keywords_generated.length === 0) {
    throw new ValidationError("keywords_generated must be a non-empty array of strings", "keywords_generated");
  }
  if (typeof data.lead_count !== "number" || data.lead_count < 0) {
    throw new ValidationError("lead_count must be a non-negative number", "lead_count");
  }

  return {
    area,
    niche,
    service_profile: data.service_profile,
    keywords_generated: data.keywords_generated.map(k => String(k).trim()),
    lead_count: data.lead_count,
    created_at: data.created_at || new Date()
  };
}

/**
 * SAD §4.2: Send queue job validator
 */
export function validateSendQueueJob(data) {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Job must be an object", "root");
  }
  if (!data.tenant_id || typeof data.tenant_id !== "string") {
    throw new ValidationError("tenant_id is required", "tenant_id");
  }
  if (!data.lead_id || typeof data.lead_id !== "string") {
    throw new ValidationError("lead_id is required", "lead_id");
  }
  if (!data.channel || !CHANNELS.includes(data.channel)) {
    throw new ValidationError(`channel must be one of: ${CHANNELS.join(", ")}`, "channel");
  }
  if (!data.body || typeof data.body !== "string" || data.body.trim().length === 0) {
    throw new ValidationError("body is required", "body");
  }

  return {
    tenant_id: data.tenant_id,
    lead_id: data.lead_id,
    channel: data.channel,
    body: data.body.trim(),
    subject: data.subject ? String(data.subject).trim() : null,
    recipient: data.recipient ? String(data.recipient).trim() : null,
    status: data.status || "pending",
    created_at: data.created_at || new Date()
  };
}
