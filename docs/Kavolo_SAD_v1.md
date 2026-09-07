# KAVOLO
### FIND | REACH | GROW

# System Architecture Document

*A genuinely $0-infrastructure MVP, entirely inside one Google Cloud / Firebase project*

Version 1.0 · September 2026
Prepared by: Devansh Joshi — UGBS (Unicorns Group of Business Solutions)

---

## 1. Overview & Guiding Principles

Kavolo's architecture is built around one constraint above all others: near-zero marginal cost per tenant. Every choice below is judged against that, and against a second, equally deliberate constraint — do not build more system than the current scale (one tenant, MVP) needs. Where a more "proper" enterprise pattern exists (microservices, message queues, a dedicated observability stack), it is named and explicitly deferred, not silently skipped — see Section 14.

- Bring-your-own credentials: each tenant connects their own SMTP+IMAP mailbox and their own WhatsApp number, so sending/storage never runs through a shared paid account.
- Managed, free-tier infrastructure: Firebase (Firestore + Auth) and Groq's free API tier carry the data and AI layers, so cost tracks usage, not headcount of features built.
- One stateless compute layer, one minimal stateful process, one database: Cloud Functions plus a single small VM plus a single Firestore project — not a distributed system, for a single-tenant MVP.

> **Honest cost note** — The plan's "$0/user" principle covers per-tenant marginal cost — Firestore reads/writes, Groq calls, sending. With the Cloud Functions + Compute Engine e2-micro split in Section 4/11, total infrastructure cost is now genuinely $0 at MVP scale — but this took real analysis, not an assumption: Section 11.1 shows why the obvious "just run it on Cloud Run" answer is actually more expensive (≈$20–45/month) than the tiny always-on VM this design uses instead.

## 2. Recommended Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast dev loop, single SPA serves both tenant and admin views; no framework overhead a solo/small team can't maintain. |
| Backend (compute) | Firebase Cloud Functions (2nd gen) | Genuinely part of Firebase; pay-per-invocation, scales to zero, no server to patch. Handles every request/schedule-driven piece: API endpoints, scraper orchestration, both AI calls, email sending, admin dashboard reads, and a scheduled IMAP-poll function (Section 11.1 explains why this replaces a persistent Node server for everything except one piece). |
| WhatsApp runtime | One Google Compute Engine e2-micro VM (Always Free tier), same GCP project as Firebase | The one thing that cannot be serverless: Baileys needs one continuously-open, authenticated WebSocket session. Google's Always Free e2-micro (1 instance/month, no expiry) keeps this genuinely $0 and in the same Google Cloud project/billing account as everything else — see Section 11.1 for why Cloud Functions/Cloud Run can't hold this connection economically. |
| Database | Cloud Firestore | Generous free tier, native real-time listeners power the live lead table and inbox with no extra plumbing, no separate DB server to run. |
| Auth | Firebase Authentication | Free to 50K MAU, integrates natively with Firestore Security Rules, supports custom claims for the admin role. |
| Scraper | Playwright (headless Chromium) | Network-response interception is more resilient to markup changes than DOM/CSS scraping (see plan doc). |
| AI | Groq API — 2 accounts (Account A: keywords + scoring, Account B: message generation) | Fast, cheap inference with a real free tier; splitting across 2 accounts roughly doubles free-tier headroom since limits are per-organization. |
| Email send | Nodemailer over the tenant's own SMTP | Standard, well-supported library; no shared sending account, so no shared deliverability reputation risk. |
| Email receive | IMAP (imapflow) on the tenant's own mailbox | Standard protocol, supports IDLE for near-real-time inbox updates without constant polling. |
| WhatsApp | Baileys (multi-device WebSocket protocol) | Only practical way to automate WhatsApp without the official Business API's per-conversation cost, which would break the $0/tenant principle. |
| Scheduler | node-cron (in-process) | Follow-up-threshold scans and daily-cap resets are lightweight, periodic jobs — a full job-scheduling service would be over-engineering at this scale. |
| Send throttling | A send_queue Firestore collection, drained by the always-on e2-micro VM | Throttling needs continuously-held state ("when did this tenant last send on this channel"), which stateless Cloud Functions can't hold in memory between invocations — the one persistent VM already needed for WhatsApp does this too, for both channels. A message broker (Redis/BullMQ) is deferred until real concurrent multi-tenant load requires more than this (Section 13). |
| Hosting (frontend) | Firebase Hosting | Already part of the Firebase project, free, and serves a static SPA build with no extra service to configure. |

## 3. Frontend Architecture

A single React SPA, not two separate applications for tenant and admin. Routes are split into a Tenant area (search, lead table, inbox, CRM, settings) and an Admin area (cost/usage dashboard), gated by the same Firebase Auth session and its `is_admin` custom claim.

- Reads that Firestore Security Rules already secure (a tenant's own leads, conversations, campaigns) go straight from the client via the Firestore SDK, using narrowly-scoped snapshot listeners (one open conversation, one lead-table page) — not a custom REST layer duplicating what the rules already protect.
- Writes that trigger real work (start a search, generate a message, send a message) go through backend API endpoints, never directly from client to Firestore — those actions must run the scraper, call Groq, or send via SMTP/Baileys server-side.
- No separate mobile app for MVP. The dashboard and inbox are built responsive; a WhatsApp-style chat UI works naturally on mobile web without a native app's build/release overhead.
- Client-side role routing (showing/hiding the Admin area) is a UX convenience only — it is not the security boundary. That boundary is enforced server-side (Section 7, Section 10).

## 4. Backend Architecture

Split by whether a piece of work can start, finish, and forget (stateless, request- or schedule-driven) or must hold something open continuously (stateful). Everything in the first group runs as Firebase Cloud Functions; the second group is small enough to be exactly two responsibilities, both held on one small always-on VM. This is not a microservices architecture — it is one stateless compute layer plus one minimal stateful process, chosen because the two genuinely have different hosting requirements, not because more services are inherently better.

### 4.1 Cloud Functions (stateless, request/schedule-driven)

| Function | Responsibility |
|---|---|
| API endpoints | Authenticated HTTP callable functions: start a search, generate a message, request a send, update lead status, read admin usage stats. Verify the Firebase ID token (and, for admin routes, the custom claim) on every call. |
| Scraper function | Orchestrates the keyword-generation AI call, drives Playwright against Google Maps (a Cloud Functions 2nd-gen instance can run a headless Chromium within its memory/timeout budget for a single capped-size search), applies network-response interception, de-duplicates against existing leads. |
| Scoring function | Computes the rule-based Opportunity Score (pure function, no AI) and runs the single batched AI Score / problem-summary call per search. |
| Message-generation function | Generates the personalized first message on demand (Account B) when a tenant requests it for one lead. |
| Send-request function | Validates and writes a job document to the send_queue Firestore collection when a tenant sends a (possibly edited) message — it does not send directly; see 4.2. |
| IMAP-poll function (scheduled) | Triggered every ~60 seconds by Cloud Scheduler: connects briefly to the tenant's IMAP mailbox, fetches unseen messages, quote-strips replies, writes to the conversations subcollection, and disconnects. Meets the SRS's own 60-second inbox-latency target (NFR-6) without needing a persistent IDLE connection. |
| Follow-up / cap-reset functions (scheduled) | node-cron's jobs become two scheduled Cloud Functions: nightly per-tenant daily-cap reset, periodic follow-up-threshold scan. |
| Admin function | Aggregates Firestore usage counters and logged Groq call counts into the cost/usage dashboard payload. |

### 4.2 Always-on e2-micro VM (stateful — exactly two jobs)

A single small Compute Engine VM (Section 11.1), doing only the two things that need continuously-held state and cannot be picked up and dropped between stateless function calls:

- Holds the tenant's Baileys WhatsApp session — the one connection in this whole system that must never fully close.
- Watches the send_queue Firestore collection and drains it with the required throttled delay between sends, on both channels (WhatsApp directly over the held socket; Email via Nodemailer) — because pacing sends requires remembering "when did this tenant last send," which a stateless function can't hold in memory between invocations.

Everything else this VM might have done (scraping, AI calls, IMAP, the API) deliberately stays on Cloud Functions instead, so this VM stays small, simple, and cheap enough to run on Google's Always Free tier (Section 11.1) rather than growing back into a full backend server.

## 5. Database

Cloud Firestore is the single data store. The full schema (tenants, leads, leads/{id}/conversations, campaigns — fields, types, and denormalization rules) is defined in the Kavolo SRS, Section 6, and is not repeated here; this section covers the architectural reasoning.

- Firestore over a relational database (e.g. Postgres) is a deliberate trade-off: a generous free tier and native real-time listeners remove the need for a separate live-update mechanism (WebSockets/polling) for the lead table and inbox, at the cost of weaker relational querying — mitigated by denormalizing exactly the fields the UI needs (last_message_preview, unread_count, and similar) rather than joining at read time.
- One database, not two: introducing a relational database alongside Firestore for reporting/analytics would add a sync problem for no benefit at MVP scale — deferred until a real analytical need (e.g. cross-tenant reporting at real scale) justifies it.
- Firestore Security Rules — not just backend code — are the primary access-control boundary on this data; see Section 7.

## 6. External APIs & Integrations

| Integration | Protocol / SDK | Notes |
|---|---|---|
| Groq (Account A) | REST, OpenAI-compatible client | Keyword generation + batched lead scoring. Exactly 2 calls per search regardless of lead count (SRS BR-1). |
| Groq (Account B) | REST, OpenAI-compatible client | Personalized first-message generation, exactly 1 call per tenant-chosen lead (SRS BR-2). |
| Google Maps | None (no official API) — Playwright browser automation | The official Places API's cheapest tier starts at $275/month with no meaningful free tier — incompatible with the $0/tenant principle, hence scraping instead. |
| SMTP | Standard protocol via Nodemailer | Tenant's own mailbox credentials; TLS/STARTTLS required. |
| IMAP | Standard protocol via imapflow | Tenant's own mailbox credentials; IDLE used where the provider supports it, polling fallback otherwise. |
| WhatsApp | Baileys (unofficial multi-device WebSocket protocol) | Tenant's own number, QR-paired; persistent socket held by the backend for as long as the tenant is connected. |
| Razorpay (Phase 3, not MVP) | REST API + webhooks | Subscriptions/UPI Autopay for billing — listed for architectural continuity with the roadmap, not implemented in MVP. |

## 7. Authentication & Authorization

### 7.1 Authentication
- Firebase Authentication (email/password or Google sign-in) is the only identity mechanism for human users (Tenant, Admin).
- SMTP, IMAP, and WhatsApp credentials are the tenant's own external service credentials — they authenticate the backend to those third-party services, not users to Kavolo, and are never returned to the client after initial save.

### 7.2 Authorization
- A Firebase custom claim (`is_admin`) distinguishes the Admin role; it is set only via the Firebase Admin SDK on the backend, never client-settable.
- Firestore Security Rules scope every client read/write to `request.auth.uid` matching the owning tenant, or to the `is_admin` claim for admin-only paths — enforced from day one even with a single tenant, so Phase 3 multi-tenant requires no rule rewrite.
- Backend API routes re-verify the ID token and, for admin routes, the custom claim, independently of the client — client-side route gating is a UX convenience, not the security boundary (defense in depth).
- Backend service jobs (scheduler, IMAP listener) run under the Firebase Admin SDK, which bypasses Security Rules by design; no client-callable endpoint is given equivalent unrestricted access.

## 8. System Components & Data Flow

A box-and-arrow diagram is better suited to a whiteboard than a Word table — happy to produce one separately (e.g. as a Whiteboard artifact) if useful. Below is the same information as an ordered data flow through the pipeline, which is unambiguous and directly testable against the SRS's functional requirements.

| # | Component | Action | Data touched |
|---|---|---|---|
| 1 | Client → API function | Tenant submits area + niche | New campaign request (not yet persisted) |
| 2 | Scraper function → Groq (A) | Keyword-generation call (1) | Generated keyword set |
| 3 | Scraper function → Playwright → Maps | Scrape matching businesses | Raw business records (network-intercepted) |
| 4 | Scraper function → Firestore | Write lead docs; compute Opportunity Score inline | leads/{id} created, per-tenant per-click/per-day counters incremented |
| 5 | Scoring function → Groq (A) | Batched scoring call (1, all leads from this search) | ai_score + problem_summary per lead |
| 6 | Scoring function → Firestore | Update lead docs with scoring output | leads/{id} updated |
| 7 | Firestore → Client | Real-time listener pushes update | Lead table renders scored leads |
| 8 | Client → API function | Tenant requests message generation for one lead | leadId |
| 9 | Message-gen function → Groq (B) | Personalized message call (1) | Draft message text |
| 10 | Client → Send-request function | Tenant sends (possibly edited) message | send_queue/{id} job document written |
| 11 | e2-micro VM → Nodemailer / Baileys | VM drains send_queue with the required throttled delay, sends over chosen channel | Outbound network request; send_queue/{id} marked processed |
| 12 | e2-micro VM → Firestore | Write outbound conversation doc; update denormalized lead fields; status New→Contacted | conversations/{id}, leads/{id} fields |
| 13 | IMAP-poll function (email) or e2-micro VM's held socket (WhatsApp) | Scheduled poll fetches unseen mail, or the WhatsApp socket receives a message directly | Raw inbound message |
| 14 | Same → Firestore | Quote-strip (email); write inbound conversation doc; increment unread_count | conversations/{id}, leads/{id} fields |
| 15 | Firestore → Client | Real-time listener pushes update | Inbox thread updates live |

## 9. Storage

- Firestore is the only data store needed for MVP — there is no user-uploaded binary content (images, videos, attachments) in scope, so a separate object-storage service (Cloud Storage/S3) is not introduced.
- Sensitive credentials (SMTP/IMAP passwords, the Baileys auth-state JSON bundle) are encrypted before being written into the tenant's Firestore document, using a server-held symmetric key (Node's built-in crypto, AES-256-GCM) kept in the backend's environment configuration — not a separate secrets-manager service (Vault, Google Secret Manager), which would be extra infrastructure for a single-tenant's worth of secrets. Revisit if/when Phase 3 brings many tenants' credentials under management.

## 10. Security

Full, testable security requirements are specified in the Kavolo SRS, Section 12 (SEC-1 through SEC-6). This section states the architectural mechanisms that satisfy them.

- Encryption at rest for all stored third-party credentials (Section 9).
- TLS in transit everywhere: Firebase SDKs use TLS by default; SMTP/IMAP connections are configured to require TLS/STARTTLS; Groq's API is HTTPS-only.
- Firestore Security Rules as the primary data-access boundary, independent of backend application code — a bug in the backend cannot expose one tenant's data to another via the client SDK.
- Secrets (both Groq API keys, the credential-encryption key) live in Cloud Functions' native Secret Manager integration for the functions, and in the VM's local environment file for the always-on process — never committed to source control.
- Prompt-injection resistance: scraped business text (names, addresses, review snippets) is inserted into AI prompts as clearly-delimited data, not concatenated in a way a model could mistake for system instructions.
- Outbound send throttling is enforced by the e2-micro VM draining the send_queue itself, not left as a policy documented only in this text — see Section 4.2.

## 11. Deployment Architecture

Every layer of Kavolo now runs inside the same Google Cloud project that Firebase itself lives in — Firestore, Auth, and Hosting are Firebase products by definition; Cloud Functions is a Firebase product; the one small VM below is plain Google Compute Engine, in that same project. There is no third-party hosting vendor (no Railway, Render, or Oracle) in this design — one platform, one bill, one console.

### 11.1 Why not just run everything on Cloud Run (the obvious "full Firebase" answer) — and what to use instead

Cloud Functions (2nd gen) is built on Cloud Run underneath, so the instinct "put the whole backend on Cloud Run" is reasonable — but it runs into two real problems for the one stateful piece, the WhatsApp connection, worth showing rather than asserting:

- Cloud Run's request/connection timeout caps at 60 minutes — a Baileys WhatsApp session would be forced to reconnect at least hourly. That's fragile (reconnect logic, brief gaps in receiving messages) and nudges WhatsApp's own anti-automation detection in a way a real, unbroken connection does not.
- Keeping a Cloud Run instance alive continuously (minInstances ≥ 1, so the socket and session state actually survive between calls) forces "instance-based" billing — you pay for CPU the whole time the instance exists, not just during a request. At Google's published rates ($0.000018/vCPU-second after a 240,000 vCPU-second/month free allowance), one always-on 1-vCPU instance costs roughly $42/month; even a fractional 0.5-vCPU instance is roughly $19/month. Both are meaningfully worse than the alternative below — Cloud Run is the wrong tool specifically for a connection that must never close, even though it is an excellent tool for everything in Section 4.1.

> **The fix: Google Compute Engine's Always Free e2-micro instance** — Google Cloud's Always Free tier includes 1 e2-micro VM per month, in the same project as Firebase, with no stated expiry on the offer. It is small (shared-core, ~1GB RAM) — plenty for holding one WebSocket session and draining a lightweight send queue, which is all Section 4.2 asks of it. This is the one non-serverless piece of the architecture, and it is genuinely $0, not a trade against a paid tier.

### 11.2 What runs where

| Layer | Runs on | Cost |
|---|---|---|
| Firestore + Auth | Firebase (fully managed) | Free tier, as costed in the plan doc |
| Frontend (React SPA) | Firebase Hosting | Free — static files, part of the same project |
| API / scraper / AI / scheduled IMAP-poll / admin | Firebase Cloud Functions (2nd gen) | Pay-per-invocation; expected to stay within or near Cloud Functions' own free tier at MVP (single-tenant, capped) volume |
| WhatsApp socket + send-queue draining | 1 Google Compute Engine e2-micro VM (Always Free) | $0, no expiry, same GCP project |

Net result: a genuinely $0-infrastructure MVP, entirely inside one Google Cloud/Firebase project — the earlier version of this document recommended a separate paid host (Railway/Render) or a separate-vendor free VM (Oracle) specifically because it modeled the backend as one monolithic always-on process; splitting stateless work from the one stateful connection removes that need.

### 11.3 CI/CD

Kept intentionally minimal: `firebase deploy` (Functions + Hosting + Firestore rules) from a single GitHub Actions workflow triggered on push to main, plus a one-time `gcloud compute` setup script for the e2-micro VM (it changes rarely — it only runs the WhatsApp client and queue-drainer, not application logic that iterates often). A multi-stage pipeline, separate staging environment, or blue-green deployment setup would be over-engineering for a single-tenant MVP with one developer.

## 12. Monitoring & Logging

No dedicated observability stack (Grafana, Datadog, ELK) — that is real over-engineering at this scale. The practical minimum:

- Structured logging (e.g. pino, or plain console output) from Cloud Functions is captured automatically by Cloud Logging — already built into the same Firebase/GCP project, viewable in the Firebase Console, no separate log-aggregation service to add.
- The e2-micro VM's logs (Baileys connection state, send-queue processing) are shipped to the same Cloud Logging via the standard Google Cloud Ops Agent — one log destination for the whole stack, not two.
- Firestore usage: the Firebase Console's own usage dashboard is already free and accurate; the in-app admin dashboard (SRS FR-29) reads the same underlying numbers programmatically for a tenant-facing view — it complements the console, it doesn't replace it.
- Groq usage: tracked by logging each API call to a Firestore usage-counter document at call time, since the admin dashboard needs same-day, per-account figures that are more immediate than relying solely on Groq's own account dashboard.
- Uptime: Cloud Functions report their own invocation health in the Firebase Console; the e2-micro VM is the one piece that can silently go down without a request to fail, so a free external checker (e.g. UptimeRobot's free tier) pinging a small health-check endpoint on that VM is worth having — it's the one always-on process left to watch.
- Error alerting: clear, greppable Cloud Logging entries plus Cloud Functions' own automatic retry/restart behavior is sufficient for MVP; a dedicated error-tracking service (Sentry and similar) is a reasonable next addition once there are real users depending on uptime, not a day-one requirement.

## 13. Scalability Path

The goal here is an architecture that grows by configuration and by adding well-understood pieces, not by rewriting what already works.

- Firestore's denormalized, subcollection-based schema (SRS Section 6) is the main scalability lever already built in — it keeps per-view reads small regardless of how many tenants or leads exist.
- Multi-tenant growth (Phase 3) is mostly a matter of more documents in already-tenant-scoped collections, not a new architecture — the tenants collection and Security Rules were designed for this from MVP, even with only one tenant today (see Section 7).
- Cloud Functions already scale horizontally by default — many tenants running searches concurrently just means more concurrent function invocations, not a capacity planning exercise, up to Cloud Functions' own concurrency limits.
- Introduce a real job queue (Redis + BullMQ, or Cloud Tasks) only when the send_queue Firestore-polling pattern becomes a measured bottleneck — many tenants sending concurrently through one e2-micro VM. Not built now, because it is an extra service to run and pay for that current scale does not need.
- When the WhatsApp/send-queue VM itself becomes the bottleneck (many tenants' sockets held in one place), shard tenants across a small number of e2-micro (or slightly larger) VMs by tenant ID — a configuration change to how tenants are assigned to a VM, not a re-architecture of the pattern itself.
- Contain shared AI cost as tenants grow via the already-planned per-tenant daily Groq-call cap, plus an optional bring-your-own-Groq-key toggle per tenant (Phase 3), so the platform's own 2 accounts don't become the bottleneck.
- WhatsApp sessions scale per tenant (each holds their own Baileys socket); one small VM can comfortably hold a meaningful number of concurrent sessions before sharding (above) becomes necessary — revisit with real numbers once Phase 3 has actual multi-tenant traffic to measure.

## 14. Explicitly Avoided (Non-Goals)

Named here on purpose, so they are recognized as deliberate decisions if questioned later, not oversights.

- No third-party hosting vendor (Railway, Render, Oracle) — everything runs inside the one Google Cloud/Firebase project, which turned out to be both simpler to manage and genuinely cheaper than the alternative once the stateless/stateful split (Section 4) was made explicit.
- No microservices split — one stateless Cloud Functions layer plus one minimal stateful VM is sufficient at this scale, chosen by what genuinely needs continuous state, not by a general preference for splitting services.
- No Kubernetes or container orchestration — a single small VM, with its own restart/health-check controls, is enough for the one process that needs to stay running.
- No message broker (Kafka/RabbitMQ) — a Firestore-backed send_queue holds until real concurrent load proves it insufficient (Section 13).
- No dedicated observability stack (Grafana/Datadog/ELK) — Cloud Logging (already included with Cloud Functions and the VM) plus Firebase's and Groq's own dashboards cover MVP needs (Section 12).
- No second (relational) database alongside Firestore — one database avoids a sync problem with no offsetting benefit yet.
- No separate native mobile app — a responsive web app covers the WhatsApp-style UX target.
- No dedicated secrets-manager service beyond what's already built in — Cloud Functions' native Secret Manager integration and the VM's local environment file are enough for a single/few-tenant scale.
- No multi-region deployment — a single region local to the primary user base is sufficient; Firestore, Cloud Functions, and the e2-micro VM can all be pinned to the same region (e.g. asia-south1) to minimize latency without adding redundancy complexity MVP doesn't need.
