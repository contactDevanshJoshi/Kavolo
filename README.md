# Kavolo
### FIND | REACH | GROW

> **AI-assisted lead discovery and outreach system for local-service freelancers and agencies**  
> Built for single-tenant MVP (Devansh Joshi / UGBS) at genuinely $0 operating infrastructure cost.

---

## 1. Overview

Kavolo streamlines the client acquisition lifecycle for agencies and freelancers offering Web Development and WhatsApp/AI Automation services:
- **Discover:** Scrapes Google Maps using network-response interception guided by AI keyword generation.
- **Score:** Evaluates leads through two layers — instant deterministic Opportunity Score (0–100) + batched AI scoring (1–10) with problem summaries.
- **Outreach:** Generates problem-grounded personalized first messages, dispatched via WhatsApp (Baileys) or Email (SMTP) with strict throttling.
- **Unified Inbox:** Merges incoming replies across WhatsApp and Email into a single lead thread with clean, quote-stripped chat bubbles.
- **Track & Follow Up:** Manages a 6-stage CRM pipeline (New, Contacted, Replied, Interested, Converted, Lost) with stale lead reminders.

---

## 2. Architecture & Tech Stack

All infrastructure runs inside a single Google Cloud / Firebase project:

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | Single-page application served via Firebase Hosting |
| **Database** | Cloud Firestore | Tenant-scoped data store with real-time listeners |
| **Auth** | Firebase Authentication | Email/Password & Google Sign-in with `is_admin` custom claim |
| **Stateless Backend** | Firebase Cloud Functions (2nd Gen) | APIs, Playwright Maps scraper, Groq AI integration, IMAP poller |
| **Stateful Runtime** | 1 GCE e2-micro VM (Always Free) | Persistent Baileys WhatsApp WebSocket connection & throttled queue drainer |
| **AI Layer** | Groq API (2 accounts) | Account A (Keywords & Batch Scoring), Account B (Personalized Outreach) |

---

## 3. Specification Documents

Full specifications live in the [`/docs`](file:///Users/devanshjoshi/Kavolo/docs) directory:
1. [`docs/Kavolo_PRD_v1.md`](file:///Users/devanshjoshi/Kavolo/docs/Kavolo_PRD_v1.md): Product requirements, MVP boundaries, acceptance criteria.
2. [`docs/Kavolo_SRS_v1.md`](file:///Users/devanshjoshi/Kavolo/docs/Kavolo_SRS_v1.md): Functional (FR-1–30), business rules, data model, security, and NFRs.
3. [`docs/Kavolo_SAD_v1.md`](file:///Users/devanshjoshi/Kavolo/docs/Kavolo_SAD_v1.md): System architecture, deployment topology, and non-goals.
4. [`docs/Kavolo_UIUX_v1.md`](file:///Users/devanshjoshi/Kavolo/docs/Kavolo_UIUX_v1.md): Design tokens, 8 core screens, components, states, and accessibility.
5. [`docs/Kavolo_DevPlan_v1.md`](file:///Users/devanshjoshi/Kavolo/docs/Kavolo_DevPlan_v1.md): 14 phases (Phases 0–13), sequential build plan and DoD.

---

## 4. Repository & Branch Strategy

- **`main`**: Protected, stable baseline.
- **Feature Branches**: Short-lived branches following the pattern `feat/phase-<X.Y>-<task-name>` (e.g., `feat/phase-0.2-firebase-setup`).
- **Workflow**: Strictly one task at a time as outlined in `Kavolo_DevPlan_v1.md` Section 6, validated against the Feature-task Definition of Done (§9.1) before merging.

---

## 5. Directory Structure

```text
/
├── docs/                 # Specification & design documents (PRD, SRS, SAD, UIUX, DevPlan)
├── frontend/             # React SPA (Vite, Tailwind CSS)
├── functions/            # Firebase Cloud Functions (Node.js)
├── vm/                   # Stateful WhatsApp Baileys client & send_queue worker
├── .gitignore            # Secret & credential protection rules
└── README.md             # Project documentation
```

---

## 6. Definition of Done (DoD)

Every task strictly follows the Definition of Done in `Kavolo_DevPlan_v1.md` §9.1:
- Implements exactly the cited requirement without scope creep.
- Passes acceptance criteria with automated or manual verification.
- Enforces tenant isolation, input validation, and security constraints.
- Zero console errors; strict WCAG AA accessibility compliance.
