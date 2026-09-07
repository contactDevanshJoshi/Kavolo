# KAVOLO
### FIND | REACH | GROW

# Software Requirements Specification

*Scope: MVP (single-tenant), as defined in the Kavolo PRD v1*

Version 1.0 · September 2026
Prepared by: Devansh Joshi — UGBS (Unicorns Group of Business Solutions)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for Kavolo v1 (MVP): a single-tenant lead discovery and outreach system. It is the technical companion to the Kavolo PRD v1 and is written to be directly testable — every requirement carries an ID and an explicit acceptance/test condition, so a QA pass can be run straight from this document.

### 1.2 Scope
Covers the MVP system only: one tenant (the operator, Devansh/UGBS) using two Service Profiles (Web Development, WhatsApp/AI Automation), the full find → score → message → send → inbox → track pipeline, and the admin cost/usage dashboard. Multi-tenant onboarding, Razorpay billing, tiers, auto-send follow-ups, and the remaining Service Profiles are out of scope for this version — see the PRD, Section 10 — but the data model and security rules below are written to not require rework when those are added (Section 6, Section 12).

### 1.3 Definitions & Acronyms
- **Tenant** — the account using Kavolo to find and contact leads. Exactly one exists in MVP.
- **Lead** — a business record discovered via Google Maps scraping for a tenant's search.
- **Opportunity Score** — a rule-based, deterministic 0–100 score computed at scrape time, no AI involved.
- **AI Score (acceptance_score)** — an integer 1–10 produced by the batched scoring AI call.
- **Service Profile** — the configuration (Web Development or WhatsApp/AI Automation in MVP) that determines keyword-gen framing, scoring signals, and outreach angle.
- **Account A / Account B** — the two separate Groq accounts: A for keyword-generation + batch scoring, B for personalized message generation.
- **Baileys** — the unofficial WhatsApp Web protocol library used for the tenant's connected WhatsApp number.
- **Admin** — the operator role (Firebase custom claim `is_admin`) with access to the cost/usage dashboard.

### 1.4 References
- Kavolo Lead Generator Plan (project working document) — architecture, data model, and roadmap.
- Kavolo PRD v1 — problem statement, goals, MVP scope, and product-level acceptance criteria.

## 2. System Overview

Kavolo MVP is a single-tenant web application backed by Firebase (Firestore + Auth), with a Node.js backend orchestrating: Playwright-based Google Maps scraping, two Groq accounts for AI calls, Nodemailer/SMTP for outbound email, IMAP for inbound email, and Baileys for WhatsApp send/receive. The tenant interacts through a dashboard (search, lead table, inbox, CRM); the admin interacts through a separate cost/usage view gated by a Firebase custom claim.

## 3. User Roles & Permissions

| Role | Description | Permissions |
|---|---|---|
| Tenant | The freelancer/agency user running lead searches and outreach. | Full CRUD on their own leads, campaigns, conversations, templates, and email_template settings. Read-only on their own usage counters (leads today, messages today). No access to any other tenant's data (enforced even in MVP, see Section 12). No access to the admin cost/usage dashboard. |
| Admin (Operator) | The system operator, identified by Firebase custom claim `is_admin == true`. | Read access to the cost/usage dashboard (Firestore + Groq usage vs. free-tier ceilings) for all tenants. In MVP the Admin and the sole Tenant are the same person, but the permission check is enforced independently of that coincidence, so it is correct without rework when more tenants exist. |
| Backend Service (non-human) | Server-side scheduled jobs and listeners (IMAP poll, follow-up threshold check, scrape job runner) running under the Firebase Admin SDK. | Full read/write access to all Firestore data, bypassing client-facing security rules by design (Admin SDK is not subject to Firestore Security Rules). No human end-user interacts with this role directly; it must never expose a client-callable endpoint with equivalent unrestricted access. |

## 4. Functional Requirements

### 4.1 Module A — Lead Discovery

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-1 | The system shall accept an area (city/locality) and a niche/business-category as text input from the tenant before starting a lead search. | Submitting the search form with both fields populated starts a search; submitting with either field empty is blocked client-side with an inline validation message (see VAL-1). |
| FR-2 | The system shall generate an optimized keyword set for the given area+niche via exactly one AI call to Account A before scraping begins. | For any single search, the admin usage dashboard shows exactly +1 Account A request logged at search start, before any scrape network activity. |
| FR-3 | The system shall scrape Google Maps for businesses matching the generated keywords using network-response interception (not DOM/CSS scraping). | A scrape run against a known test area+niche returns business name, address, phone (if listed), category, and rating for each result, sourced from intercepted network responses, verifiable in scrape-run logs. |
| FR-4 | The system shall cap the leads returned per search click at the tenant's configured per-click limit (MVP default: 10). | A search that would otherwise return more than the configured limit returns exactly the limit; the UI indicates more results exist but were capped. |
| FR-5 | The system shall cap total leads a tenant can generate per calendar day (tenant's local day) at the tenant's configured per-day limit (MVP default: 15). | After reaching the daily cap, a further search attempt is blocked with a message stating the limit and the UTC/local time it resets (see ERR-5). |
| FR-6 | The system shall de-duplicate leads within a single search by Maps place ID (or, if unavailable, name+address), producing no duplicate lead record for the same business in one run. | A search whose raw scrape contains a repeated place ID produces exactly one lead record for that business. |
| FR-7 | The system shall skip creating a new lead record for a business that already exists as a lead for that tenant (matched by Maps place ID or phone number), across separate search runs. | Re-running the same area+niche search on a later day does not create duplicate lead documents for businesses already captured; existing leads are left untouched, not re-scored. |

### 4.2 Module B — Lead Scoring

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-8 | The system shall compute a rule-based Opportunity Score (0–100, deterministic) for every scraped lead immediately at scrape time, with no AI call involved. | Given a fixed scrape result, the Opportunity Score for each lead is identical on repeated computation (deterministic, reproducible test). |
| FR-9 | The system shall submit all leads from one completed search to exactly one batched AI call to Account A, returning an AI Score (integer 1–10) and a problem summary (≤240 characters) per lead. | For a search returning N leads (N ≥ 1), the admin usage dashboard shows exactly +1 Account A request for scoring, and the returned lead set has an ai_score and problem_summary populated for all N leads. |
| FR-10 | The system shall not split a single search's batch scoring into multiple AI calls; the per-click cap (FR-4) shall be set such that the batch stays within Account A's safe token threshold. | A search at the maximum configured per-click cap completes scoring in exactly one Account A call without a token-limit error. |
| FR-11 | The system shall persist opportunity_score, ai_score, and problem_summary as fields on the lead document. | Reading any scored lead document returns non-null values for all three fields. |
| FR-12 | The lead table view shall support sorting by opportunity_score and by ai_score, in either direction. | Toggling the sort control re-orders the visible lead rows accordingly without a full page reload. |
| EC-1 | Edge case: a search returns zero businesses for the given area+niche. | The system shows an explicit "no businesses found" state (not an error, not a blank table) and does not issue the Account A batch-scoring call (there is nothing to score). |

### 4.3 Module C — Outreach / Messaging

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-13 | The system shall generate a personalized first-touch message via exactly one Account B AI call, only when the tenant explicitly requests it for one specific lead. | The Account B request counter increases by exactly 1 per "generate message" click, never in response to a search or scoring action. |
| FR-14 | The generated message shall incorporate the lead's stored problem_summary. | Manual review of a sample of generated messages confirms each references content present in that lead's problem_summary, not generic filler. |
| FR-15 | The tenant shall be able to edit the generated message text in a text field before sending. | The message text field is editable post-generation; the edited text, not the original AI output, is what gets sent. |
| FR-16 | For Email, the system shall auto-assemble the outgoing message from greeting + tenant-authored body + signature (using tenants.email_template) for the first message to a given lead; the tenant shall not type a subject, greeting, or closing line. | Composing and sending a first email to a lead, with only body text entered by the tenant, produces a sent email containing a subject, greeting, the entered body, and a signature — all assembled by the system. |
| FR-17 | For any message to a lead that has already received a first message, the system shall omit the greeting and use only body + signature. | The second and later sent emails to the same lead do not contain the greeting text used in the first message. |
| FR-18 | For WhatsApp, the system shall send the message body as-is via the tenant's connected Baileys session, with no auto-assembly. | A WhatsApp message sent from the composer matches the tenant-entered text exactly, with no appended subject/greeting/signature unless the tenant typed one. |
| FR-19 | The system shall apply a randomized delay (business rule BR-4) between consecutive outbound sends on the same channel for the same tenant. | Sending 3 messages in quick succession on the same channel produces send timestamps separated by no less than the configured minimum delay. |
| EC-4 | Edge case: the tenant clicks "generate message" twice in quick succession for the same lead before the first call returns. | The generate-message control is disabled immediately after the first click and re-enabled only when that call resolves (success or error); at most one Account B call is made per click-intent. |

### 4.4 Module D — Unified Inbox

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-20 | The system shall capture incoming WhatsApp messages via the tenant's Baileys session and incoming email replies via IMAP polling/listener on the tenant's connected mailbox. | A test message sent to the tenant's connected WhatsApp number, and a test reply sent to the tenant's connected mailbox, both appear in the inbox within the defined polling interval (NFR-6). |
| FR-21 | The system shall match an incoming message to an existing lead by phone number (WhatsApp) or sender email address (Email). | An incoming message from a phone/email already on file for a lead is attached to that lead's conversation, verified against the lead's stored contact fields. |
| FR-22 | The system shall strip quoted history from incoming email replies before display, so only the new reply text renders. | A reply sent using a standard mail client's "Reply" (which includes quoted original text) displays in the inbox with only the newly typed text, not the quoted block. |
| FR-23 | The system shall store every message (inbound or outbound, either channel) as a document in that lead's conversations subcollection, and denormalize last_message_preview, last_message_at, last_message_channel, and unread_count onto the parent lead document. | After any send or receive event, the lead document's denormalized fields match the most recent message in its conversations subcollection. |
| FR-24 | Opening a lead's conversation view shall reset that lead's unread_count to 0. | Viewing a lead with unread_count > 0 sets it to 0 immediately, without affecting other leads' unread counts. |
| EC-5 | Edge case: an incoming WhatsApp message arrives from a phone number that matches a lead, but the sender's display name differs from the scraped business name (e.g. rebranded). | Matching uses the phone number field only; the message is attached to the correct lead regardless of display-name mismatch. |
| EC-8 | Edge case: two replies arrive from the same lead on the same channel in rapid succession. | Both messages are stored as separate documents in received order; unread_count increases by 2, not capped at 1. |

### 4.5 Module E — CRM / Pipeline Tracking

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-25 | The system shall support exactly these lead statuses: New, Contacted, Replied, Interested, Converted, Lost. | The status field on a lead document only ever accepts one of these six values; any other value is rejected at the data-write layer. |
| FR-26 | Status shall change automatically only for New→Contacted (triggered by the first outbound send for that lead); all other transitions are manual, tenant-triggered. | Sending a lead's first message flips its status from New to Contacted without a manual step; every other status change requires an explicit tenant action. |
| FR-27 | The system shall list leads whose status is non-terminal (not Converted/Lost) and whose last_message_at is older than the tenant's configured follow-up threshold (MVP default: 4 days) as a "needs follow-up" list. | A lead manually backdated (test fixture) past the threshold with a non-terminal status appears on the follow-up list; one within the threshold or in a terminal status does not. |
| FR-28 | Sending a follow-up from that list shall be a manual, tenant-triggered action in MVP. | No message is sent to a follow-up-eligible lead without the tenant clicking the send action for it. |

### 4.6 Module F — Admin / Cost Dashboard

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| FR-29 | The system shall show, for the current day: Firestore reads/writes/deletes/storage used vs. free-tier ceiling, and Groq usage for Account A and Account B vs. their daily free-tier ceilings. | The dashboard's displayed counters match the values reported by Firebase's and Groq's own usage/billing pages for the same day, within the dashboard's refresh interval. |
| FR-30 | Access to the admin dashboard shall require the authenticated user's Firebase custom claim `is_admin == true`. | A request to the admin dashboard route from an authenticated user without the claim is denied (see AUTHZ-2); an admin-claimed user is served the dashboard. |

## 5. Business Rules

| ID | Rule |
|---|---|
| BR-1 | Exactly 2 AI calls are made per lead search, regardless of the number of leads found: 1 keyword-generation call (Account A) and 1 batch-scoring call (Account A). AI is never called per individual lead during discovery/scoring. |
| BR-2 | Exactly 1 AI call is made per tenant-initiated "generate message" action (Account B). AI message generation never runs automatically for leads the tenant has not chosen to contact. |
| BR-3 | A tenant has exactly one active Service Profile in MVP (Web Development or WhatsApp/AI Automation), set at setup; it determines the keyword-gen framing, the scoring signal set, and the outreach angle for every search that tenant runs. |
| BR-4 | Outbound sends on a single channel for a single tenant are throttled with a randomized delay between consecutive sends (default range: 8–20 seconds) to reduce WhatsApp ban risk and avoid SMTP rate-limit triggers. |
| BR-5 | Per-click and per-day lead caps (FR-4, FR-5) are tenant-level configuration values, defaulting to 10 and 15 respectively in MVP, and must be set low enough that FR-10's single-batch-call constraint always holds. |
| BR-6 | The follow-up threshold (FR-27) is a tenant-level configurable number of days, defaulting to 4. |
| BR-7 | Branding/promotional append-to-message logic (used in later tiers) does not apply in MVP — there is only one tenant and no tier structure yet; this rule is documented here so it is not silently reintroduced without a decision when tiers are built (Phase 3, out of scope per PRD Section 10). |

## 6. Data Requirements

Firestore collections. All collections below are tenant-scoped (a tenant only ever reads/writes documents where the ownership field matches their own uid), even though MVP has a single tenant — see Section 12 for the security-rule requirement this implies.

### 6.1 tenants

| Field | Type | Required | Notes |
|---|---|---|---|
| uid | string | Yes | Firebase Auth UID; document ID for this collection. |
| email_template | map | Yes | { greeting: string, signature: string } — set once at onboarding, editable later. |
| smtp_config | map (encrypted) | Yes | { host, port, username, password_encrypted, from_address }. |
| imap_config | map (encrypted) | Yes | { host, port, username, password_encrypted }. |
| whatsapp_session_ref | string | Yes | Reference to the stored, encrypted Baileys session credentials (not the raw session inline). |
| service_profile | string | Yes | One of: web_development, whatsapp_automation (MVP). Set once; not user-editable post-setup (forward-compat with the lock decision for Phase 3). |
| limits | map | Yes | { leads_per_click, leads_per_day, followup_threshold_days, send_delay_min_sec, send_delay_max_sec }. |

### 6.2 leads (tenant subcollection)

| Field | Type | Required | Notes |
|---|---|---|---|
| place_id | string | Yes | Google Maps place identifier; used for de-duplication (FR-6, FR-7). |
| business_name | string | Yes | |
| phone | string | No | Absent for some listings; see EC-2. |
| email | string | No | Rarely present from Maps scraping alone. |
| address | string | Yes | |
| opportunity_score | number (0–100) | Yes | Rule-based, set at scrape time. |
| ai_score | number (1–10) | No until scored | Set by the batch AI call; "unavailable" on scoring failure (ERR-2). |
| problem_summary | string (≤240 chars) | No until scored | |
| status | enum | Yes | New / Contacted / Replied / Interested / Converted / Lost (FR-25). |
| last_message_preview | string | No | Denormalized (FR-23). |
| last_message_at | timestamp | No | Denormalized (FR-23). |
| last_message_channel | enum | No | whatsapp / email. |
| unread_count | number | Yes (default 0) | Denormalized (FR-23, FR-24). |
| created_at | timestamp | Yes | |

### 6.3 leads/{leadId}/conversations (subcollection)

| Field | Type | Required | Notes |
|---|---|---|---|
| direction | enum | Yes | inbound / outbound. |
| channel | enum | Yes | whatsapp / email. |
| body | string | Yes | Quote-stripped for inbound email (FR-22). |
| sent_at / received_at | timestamp | Yes | |
| status | enum | Yes (outbound only) | sent / failed (ERR-3). |

### 6.4 campaigns

| Field | Type | Required | Notes |
|---|---|---|---|
| area | string | Yes | Search input (FR-1). |
| niche | string | Yes | Search input (FR-1). |
| service_profile | string | Yes | Stamped from tenants.service_profile at creation time; not independently editable. |
| keywords_generated | array<string> | Yes | Output of FR-2. |
| lead_count | number | Yes | Leads returned by this run. |
| created_at | timestamp | Yes | |

## 7. Validation Rules

| ID | Rule | Acceptance / Test Criteria |
|---|---|---|
| VAL-1 | Area and niche inputs (FR-1) must each be non-empty after trimming whitespace, minimum 2 characters, maximum 60 characters. | Submitting either field empty, whitespace-only, or over 60 characters is blocked with an inline error before any AI call is made. |
| VAL-2 | SMTP/IMAP configuration must pass a live test connection (real login attempt) before being saved. | Saving fails with a clear error if the test login does not succeed; no unverified credential set is ever persisted. |
| VAL-3 | WhatsApp connection is only marked "connected" after a completed Baileys QR-pairing handshake. | The UI shows "not connected" until pairing succeeds; send actions are disabled until then (ERR-4). |
| VAL-4 | Message body must be non-empty before the send action is enabled. | The send button remains disabled while the body field is empty or whitespace-only. |
| VAL-5 | Message length is capped per channel (WhatsApp: 4096 characters; Email body: 20,000 characters). | Input beyond the cap is blocked or truncated with a visible counter, not silently cut off without indication. |
| VAL-6 | Tenant-configurable limits (leads_per_click, leads_per_day, followup_threshold_days, send delay bounds) must be positive integers within admin-set bounds. | Attempting to save a zero, negative, or non-integer value for any limit is rejected with a validation message. |

## 8. Authentication

| ID | Rule | Acceptance / Test Criteria |
|---|---|---|
| AUTH-1 | All human users (Tenant, Admin) authenticate via Firebase Authentication (email/password or Google sign-in). | An unauthenticated request to any tenant or admin route is redirected to sign-in; no route is reachable without a valid Firebase session. |
| AUTH-2 | Session validity follows Firebase Auth's standard token expiry and refresh; no custom session store is introduced. | A session with an expired ID token is refreshed transparently via the Firebase SDK, or the user is prompted to re-authenticate if refresh fails. |
| AUTH-3 | SMTP, IMAP, and WhatsApp credentials are the tenant's own external service credentials, not application authentication mechanisms — they are used server-side only and never returned to the client after initial save. | An API/UI response for tenant settings never includes the plaintext SMTP/IMAP password or raw WhatsApp session data, only a "connected/not connected" status. |

## 9. Authorization

| ID | Rule | Acceptance / Test Criteria |
|---|---|---|
| AUTHZ-1 | A Tenant may read/write only documents (tenants, leads, campaigns, conversations, templates) where the ownership field equals their own Firebase Auth UID. | An authenticated Tenant's crafted request for another tenant's document (by guessing/enumerating an ID) is denied by Firestore Security Rules, not merely hidden in the UI. |
| AUTHZ-2 | The admin cost/usage dashboard route is accessible only to a user whose Firebase custom claim `is_admin` equals true, verified server-side. | A non-admin authenticated user's request to the admin route/API is denied server-side (not just hidden by client-side routing) with a 403-equivalent response. |
| AUTHZ-3 | Backend service jobs (IMAP poll, follow-up check, scrape runner) run under the Firebase Admin SDK and are not exposed as directly callable client endpoints with equivalent unrestricted access. | No client-reachable API route grants the unrestricted cross-tenant read/write access that backend service jobs have; a security review confirms no such route exists. |

## 10. Error Handling

| ID | Rule | Acceptance / Test Criteria |
|---|---|---|
| ERR-1 | If the Maps scrape step fails (timeout, blocked, structure changed), the tenant sees a clear "search failed, try again" state; the failure is logged for the admin scrape-reliability metric. | A forced scrape failure (test fixture) results in a visible failure state, not a blank or silently-empty successful result, and increments the logged failure counter. |
| ERR-2 | If the batch AI scoring call fails or returns malformed output, the system retries once; on a second failure, leads are still shown with opportunity_score populated and ai_score/problem_summary marked "unavailable." | A forced scoring failure on both attempts still renders the lead table with all leads visible and the scoring fields explicitly marked unavailable, not blocking the entire result set. |
| ERR-3 | If an SMTP send fails (auth error, connection refused, quota), that message is marked Failed (not Sent), with a retry option; the lead's status is not advanced to Contacted on a failed send. | A forced SMTP failure leaves the lead's status unchanged and the message record shows Failed; a subsequent successful retry updates both correctly. |
| ERR-4 | If the Baileys WhatsApp session is disconnected or logged out, new WhatsApp sends are blocked and the tenant is prompted to re-pair (QR); sends are not queued silently. | With the session forced into a disconnected state, attempting a WhatsApp send surfaces a re-pair prompt immediately rather than accepting and queuing the send. |
| ERR-5 | If a tenant exceeds their per-day or per-click lead cap, the search action is blocked with a message stating the limit and the reset time. | Attempting a search after the daily cap is reached is blocked client- and server-side, with the limit value and reset time shown, not a partial/truncated silent result. |

## 11. Edge Cases

Edge cases directly tied to a specific module's requirements (EC-1, EC-4, EC-5, EC-8) are listed inline in Section 4 alongside the requirement they qualify. The remaining cross-cutting edge cases are below.

| ID | Scenario | Required Behavior / Acceptance Criteria |
|---|---|---|
| EC-2 | A scraped business has no phone number and no email — only an address. | The lead is still created and scored normally; the WhatsApp and Email send actions are disabled for that lead with a visible explanatory tooltip, not silently hidden or omitted from the table. |
| EC-3 | Forward-compatibility note: a tenant has only one Service Profile in MVP, so "same business found under two different profiles" cannot occur yet — it becomes relevant only when Phase 3 introduces multiple profiles per account, at which point FR-7's de-duplication rule must be revisited per-profile. | No test applicable in MVP; documented so it is not overlooked when Phase 3 is scoped. |
| EC-6 | The tenant's SMTP mailbox hits its own provider-side rate limit mid-outreach batch. | Each remaining send in the batch fails independently and is reported per-message (per ERR-3), not as one opaque "batch failed" error with no detail on which messages went through. |
| EC-7 | An AI-generated message contains a claim not present in the lead's problem_summary (a hallucination). | Out of scope for automated detection in MVP; the control is mandatory tenant review/edit before send (FR-15), documented here so it is not mistaken for an automated fact-check guarantee. |
| EC-9 | The tenant's connected mailbox becomes inaccessible mid-operation (password changed externally, account suspended). | The next send/poll attempt against that mailbox fails per ERR-3/ERR-1 patterns; the failure is scoped to that channel only and does not crash the tenant's session or other channel's operation. |

## 12. Security Requirements

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| SEC-1 | SMTP/IMAP passwords and WhatsApp session credentials are stored encrypted at rest, never as plaintext, in Firestore or any backing store. | Direct inspection of the stored tenant document shows only ciphertext/encrypted blobs for these fields, never a readable password or session token. |
| SEC-2 | Firestore Security Rules scope every client-side read/write on tenants, leads, campaigns, and conversations to request.auth.uid matching the owning tenant, or to the is_admin custom claim for admin-only paths. | A security-rules unit test (or the Firestore emulator test suite) confirms a Tenant's client cannot read or write another tenant's documents, and a non-admin cannot read admin-only paths. |
| SEC-3 | All network traffic — client-to-server, and server-to-third-party (SMTP, IMAP, Groq, Google Maps) — uses TLS. | A network trace of any of these connections shows TLS in use; no plaintext HTTP or unencrypted SMTP/IMAP connection is permitted. |
| SEC-4 | Tenant-authored message bodies inserted into the outgoing email HTML template are escaped/sanitized before rendering. | A message body containing HTML/script-like text (test payload) is rendered as literal text in the sent email, not executed or used to alter the email's structure. |
| SEC-5 | AI prompts built from scraped, untrusted business data (name, address, review text) treat that data strictly as data, not as instructions the model should follow. | A test lead whose scraped business name/review text contains instruction-like phrasing (e.g. "ignore previous instructions") does not alter the scoring or message-generation behavior for that lead or any other. |
| SEC-6 | Admin dashboard access is verified server-side (the is_admin claim is checked in the backend function/API), not only gated in client-side UI routing. | Directly calling the admin data endpoint (bypassing the UI) as a non-admin authenticated user is still denied. |

## 13. Performance / Non-Functional Requirements

| ID | Requirement | Acceptance / Test Criteria |
|---|---|---|
| NFR-1 | A single lead-search click, for a batch at or under the configured per-click cap, returns a fully scored, ready-to-view lead table within 120 seconds under normal network conditions. | Timed end-to-end test from search submission to rendered, scored table completes within 120 seconds in at least 9 of 10 trials. |
| NFR-2 | Exactly 2 AI calls occur per search (BR-1) and exactly 1 per message-generation action (BR-2), regardless of lead count. | Admin usage dashboard counters increase by exactly these amounts per corresponding user action, verified over a sample of searches and message generations. |
| NFR-3 | Firestore reads for the lead table view are paginated (maximum 25 leads per page) and do not read the tenant's full lead collection on every page load. | Firestore read-count logging for a lead-table page load matches the page size, not the total collection size, for a tenant with more leads than one page. |
| NFR-4 | Real-time listeners (onSnapshot) are attached only to the currently open conversation thread and the active lead-table page, not to entire collections. | Code/architecture review confirms no onSnapshot listener is attached to a full leads or conversations collection without a bounding query. |
| NFR-5 | Outbound sends on a single channel for a single tenant do not exceed the configured maximum rate (BR-4 throttle). | A burst send test confirms no two consecutive sends on the same channel are spaced closer than the configured minimum delay. |
| NFR-6 | Incoming messages (WhatsApp or Email) appear in the unified inbox within a defined polling/listener interval (MVP target: within 60 seconds of arrival). | A timed test message arrives in the inbox view within 60 seconds of being sent to the connected number/mailbox, in at least 9 of 10 trials. |

## 14. Acceptance Criteria & Sign-Off Checklist

Every requirement in Sections 4–13 carries its own inline, testable acceptance criterion — this section is the condensed per-module checklist for a QA sign-off pass before MVP is considered done. Each line should be checked against the detailed requirement it summarizes before being marked complete.

- Lead Discovery (FR-1–7, EC-1): search runs end-to-end, respects per-click/per-day caps, de-duplicates correctly, handles zero-result searches gracefully.
- Lead Scoring (FR-8–12): every lead has a deterministic Opportunity Score and a batch-derived AI Score/problem summary from exactly one AI call per search.
- Outreach (FR-13–19, EC-4): message generation is one AI call per tenant-chosen lead, editable before send, correctly auto-assembled for email vs. raw for WhatsApp, and throttled.
- Unified Inbox (FR-20–24, EC-5, EC-8): both channels' replies land in the correct lead's thread, quote-stripped for email, with accurate unread counts.
- CRM (FR-25–28): status model is exactly the six defined values, transitions correctly on first send, and follow-up surfacing works off the configured threshold.
- Admin Dashboard (FR-29–30): usage figures match Firebase/Groq's own reporting, and access is correctly gated to the admin claim.
- Security (SEC-1–6): credential encryption, tenant data isolation, TLS everywhere, injection resistance, and server-side admin gating all verified.
- Performance (NFR-1–6): search latency, AI call counts, read pagination, listener scoping, send throttling, and inbox latency all within the stated bounds.
