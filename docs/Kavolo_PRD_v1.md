# KAVOLO
### FIND | REACH | GROW

# Product Requirements Document

*AI-assisted lead discovery and outreach for local-service freelancers and agencies*

Version 1.0 · September 2026
Prepared by: Devansh Joshi — UGBS (Unicorns Group of Business Solutions)

---

## 1. Problem Statement

Freelancers and small agencies selling local-business services (web development, WhatsApp/AI automation, social media management, and similar) currently find and pursue clients through slow, manual, and disconnected work: searching Google Maps by hand, judging each business's need subjectively, writing outreach messages one at a time with no personalization at scale, and tracking replies across separate WhatsApp chats, email inboxes, and spreadsheets.

Existing lead-generation SaaS tools (Apollo, Clay, Instantly, and similar) solve parts of this, but are priced in USD per seat — out of reach for solo freelancers and small agencies in price-sensitive markets — and none of them combine Google Maps prospecting, AI-driven scoring, and WhatsApp-first outreach (the dominant business-communication channel in this market) into a single affordable pipeline.

Kavolo closes this gap: a lead-generation and outreach system built around a genuinely near-zero operating cost per user (bring-your-own sending credentials, free-tier infrastructure), so it can be priced at ₹0–₹499/month and still work as a real business — starting as an internal tool for UGBS/Leaf Marketing's own client acquisition, then offered to other freelancers.

## 2. Target Users

### Primary — Internal user (MVP)
Devansh / UGBS & Leaf Marketing: a student-led digital agency and its partner influencer-marketing arm, currently prospecting local businesses manually for web development, AI automation/WhatsApp bot, and digital marketing services.

### Secondary — Resale users (post-MVP)
Independent freelancers and small agencies offering similar local-business services, who need a prospecting and outreach tool but cannot justify enterprise lead-gen pricing. Same product, white-labelable, each tenant configuring their own target niche and channels.

## 3. Goals

- Cut the time to produce a qualified, ranked batch of local-business leads from hours of manual searching to minutes.
- Improve cold-outreach reply rates by replacing generic templates with AI-personalized first messages grounded in each lead's actual, observable problem.
- Give one unified place to see and respond to every lead conversation, regardless of whether the reply came by WhatsApp or email.
- Keep platform operating cost near $0 per user (bring-your-own credentials, free-tier infrastructure) so the product remains viable at ₹99–₹499/month pricing.
- Validate the entire pipeline on UGBS/Leaf Marketing's own lead generation before packaging it for resale to other freelancers.

## 4. Core Features (Full Product Vision)

The complete feature set Kavolo is designed to reach across all phases. Section 5 defines exactly which of these ship in the MVP.

| Feature | Description |
|---|---|
| Location + niche lead discovery | Enter an area and business niche; Google Maps is scraped for matching businesses (Playwright, network-response interception). |
| AI keyword generation | One AI call turns the raw area+niche input into an optimized search query set for the scraper. |
| Service Profiles | Per-campaign setting (Web Development, WhatsApp/AI Automation, Social Media Management, Video Editing, Digital Marketing/SEO, Custom) that changes what "good lead" means, the scoring signals used, and the outreach angle. |
| Two-layer lead scoring | Rule-based Opportunity Score (instant, $0, computed at scrape time) plus a single batched AI call producing a Score/10 and problem summary for every lead found in that search. |
| AI personalized first message | One AI call per lead the user actually chooses to contact, generating a message that references that lead's specific, observed problem. |
| Multi-channel send | Send the generated (or edited) message over WhatsApp (via the tenant's own number, Baileys) or Email (via the tenant's own SMTP), with mandatory throttling. |
| Unified inbox | WhatsApp and email replies for a lead appear in one thread; email is handled with WhatsApp-style UX — tenant types only the message body, subject/greeting/signature are auto-assembled. |
| CRM pipeline tracking | Status per lead: New → Contacted → Replied → Interested → Converted/Lost. |
| Follow-up automation | Template-based (no AI) reminders/auto-sends for leads stuck at a status for N days. |
| Tiered billing (Razorpay) | Free/Basic/Standard/Pro subscription tiers with UPI Autopay for recurring billing (post-MVP). |
| Master Admin Portal | Operator-only view of cost/usage against free-tier ceilings, tenant health, and (later) billing overview. |

## 5. MVP Scope (v1)

The MVP is intentionally narrow: a single-tenant (Devansh/UGBS only) working pipeline that proves the core value proposition — find, score, personalize, send, and track — at genuinely $0 infrastructure cost, before any multi-tenant, billing, or resale machinery is built.

### 5.1 In scope for MVP

- Single tenant only — no signup flow, no multi-tenant onboarding, no Service Profile locking (all Phase 3 concerns).
- Two Service Profiles at launch: Web Development and WhatsApp/AI Automation — the two with strong, free, Maps-only signals. All other profiles (Social Media Management, Video Editing, Digital Marketing/SEO, Custom) are deferred past MVP even where technically free to add, to keep the surface to test and support minimal.
- Pipeline: enter area + niche → AI keyword generation (1 call) → Google Maps scrape → two-layer scoring (Opportunity Score + 1 batched AI call for Score/10 and problem summary) → sortable/filterable lead table.
- On-demand AI-personalized first message generation, one call per lead the user actively chooses to contact (not per lead scraped).
- Manual send via WhatsApp (Baileys, one connected number) or Email (one connected SMTP+IMAP mailbox), with throttling.
- Unified inbox merging WhatsApp and email replies per lead, with the WhatsApp-style email UX (body-only composing, auto-assembled subject/greeting/signature, quote-stripped incoming replies).
- Manual CRM status updates (New → Contacted → Replied → Interested → Converted/Lost).
- Basic follow-up reminder (surfaces which leads have gone quiet) — manually triggered send, not automatic.
- Master Admin cost/usage dashboard only: Firestore reads/writes/storage and Groq usage (both accounts) against free-tier ceilings, for the single tenant.

### 5.2 Explicitly deferred (see Section 10 for the full list)

Multi-tenant onboarding, Razorpay billing/tiers, auto-send follow-ups, email open tracking, Instagram-based signals, the remaining Service Profiles, and the rest of the Master Admin Portal are out of scope for v1 — see Section 10.

## 6. User Stories (MVP)

| # | As a... | I want to... | So that... |
|---|---|---|---|
| US-1 | freelancer | enter an area and a business niche | the system finds relevant local businesses automatically instead of me searching Maps by hand |
| US-2 | freelancer | see leads automatically scored and ranked (Opportunity Score + AI Score) | I know which businesses to contact first without researching each one myself |
| US-3 | freelancer | see a short AI-written problem summary per lead | I understand why a lead scored the way it did before I message them |
| US-4 | freelancer | generate a personalized first message for a specific lead on demand | my outreach references their actual situation instead of reading as a mass template |
| US-5 | freelancer | send that message over WhatsApp or Email with one click | I don't have to leave the platform or manually assemble a formal email |
| US-6 | freelancer | see every reply — WhatsApp or email — in one thread per lead | I never lose context switching between apps or miss a response |
| US-7 | freelancer | reply to a lead by typing only the message body (for email) | outreach and replies feel as fast as a WhatsApp conversation, not formal email writing |
| US-8 | freelancer | manually update a lead's pipeline status | I always know where each prospect stands, from first contact to converted or lost |
| US-9 | freelancer | get a reminder when a lead has gone quiet for N days | I don't lose a warm prospect simply because I forgot to follow up |
| US-10 | operator (admin) | see today's Firestore and Groq usage against free-tier limits | I can confirm the system is actually running at $0 cost before scaling it to more tenants |

## 7. Success Metrics (MVP)

| Metric | Target / Definition of success |
|---|---|
| Infrastructure cost | $0 actual spend at MVP usage volume, confirmed via the admin cost/usage dashboard against Firestore and Groq free-tier ceilings. |
| Time-to-lead-list | Under 2 minutes from submitting area + niche to a scored, ready-to-contact table for a capped batch (≈10–15 leads). |
| Outreach quality (qualitative) | AI-personalized first messages are judged, on manual review, to reference a lead's real, specific situation — not generic boilerplate — for at least 90% of generated messages. |
| Reply-rate baseline | Reply rate on AI-personalized outreach is tracked from week 1 and compared against Devansh's prior manual/generic outreach reply rate as the baseline (no pre-existing benchmark exists). |
| Inbox reliability | 100% of WhatsApp and email replies sent to the connected number/mailbox during MVP testing are correctly captured and threaded in the unified inbox, with no lost or misattributed messages. |
| Scraper reliability | ≥90% of scrape runs during the MVP testing period complete without failure, surfacing Maps-side breakage early rather than silently. |
| Pipeline throughput | Leads found → contacted → replied → converted counts are visible and trending upward week over week during MVP use. |

## 8. Assumptions

- Devansh (the sole MVP tenant) provides one working SMTP+IMAP mailbox and one spare WhatsApp number for Baileys pairing before pipeline testing begins.
- Google Maps' current DOM/network-response structure remains scrapeable, without major anti-bot changes, for the duration of the MVP build and initial test window.
- Groq's free tier (across the two accounts already in use for lead-finding and chat) is sufficient for MVP-scale usage, given per-click and per-day lead caps.
- Manual status tracking and a manually-triggered follow-up reminder are sufficient to prove the core value proposition; full automation is not required to validate the MVP.
- Narrowing MVP to two Service Profiles (rather than all Phase-1 profiles originally planned, including the coarse-signal Social Media/Video Editing profiles) is an acceptable deliberate trade-off to reduce build, test, and support surface for v1, even though those additional profiles would cost $0 to include.
- UGBS/Leaf Marketing's own prospecting needs (web development and WhatsApp/AI automation clients) are representative enough of the target niche to validate the product before resale.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Baileys is an unofficial WhatsApp protocol; the connected number can be banned for bulk/spam-like behavior. | High — loses the WhatsApp channel entirely for that number. | Strict throttling, randomized delays, warm-up period for newly connected numbers. |
| Google Maps changes its DOM/internal data structure or adds anti-bot measures. | High — breaks the core lead-discovery step. | Network-response interception (more resilient than DOM parsing) plus admin dashboard visibility into scrape job failure rate, so breakage is caught early. |
| Cold email lands in spam without proper sending-domain authentication. | Medium — reduces effective reach of the email channel. | Recommend SPF/DKIM setup on the tenant's sending domain; treat email "opened" signal as approximate, not guaranteed. |
| Scraping Maps and automating WhatsApp both technically violate those platforms' terms of service. | Medium — acceptable at small/personal scale, a real consideration if usage scales. | Documented plainly; revisit if/when scaling to many tenants sending in volume. |
| Using two separate Groq accounts to double free-tier capacity is a gray area against typical single-account fair-use terms. | Low at MVP scale (single tenant). | Monitor usage via the admin dashboard; revisit if Groq fair-use enforcement tightens. |

## 10. Out of Scope for MVP

Explicitly excluded from v1 to keep the MVP focused. All items below are planned for later phases, not abandoned.

- Multi-tenant signup/onboarding flow, Service Profile locking at signup, and any tenant self-service account creation.
- Razorpay billing integration, UPI Autopay/subscriptions, and the Free/Basic/Standard/Pro tier structure with usage caps and branding logic.
- Auto-send follow-ups — MVP only surfaces a reminder; sending remains a manual action.
- Email open/read tracking (approximate "opened" signal via pixel).
- Instagram-based fine-signal scraping — deferred indefinitely given confirmed datacenter-IP blocking and real proxy/API cost.
- Social Media Management, Video Editing, and Digital Marketing/SEO Service Profiles — deferred past MVP even though technically low-cost to add.
- Full Master Admin Portal — tenant management, system health monitoring, per-tenant AI usage breakdown, and billing overview all wait for Phase 3; MVP ships only the cost/usage dashboard.
- Bring-your-own-AI-key option for tenants — moot with a single tenant in MVP.
- Team seats, multiple connected numbers per tenant, or any white-labeling/branding controls.

## 11. Acceptance Criteria (MVP)

### 11.1 Lead discovery & scoring
- Given a valid area and niche input, the system returns a capped batch of leads (per the configured per-click limit) within 2 minutes.
- Every returned lead has a computed Opportunity Score, an AI Score out of 10, and a short AI-generated problem summary.
- Exactly 2 AI calls are made per search regardless of how many leads are found (1 keyword-generation call, 1 batched scoring call) — verified via the admin usage dashboard.
- The lead table is sortable by Opportunity Score and by AI Score, and supports pagination without reading the full lead collection on each page.

### 11.2 Outreach
- Clicking "generate message" on a specific lead produces exactly one AI call and returns a personalized message body (and, for email, a subject) referencing that lead's problem summary.
- The user can edit the generated message before sending.
- Sending via WhatsApp delivers through the tenant's connected Baileys session; sending via Email auto-assembles greeting + body + signature (first message) or body + signature (subsequent messages) without the user typing a subject or closing line.
- Send actions are throttled (rate-limited, randomized delay) on both channels; no raw unthrottled blast is possible from the UI.

### 11.3 Unified inbox
- A reply received on WhatsApp or Email for a given lead appears in that lead's single conversation thread within a defined polling/listener interval.
- Incoming email replies are quote-stripped so only the new text renders as a chat bubble, not the full quoted thread history.
- Opening a lead's conversation reads only that lead's message subcollection, not the full platform's message data.

### 11.4 Pipeline tracking & follow-up
- The user can manually set a lead's status to any of: New, Contacted, Replied, Interested, Converted, Lost, and the change persists and is reflected in the lead table immediately.
- A lead that has remained at the same non-terminal status for the configured N days is surfaced in a visible follow-up reminder list.

### 11.5 Cost/usage visibility
- The admin dashboard displays, for the current day: Firestore reads/writes/storage used vs. free-tier ceilings, and Groq request/token usage for both accounts vs. their daily caps.
- At MVP usage volume, actual billed infrastructure cost for the testing period is $0, confirmed against Firebase and Groq billing/usage pages.
