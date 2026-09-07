# KAVOLO
### FIND | REACH | GROW

# Development Plan

*Setup → Backend → Database → Frontend → Integrations → Testing → Hardening → Deployment*

Version 1.0 · September 2026
Prepared by: Devansh Joshi — UGBS (Unicorns Group of Business Solutions)

---

## 1. Purpose & How to Use This Plan

This document turns the Kavolo PRD, SRS, System Architecture Document (SAD), and UI/UX Document into one ordered, buildable roadmap. It does not repeat those documents' content — it sequences it. Every task below cites the exact requirement, module, or screen it implements, so a task can be picked up and built without re-deriving scope from the other four documents each time.

- PRD → what to build and why, MVP scope boundary (Section 2 here recaps it).
- SRS → the testable requirement each task must satisfy (FR/BR/VAL/AUTH/AUTHZ/ERR/EC/SEC/NFR IDs, cited directly).
- SAD → which compute layer a backend task belongs to (Cloud Function vs. the e2-micro VM) and the data model it touches.
- UI/UX Document → the exact screen, component, state, and interaction each frontend task must match.

Read top to bottom once; after that, use Section 6 (task tables) as the working checklist and Section 9 (Definition of Done) as the bar for calling any task actually finished.

## 2. MVP Scope (Recap — Locked per PRD Section 5)

This plan builds exactly the MVP scope the PRD already locked — it does not re-litigate scope. Restated here so a task list can be checked against it directly.

### 2.1 In scope

- Single tenant (you), single Service Profile per account, chosen from exactly two profiles: Web Development and WhatsApp/AI Automation (both full-strength, Maps-only signals).
- Full pipeline: enter target → AI keyword-gen → Maps scrape → rule-based + AI scoring → lead table → on-demand personalized message → send via WhatsApp/Email → unified inbox → manual CRM status → manual follow-up reminders.
- Master Admin cost/usage dashboard (Firestore + Groq usage vs. free-tier ceilings) — the one Phase-1 admin feature, per PRD Section 5.1.
- All 8 screens from the UI/UX Document: Login, First-Run Setup, Dashboard/Search, Leads, Inbox, Follow-ups, Settings, Admin Usage.

### 2.2 Explicitly out of scope for this plan (PRD Section 10 — not tasked below)

- Multi-tenant onboarding, tiering, and Razorpay billing (Phase 3 in the planning doc) — no signup/payment flow is built in this plan; the single tenant's account is provisioned manually (Phase 0).
- Auto-send follow-ups (Phase 2 in the planning doc) — MVP follow-ups are a manual, tenant-triggered send from a surfaced list only (SRS FR-28).
- Instagram fine-signal scraping, Digital Marketing/SEO service profile, email open tracking — all deferred per the planning doc's §4b/§9 and PRD Section 10.
- Any additional Service Profile beyond the two named above, and the "more than one service on one account" forward-compatibility check (planning doc §8a) — noted as a future guard, not built now, since MVP never creates a second profile per tenant.

> **Why this matters for sequencing** — Because MVP scope is already this tight, almost every task in Section 6 is P0 (must-ship) — there is very little optional scope left inside the MVP boundary to triage during a time crunch. Section 4's priority tiers exist mainly to flag the handful of genuine P1 polish items and to keep P2/deferred items visibly out of the task list rather than silently dropped.

## 3. Milestones

Seven milestones, each with a concrete, demoable exit condition — not "90% done," but a specific thing that either works or doesn't.

| Milestone | Exit criteria (must be demonstrably true) | Covers phases |
|---|---|---|
| M0 — Setup | Repo, Firebase project, GCE VM, and secrets scaffolding exist. A trivial Cloud Function deploys and responds; the VM runs a trivial Node script and stays up after a reboot. | Phase 0 |
| M1 — Foundations | Firestore schema + Security Rules deployed and passing emulator tests. A tenant can sign up, lock a Service Profile, connect SMTP/IMAP (Test Connection passes), and pair WhatsApp end-to-end. Frontend shell + design system in place. | Phases 1–4 |
| M2 — Find Leads | A tenant can enter area+niche, get a keyword-generated Maps scrape, see leads with both an Opportunity Score and an AI Score/problem summary, in a sortable, paginated table. | Phase 5 |
| M3 — Outreach | A tenant can generate a personalized message for a lead, edit it, and send it over WhatsApp or Email with correct auto-assembly and throttling; lead status auto-flips to Contacted. | Phase 6 |
| M4 — Loop Closed | A reply on either channel appears in the correct lead's unified inbox thread within the 60-second target, quote-stripped for email, with unread counts behaving correctly. | Phase 7 |
| M5 — Feature Complete | Every SRS functional requirement (FR-1 through FR-30) is implemented and manually demoable, including CRM status/follow-ups and the admin cost/usage dashboard. | Phases 8–9 |
| M6 — Tested & Hardened | Every SRS acceptance criterion (SRS §14 sign-off checklist) passes; every UI/UX loading/error/empty state is implemented; SEC-1–SEC-6 mechanisms are verified live; no open blocker/major bugs. | Phases 10–12 |
| M7 — Launched | Production deploy is live on Firebase Hosting under the custom domain, Cloud Functions and the VM are running in production, the admin dashboard confirms $0 cost against a real end-to-end cycle, and the VM auto-restarts on crash/reboot. | Phase 13 |

## 4. Priorities

A simple three-tier scheme, applied per task in Section 6's tables.

| Priority | Meaning | Examples |
|---|---|---|
| P0 | MVP-critical. The system is not the MVP described in the PRD without this. Cannot slip past M5. | Scraper, both scoring layers, message generation, send pipeline, unified inbox, CRM status, admin usage dashboard, all 8 core screens, Security Rules. |
| P1 | Improves the MVP but the product is still honestly usable without it at launch. Fine to slip to just after M7 if time is tight. | Full responsive/mobile polish beyond a functional baseline, motion/transition polish (UI/UX §12), non-blocking visual refinements found during Phase 10. |
| P2 | Explicitly out of MVP scope (Section 2.2). Not tasked in Section 6 at all — listed only so it is never silently reintroduced without a decision. | Multi-tenant billing, auto-send follow-ups, Instagram fine-signal scraping, additional Service Profiles. |

In practice, almost every task below is P0 because the PRD already narrowed MVP scope aggressively — Section 2.1 is the real scope, not a wish list. P1 tags appear only inside Phase 10 (polish) where a genuine "good enough for launch vs. ideal" line exists.

## 5. Phase Dependency Overview

Read as a directed chain: a phase generally cannot start in earnest until its listed dependency phase reaches a working state (not necessarily 100% polished, but functionally present). Phases 8 and 9 can run in parallel with each other; so can Phases 1, 2, and 4 early on, since they touch different parts of the stack.

| Phase | Depends on | Why |
|---|---|---|
| 0 — Setup | None | Nothing else can start without a repo, a Firebase project, and the VM provisioned. |
| 1 — Data Layer | Phase 0 | Needs the Firebase project to exist before Firestore schema/rules can be deployed. |
| 2 — Auth Foundations | Phase 0 | Needs the Firebase project; independent of Phase 1's schema work. |
| 3 — Onboarding & Connections | Phases 1, 2 | Writes tenant config into Firestore (Phase 1) and requires a logged-in user (Phase 2). |
| 4 — Frontend Scaffold | Phase 0 | Independent of backend phases; can run in parallel with 1–3. |
| 5 — Lead Discovery & Scoring | Phases 3, 4 | Needs a locked Service Profile (from onboarding) and a frontend shell to render into. |
| 6 — Outreach | Phase 5 | Needs problem_summary from scoring and a lead to act on. |
| 7 — Unified Inbox | Phases 3, 6 | Needs connected SMTP/IMAP/WhatsApp (Phase 3) and at least one outbound conversation to reply to (Phase 6). |
| 8 — CRM & Follow-ups | Phase 7 | Follow-up surfacing depends on last_message_at, which Phase 7 denormalizes. |
| 9 — Admin Dashboard | Phases 5, 6 | Needs real Firestore/Groq usage to display — built once usage-generating features exist. |
| 10 — Cross-Cutting Polish | Phases 5–9 | A states/accessibility/responsive pass over screens that must already exist. |
| 11 — Testing | Phase 10 | Full-system testing needs the polished, feature-complete build. |
| 12 — Bug Fixing & Hardening | Phase 11 | Fixes what testing finds; cannot precede it. |
| 13 — Deployment & Launch | Phase 12 | Only ships once blockers/majors are resolved and hardening is verified. |

## 6. Detailed Task Breakdown

Each task lists an ID, what it is, what it depends on, its priority, and the exact PRD/SRS/SAD/UI-UX reference it implements — so no task requires guessing scope from memory of the other documents.

### Phase 0 — Project Setup & Environment

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 0.1 | Create GitHub repo, branch strategy (main + short-lived feature branches), .gitignore, README. | — | P0 | N/A — process setup |
| 0.2 | Create the Firebase project (single project/environment for MVP — no separate staging, per SAD Section 14); enable Firestore, Auth, Hosting, Cloud Functions. | 0.1 | P0 | SAD §2, §11 |
| 0.3 | Provision the one GCE e2-micro VM (Always Free) in the same GCP project; base OS + Node.js runtime; SSH access. | 0.2 | P0 | SAD §4.2, §11.1 |
| 0.4 | Scaffold repo structure: /frontend (React+Vite+Tailwind), /functions (Cloud Functions), /vm (Baileys + queue-drainer service). | 0.1 | P0 | SAD §3, §4 |
| 0.5 | Configure secrets handling: Cloud Functions Secret Manager bindings for Groq keys; VM local .env for Groq key + credential-encryption key. | 0.2, 0.3 | P0 | SAD §9, §10, SRS SEC-3 |
| 0.6 | Create Groq Account A and Account B; obtain API keys. | — | P0 | SRS BR-1, BR-2 |

### Phase 1 — Data Layer & Security Rules

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 1.1 | Implement Firestore schema: tenants, leads, leads/{id}/conversations, campaigns, exactly as fielded in the SRS. | 0.2 | P0 | SRS §6 (full data model) |
| 1.2 | Write Firestore Security Rules: tenant-scoped read/write via request.auth.uid, is_admin-claim-gated admin paths. | 1.1 | P0 | SRS AUTHZ-1–3, SAD §7.2 |
| 1.3 | Create composite indexes for lead-table sort/filter (opportunity_score, ai_score, status) and the follow-up query (status + last_message_at). | 1.1 | P0 | SRS FR-12, FR-27 |
| 1.4 | Write a fixture/seed script for local emulator testing (one fake tenant, sample leads at varied statuses/scores). | 1.1 | P0 | Supports Phase 11 testing |

### Phase 2 — Auth Foundations

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 2.1 | Enable Firebase Authentication: email/password and Google sign-in. | 0.2 | P0 | SRS AUTH-1–3, SAD §7.1 |
| 2.2 | Set the is_admin custom claim for the one MVP admin account (one-time Admin SDK script — no admin-invite UI needed at single-tenant scale). | 2.1 | P0 | SRS AUTHZ-2, FR-30 |
| 2.3 | Backend: ID-token verification middleware applied to every callable Cloud Function. | 2.1, 0.4 | P0 | SRS AUTH-2, SAD §7.2 |
| 2.4 | Frontend: Login screen. | 2.1, 4.3 | P0 | UI/UX §7.1 |

### Phase 3 — Onboarding & Connections

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 3.1 | Backend: save-tenant-config function — encrypts SMTP/IMAP credentials (AES-256-GCM) before writing to Firestore; sets service_profile_locked = true on first save. | 1.1, 1.2 | P0 | SRS BR-3, EC-3, SEC-1; SAD §9 |
| 3.2 | Backend: Test Connection function — verifies SMTP send capability + IMAP login without sending a real message. | 3.1 | P0 | SRS VAL-2 |
| 3.3 | Backend: WhatsApp QR-pairing flow — VM generates a Baileys QR and writes pairing status to a Firestore status doc the frontend polls. | 0.3, 3.1 | P0 | SAD §4.2; UI/UX §7.2 step 4 |
| 3.4 | Frontend: First-Run Setup wizard (Service Profile lock confirmation, email template, SMTP/IMAP + Test Connection, WhatsApp QR). | 2.4, 3.1–3.3 | P0 | UI/UX §7.2 |
| 3.5 | Frontend: Settings screen — same four sections, editable post-onboarding; Service Profile shown locked/read-only with explanatory copy. | 3.4 | P0 | UI/UX §7.7 |

### Phase 4 — Frontend Scaffold & Design System

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 4.1 | Set up React + Vite + Tailwind; wire the color/typography/spacing tokens into the Tailwind config. | 0.4 | P0 | UI/UX §2–4; color-tokens.css |
| 4.2 | Build the core component library: Button, Input/Textarea, Score badge, Status pill, Chat bubble, Table, Slide-over drawer, Modal, Toast, Connection status dot, Skeleton loader. | 4.1 | P0 | UI/UX §8 |
| 4.3 | App shell: persistent left sidebar, top bar, role-gated routing (Tenant vs. Admin). | 4.2, 2.3 | P0 | UI/UX §5 |
| 4.4 | Baseline responsive behavior for the shell across desktop/tablet/mobile breakpoints. | 4.3 | P1 | UI/UX §13 |

### Phase 5 — Lead Discovery & Scoring (SRS Module A + B)

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 5.1 | Backend: keyword-generation Cloud Function — one Groq Account A call from area+niche input. | 3.1, 0.6 | P0 | SRS FR-1, FR-2 |
| 5.2 | Backend: Playwright scraper function with network-response interception against Google Maps; enforces per-click/per-day caps and de-duplication. | 5.1 | P0 | SRS FR-3, FR-4, FR-5, FR-6, FR-7 |
| 5.3 | Backend: rule-based Opportunity Score computation (pure function, no AI, per Service Profile signal set). | 5.2 | P0 | SRS FR-8 |
| 5.4 | Backend: single batched AI-scoring Cloud Function — one Groq Account A call scoring every lead from the search. | 5.3 | P0 | SRS FR-9, FR-10, FR-11 |
| 5.5 | Frontend: Dashboard/Search screen — search card, 3 stat tiles, recent searches, up-to-2-minute loading state. | 4.3, 5.1–5.4 | P0 | UI/UX §7.3, §11 |
| 5.6 | Frontend: Leads table screen — full table, status filter tabs, pagination, sort by either score, loading/empty/error states. | 5.4, 4.2 | P0 | UI/UX §7.4, §11; SRS FR-12 |
| 5.7 | Frontend: Lead Detail slide-over drawer (view-only portion; composer built in Phase 6). | 5.6 | P0 | UI/UX §7.4 |

### Phase 6 — Outreach (SRS Module C)

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 6.1 | Backend: message-generation Cloud Function — one Groq Account B call per tenant-requested lead, grounded on problem_summary. | 5.4, 0.6 | P0 | SRS FR-13, FR-14 |
| 6.2 | Backend: email auto-assembly logic — greeting+body+signature for first message, body+signature thereafter. | 3.1 | P0 | SRS FR-16, FR-17 |
| 6.3 | Backend: send-request function — writes a job to send_queue; does not send directly. | 6.1, 6.2, 1.1 | P0 | SRS FR-15, FR-18 |
| 6.4 | VM service: send_queue drainer with randomized throttle delay between consecutive sends on the same channel; sends via Nodemailer or the held Baileys socket. | 3.3, 6.3 | P0 | SRS FR-19, BR-4; SAD §4.2 |
| 6.5 | Backend: on confirmed send — write the outbound conversation doc, update denormalized lead fields, flip status New→Contacted. | 6.4 | P0 | SRS FR-23, FR-26 |
| 6.6 | Frontend: Message composer (inside the Lead Detail drawer) — Generate Message, channel toggle, email preview, Send. | 5.7, 6.1–6.3 | P0 | UI/UX §7.4.1 |

### Phase 7 — Unified Inbox (SRS Module D)

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 7.1 | Backend: scheduled IMAP-poll Cloud Function (~60s via Cloud Scheduler) — fetch unseen mail, quote-strip, write conversation doc. | 3.1, 3.2 | P0 | SRS FR-20, FR-21, FR-22; NFR-6 |
| 7.2 | VM service: Baileys incoming-message listener on the already-held socket. | 3.3 | P0 | SRS FR-20, FR-21 |
| 7.3 | Backend: denormalize last_message_preview/at/channel and unread_count on every inbound/outbound event. | 7.1, 7.2, 6.5 | P0 | SRS FR-23 |
| 7.4 | Frontend: Inbox screen — two-pane messaging UI, WhatsApp-style bubbles for both channels, reused composer, unread-clears-on-open, aria-live region. | 4.2, 7.3 | P0 | UI/UX §7.5, §14; SRS FR-24 |

### Phase 8 — CRM & Follow-ups (SRS Module E)

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 8.1 | Backend: status-update function enforcing exactly the six allowed values. | 1.1 | P0 | SRS FR-25 |
| 8.2 | Backend: follow-up query — non-terminal status + last_message_at older than the configured threshold. | 7.3 | P0 | SRS FR-27, BR-6 |
| 8.3 | Frontend: one shared status-dropdown component, used from the Leads table row, Lead Detail drawer, and Inbox thread header. | 5.6, 5.7, 7.4, 8.1 | P0 | UI/UX §9.4 |
| 8.4 | Frontend: Follow-ups screen — list + pre-filled composer modal (reuses 6.6's composer). | 8.2, 6.6 | P0 | UI/UX §7.6; SRS FR-28 |

### Phase 9 — Admin Dashboard (SRS Module F)

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 9.1 | Backend: usage-counter logging — increment a Firestore counter on every Groq call; read Firestore's own read/write counters. | 5.1, 5.4, 6.1 | P0 | SRS FR-29 |
| 9.2 | Backend: admin aggregation function gated by the is_admin claim. | 9.1, 2.2 | P0 | SRS FR-30, AUTHZ-2 |
| 9.3 | Frontend: Admin Usage Dashboard screen — 4 stat cards with progress bars, activity table. | 4.3, 9.2 | P0 | UI/UX §7.8 |

### Phase 10 — Cross-Cutting Polish

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 10.1 | Fill any gap against the UI/UX loading/error/empty state table for every screen built in Phases 5–9. | Phases 5–9 | P0 | UI/UX §11 |
| 10.2 | Accessibility pass on the built UI: contrast re-check, keyboard nav + focus trapping, aria-live, alt text, 44×44px touch targets. | 10.1 | P0 | UI/UX §14 |
| 10.3 | Responsive pass: verify tablet/mobile breakpoint behavior (bottom tab bar, card-based mobile lead list, single-pane inbox). | 10.1, 4.4 | P1 | UI/UX §13 |
| 10.4 | Motion/interaction pass: transition durations, optimistic send UI, skeleton-matches-content. | 10.1 | P1 | UI/UX §12 |

### Phase 11 — Testing

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 11.1 | Unit tests: Opportunity Score calculation, email auto-assembly, status-transition validation, quote-stripping. | 5.3, 6.2, 8.1, 7.1 | P0 | SRS FR-8, FR-16/17, FR-25, FR-22 |
| 11.2 | Integration tests on the Firebase emulator: Security Rules (tenant isolation, admin gating), schema validations. | 1.2 | P0 | SRS AUTHZ-1–3, VAL-1–6 |
| 11.3 | End-to-end pass against every SRS module's acceptance criteria, mirroring the SRS §14 sign-off checklist exactly. | Phase 10 | P0 | SRS §14 (all FR/NFR) |
| 11.4 | Manual real-world test: one real Maps search, one real SMTP/IMAP round-trip, one real WhatsApp pairing+send+reply — using a secondary/burner WhatsApp number, not the tenant's primary, to absorb ban risk. | Phase 10 | P0 | SAD/plan-doc Baileys ban risk |
| 11.5 | Edge-case pass: zero-result search, daily/per-click cap hit, WhatsApp disconnect mid-session, SMTP/IMAP auth failure. | 11.3 | P0 | SRS EC-1, ERR-4, ERR-5, VAL-2 |

### Phase 12 — Bug Fixing & Hardening

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 12.1 | Triage every defect from Phase 11 (GitHub Issues is sufficient at this scale) by severity: blocker / major / minor. | Phase 11 | P0 | N/A — process |
| 12.2 | Fix all blocker and major defects; minor defects may move to a post-launch punch list only with explicit sign-off. | 12.1 | P0 | N/A — process |
| 12.3 | Regression pass: re-run the full Phase 11 suite after fixes, not just the previously failing cases. | 12.2 | P0 | N/A — process |
| 12.4 | Security hardening verification: confirm SEC-1–SEC-6 are actually true in the built system, not just designed for. | 12.3 | P0 | SRS SEC-1–6 |

### Phase 13 — Deployment & Launch

| ID | Task | Depends on | Priority | Reference |
|---|---|---|---|---|
| 13.1 | Deploy Firestore Security Rules and indexes to the production project. | 12.4 | P0 | SAD §11.3 |
| 13.2 | Deploy Cloud Functions (firebase deploy --only functions); verify each function cold-starts correctly. | 13.1 | P0 | SAD §11.2, §11.3 |
| 13.3 | Deploy the frontend to Firebase Hosting; connect the custom domain (DNS verification + automatic SSL). | 13.2 | P0 | Plan doc §0/§10 (custom domain on Firebase) |
| 13.4 | Deploy the VM service via the one-time gcloud compute setup script; run it as a systemd service so it survives a reboot, not a manual foreground process. | 13.1 | P0 | SAD §11.3, §4.2 |
| 13.5 | Set up one external uptime check (e.g. UptimeRobot free tier) against a small health-check endpoint on the VM. | 13.4 | P0 | SAD §12 |
| 13.6 | Run the go-live checklist (Section 9's Release DoD) before calling MVP launched. | 13.1–13.5 | P0 | Section 9 below |
| 13.7 | Post-launch: run one real search + one real outreach cycle as the actual tenant, watching the admin cost dashboard live to confirm the $0 claim in production. | 13.6 | P0 | SRS FR-29; SAD §0 cost principle |

## 7. Testing Strategy

Four layers, each catching a different class of defect; none is a substitute for the others.

- Unit tests — pure logic with no external dependency: Opportunity Score math, email assembly rules, status-transition validation, quote-stripping. Fast, run on every commit.
- Integration tests (Firebase emulator suite) — Security Rules and Firestore schema validations, run without touching real Firestore or costing a real read/write.
- End-to-end tests — the full pipeline through real (or sandboxed) Groq calls, a real Maps scrape, real SMTP/IMAP, and Baileys against a secondary WhatsApp number, run against the SRS §14 sign-off checklist module by module.
- Manual exploratory testing — a human working through each of the 8 screens' loading/error/empty states (UI/UX §11) and accessibility checklist (UI/UX §14), since some of this genuinely needs a person looking at the screen, not an assertion.

A secondary/burner WhatsApp number is used for all outreach-sending tests specifically because the SAD and planning doc both flag Baileys ban risk from bulk/automated-looking behavior — testing should never risk the tenant's primary connected number.

## 8. Bug Fixing Process

- Every defect is logged (GitHub Issues, no dedicated bug tracker needed at this scale) with: what was expected (cite the FR/screen spec it violates), what actually happened, and reproduction steps.
- Severity is assigned at triage time: Blocker (breaks a P0 flow entirely, e.g. sends never leave the queue), Major (a P0 flow works but produces wrong/incomplete results, e.g. wrong Opportunity Score), Minor (cosmetic or edge-case, e.g. a skeleton loader flashes briefly).
- A fix is not "done" until its root cause is identified — patching the symptom without understanding why the SRS acceptance criterion failed risks the same bug reappearing elsewhere in the pipeline.
- Every fix gets a regression check: re-run the specific failing test, and spot-check the two or three features most likely to share the same code path.
- No blocker or major defect is deferred past Phase 12 without explicit tenant (your) sign-off that it's acceptable for launch — silence is not sign-off.

## 9. Definition of Done

### 9.1 Feature-task DoD (applies to every task in Section 6)
- Implements exactly the cited FR/BR/UI-UX reference — not more, not less (scope creep is a common source of untested edge cases).
- Passes its own acceptance criterion from the SRS, where one exists, verified manually or by an automated test.
- Non-trivial logic has a unit test (Section 7).
- Any Firestore schema or Security Rule change is reflected in SRS §6/§12 conventions and covered by an emulator test.
- Matches the UI/UX Document's spec for its screen/component, including the loading, error, and empty states listed for that screen (UI/UX §11) — a feature that only handles the happy path is not done.
- No new console errors/warnings introduced; no accessibility regression (contrast, keyboard nav, focus) on the screen touched.

### 9.2 Bug-fix DoD
- Root cause documented, not just the patched symptom.
- Verified fixed in the same environment/conditions it was originally found in.
- A regression test exists where the bug class is realistically repeatable.

### 9.3 Milestone DoD
- Every task in that milestone's phases meets the Feature-task DoD above.
- The milestone's exit criterion (Section 3's table) is demonstrated live, not asserted from memory.
- No open blocker or major bug is tagged against that milestone's scope.

### 9.4 Release (MVP Launch) DoD
- Every SRS functional and non-functional requirement (FR-1–FR-30, NFR-1–6) passes per the SRS §14 sign-off checklist.
- Every SAD security mechanism (SEC-1–SEC-6) is verified live in production, not just designed on paper.
- Every UI/UX Document screen implements its full loading/error/empty state table (UI/UX §11) and passes the accessibility checklist (UI/UX §14).
- The admin dashboard confirms $0 infrastructure cost against at least one real, complete end-to-end cycle (search → score → message → send → reply) run in production.
- The custom domain is live with automatic SSL on Firebase Hosting, and the e2-micro VM is confirmed to auto-restart after a crash or reboot without manual intervention.

## 10. After MVP — Where This Plan Hands Off

This plan stops at a launched, $0-cost, single-tenant MVP (M7). What comes after is already scoped in the Kavolo planning doc's Phase 2 (auto-send follow-ups, email open tracking, lead filtering by acceptance score) and Phase 3 (multi-tenant onboarding, Service Profile lock + Razorpay Subscriptions billing, per-tenant AI-call caps, full Master Admin Portal build-out) — not repeated here to avoid two documents drifting out of sync. Start Phase 2 planning only once M7's real-world usage (Section 9.4) has run long enough to surface anything the MVP got wrong.
