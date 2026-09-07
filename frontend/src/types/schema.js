/**
 * Kavolo Shared Frontend Schema & Enums
 * Mirrors functions/schema.js (SRS §6 & §7)
 */

export const LEAD_STATUSES = Object.freeze([
  "New",
  "Contacted",
  "Replied",
  "Interested",
  "Converted",
  "Lost"
]);

export const TERMINAL_STATUSES = Object.freeze(["Converted", "Lost"]);

export const SERVICE_PROFILES = Object.freeze([
  "web_development",
  "whatsapp_automation"
]);

export const CHANNELS = Object.freeze(["whatsapp", "email"]);

export const DEFAULT_LIMITS = Object.freeze({
  leads_per_click: 10,
  leads_per_day: 15,
  followup_threshold_days: 4,
  send_delay_min_sec: 8,
  send_delay_max_sec: 20
});
