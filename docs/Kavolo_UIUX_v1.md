# KAVOLO
### FIND | REACH | GROW

# UI/UX Document

*Simple, modern, implementation-ready — screens, flows, components, and design tokens for the MVP*

Version 1.0 · September 2026
Prepared by: Devansh Joshi — UGBS (Unicorns Group of Business Solutions)

---

## 1. Design Principles

Five rules everything else in this document follows. When a screen or component decision isn't covered explicitly below, decide it by these.

- **Familiarity over novelty** — the target user already lives in WhatsApp all day. Outreach and the inbox should feel like chatting, not like filling out enterprise software. When in doubt, copy WhatsApp's pattern, not a generic CRM's.
- **Speed over completeness** — every MVP screen does one job well. No dashboard-of-everything home screen, no feature that exists just because it could.
- **Dense where it matters, calm everywhere else** — the lead table is allowed to show a lot of data at once, because that's where decisions get made. Composing a message stays down to one text box, because that's where the tenant should be thinking about their words, not the UI.
- **Never block on AI** — keyword generation, scoring, and message generation all take real seconds. Every one of these actions shows a clear working state (Section 11) — the UI never just freezes.
- **One accent color for action, plus a small, deliberate set of status colors** — blue means "you can act here" (a button, a link, an unread badge). Green/amber/red are reserved strictly for CRM outcome and system-status meaning (Section 2.3) — never used decoratively.

## 2. Design Tokens — Colors

Carried over unchanged from the palette already finalized for Kavolo (see color-tokens.css).

### 2.1 Neutrals

| Token | Hex | Usage |
|---|---|---|
| neutral-50 | `#F8F9FA` | Page background |
| neutral-100 | `#E9ECEF` | Card / surface background; "New" and "Lost" status pill background |
| neutral-200 | `#DEE2E6` | Borders, dividers |
| neutral-300 | `#CED4DA` | Disabled borders / inputs |
| neutral-400 | `#ADB5BD` | Placeholder text, icons |
| neutral-500 | `#6C757D` | Secondary text |
| neutral-600 | `#495057` | Body text; "New"/"Lost" status pill text |
| neutral-700 | `#343A40` | Headings |
| neutral-900 | `#212529` | Max-contrast text |

### 2.2 Accent (blue) — the one color for action

| Token | Hex | Usage |
|---|---|---|
| accent-50 | `#F6F8FC` | Selected row / hover tint; "Contacted" pill background |
| accent-100 | `#E0E9F8` | Light tint backgrounds |
| accent-400 | `#7AA7F0` | Focus ring |
| accent-500 | `#105DD9` | Primary buttons, links, unread badges, "Replied" status pill |
| accent-600 | `#104190` | Hover / active state on primary buttons |
| accent-700 | `#113163` | "Contacted" pill text |

### 2.3 Semantic status colors (functional only — never decorative)

A CRM with only blue and gray makes "Converted" and "Lost" indistinguishable at a glance — a real usability problem, not a style preference. These three additions are used only for the meanings below, nowhere else in the product.

| Token | Hex | Usage |
|---|---|---|
| success-100 | `#DCFCE7` | "Converted" status pill background |
| success-700 | `#15803D` | "Converted" status pill text; success toasts |
| warning-100 | `#FEF3C7` | "Interested" status pill background |
| warning-700 | `#B45309` | "Interested" status pill text; attention-needed indicators |
| danger-100 | `#FEE2E2` | Error banners, failed-send background |
| danger-700 | `#B91C1C` | Error text, destructive-action buttons, failed-send text |

All text/background pairs above were checked against WCAG AA (4.5:1 for normal text): every pairing meets or exceeds it, including the muted neutral-600-on-neutral-100 pairing used for the lowest-emphasis pills.

## 3. Design Tokens — Typography

One typeface family, system-native for performance (no web-font load delay): Inter as the primary choice, falling back to the system UI font stack (-apple-system, Segoe UI, Roboto, Arial) so text renders instantly with no flash of invisible text.

| Style | Size / Line-height | Weight | Usage |
|---|---|---|---|
| Display | 28px / 36px | 700 (Bold) | Page titles (e.g. "Leads", "Inbox") |
| H1 | 22px / 30px | 700 (Bold) | Section headings within a screen |
| H2 | 18px / 26px | 600 (Semibold) | Card/panel titles, modal titles |
| Body | 15px / 22px | 400 (Regular) | Default text — table cells, descriptions, message bodies |
| Body Strong | 15px / 22px | 600 (Semibold) | Business names, emphasis within body text |
| Small | 13px / 18px | 400 (Regular) | Timestamps, helper text, table secondary lines |
| Label | 12px / 16px | 600 (Semibold), uppercase, letter-spacing 0.02em | Status pills, form field labels, table column headers |

## 4. Design Tokens — Spacing & Layout Grid

A 4px base unit keeps every gap, padding, and margin on a consistent rhythm — no ad-hoc pixel values in implementation.

| Token | Value | Typical use |
|---|---|---|
| space-1 | 4px | Icon-to-label gap, tight inline spacing |
| space-2 | 8px | Gap between related small elements (e.g. badge + text) |
| space-3 | 12px | Form field internal padding |
| space-4 | 16px | Default gap between cards, table cell padding |
| space-6 | 24px | Section spacing within a screen |
| space-8 | 32px | Spacing between major page regions |
| space-12 | 48px | Page top padding on desktop |

### 4.1 Layout grid

- Desktop: fixed 240px left sidebar (navigation) + fluid main content area, max content width 1200px, centered with 32px side padding beyond that.
- Content within the main area uses a 12-column fluid grid (24px gutters) for anything more structured than a single table/list — the lead table and inbox thread are full-width within the content area, not grid-constrained, since they benefit from maximum horizontal space.
- Corner radius: 8px on cards/inputs/buttons, 999px (full pill) on status badges and avatars — two values only, no third "in-between" radius introduced.

## 5. Navigation & Information Architecture

A single React SPA (per the System Architecture Document), one persistent left sidebar, role-gated. Tenant and Admin share the same shell; the Admin item only renders for the `is_admin` claim.

| Nav item | Route | Visible to | Purpose |
|---|---|---|---|
| Dashboard | / | Tenant | Start a new search; see today's quick stats (leads found, messages sent, replies waiting) |
| Leads | /leads | Tenant | The scored lead table, filterable by status |
| Inbox | /inbox | Tenant | Unified WhatsApp + Email conversations |
| Follow-ups | /followups | Tenant | Leads that have gone quiet past the configured threshold |
| Settings | /settings | Tenant | Email template, SMTP/IMAP connection, WhatsApp pairing, limits (read-only) |
| Usage | /admin/usage | Admin only | Firestore + Groq usage vs. free-tier ceilings |

- Top bar (persistent, all screens): Kavolo wordmark (left), connection-status indicators for WhatsApp and Email (green dot = connected, gray = not connected — click to go to Settings), account menu (right).
- Unread indicator: the Inbox nav item shows a small accent-500 badge with the total unread count across all leads, updating live.

## 6. User Journey

The end-to-end path for the primary MVP user (a freelancer/agency finding and closing local-business clients), narrated once here; each step is detailed as its own screen and flow later in this document.

1. First login → completes First-Run Setup once: confirms their Service Profile (locked), writes their email greeting/signature, connects their SMTP+IMAP mailbox, pairs their WhatsApp via QR.
2. Lands on Dashboard → types an area and a niche → clicks Find Leads.
3. Within ~2 minutes, a scored table of leads appears (Leads screen) — sorted by AI Score by default, each row showing the business, both scores, and a one-line problem summary.
4. Opens a promising lead's detail panel → clicks Generate Message → reviews/edits the AI draft → sends it via WhatsApp or Email.
5. That lead's status auto-advances to Contacted. Days later, a reply arrives → it appears in Inbox, chat-bubble style, indistinguishable in UX from a WhatsApp conversation whether it came by WhatsApp or Email.
6. The tenant replies from the same thread, manually updates the lead's status as the conversation progresses (Interested → Converted, or Lost).
7. If a lead goes quiet, it surfaces on Follow-ups a few days later, prompting a nudge rather than being silently forgotten.

## 7. Screens

A visual wireframe pack (boxes and arrows) is better produced as a Whiteboard/Design artifact than laid out here — what follows is the structural specification for each screen: precise enough to implement directly.

### 7.1 Login
- Layout: centered card (400px wide) on a plain neutral-50 background. Kavolo wordmark + tagline above the card.
- Components: email + password fields, "Sign in" primary button, "Sign in with Google" secondary button, "Forgot password" link.
- States: default; inline field error (invalid credentials) shown below the password field in danger-700 text; loading (button shows a spinner, disabled) while Firebase Auth resolves.

### 7.2 First-Run Setup (shown once, until all steps are complete)
- Layout: a 4-step wizard in the main content area (no sidebar yet — nothing to navigate to until setup is done). Steps: 1) Confirm Service Profile, 2) Email template (greeting + signature), 3) Connect SMTP + IMAP, 4) Pair WhatsApp (QR code).
- Step 1 (Service Profile): two large selectable cards (Web Development / WhatsApp & AI Automation), each with a one-line description. A visible warning banner: "This can't be changed later without contacting support" appears once one is selected, before the confirm button is enabled — matches SRS VAL-3/the tenant-level lock decision.
- Step 3 (SMTP/IMAP): host, port, username, password fields for each; a "Test Connection" button must succeed (spinner → green check) before "Next" enables — enforces SRS VAL-2 in the UI, not just the backend.
- Step 4 (WhatsApp): a live QR code (refreshes every ~20s if unscanned) with instructions matching WhatsApp's own linking flow; the step auto-advances the moment pairing succeeds.
- Progress indicator: 4 dots/segments at the top, current step highlighted accent-500, completed steps show a checkmark.

### 7.3 Dashboard / Search
- Layout: a prominent search card at the top (area input, niche input, "Find Leads" primary button) — the single most important action on the screen, sized and positioned accordingly.
- Below it: three small stat tiles (Leads found today, Messages sent today, Replies waiting) using the tenant's per-day cap as the tile's implicit denominator (e.g. "6 / 15 today").
- Below that: a short list of the 5 most recent searches (area, niche, lead count, date) as clickable rows jumping into the Leads screen filtered to that search.
- States: default; at-cap (search button disabled, tile shows the cap reached message and reset time — SRS ERR-5); loading (button becomes a spinner + "Finding leads…" for up to the ~2-minute search window, Section 11).

### 7.4 Leads
- Layout: full-width table. Columns: Business (name + address, two lines), Opportunity Score (numeric badge), AI Score (numeric badge, /10), Problem summary (truncated, tooltip for full text), Status (pill), Last activity (relative time), row action (chevron opens the detail panel).
- Above the table: status filter tabs (All / New / Contacted / Replied / Interested / Converted / Lost) and a sort control (defaults to AI Score, descending).
- Pagination: 25 rows/page (matches SRS NFR-3), simple Previous/Next plus page number, not infinite scroll — keeps the read pattern predictable and matches the paginated Firestore query underneath.
- Clicking a row opens the Lead Detail panel as a right-side slide-over drawer (does not navigate away from the table — the tenant can compare leads without losing their place).
- Lead Detail drawer contents: business info block; both scores with the AI-written problem summary in full; message composer (see 7.4.1); a small "Conversation" preview linking into the full Inbox thread if one exists; status dropdown (the six values, SRS FR-25).

#### 7.4.1 Message composer (within the Lead Detail drawer)
- A single "Generate Message" button (disabled while a generation request is in flight, re-enabled on success or failure — SRS EC-4) produces a draft in an editable textarea.
- Channel choice: two toggle buttons, WhatsApp / Email, defaulting to whichever channel has contact info available (disable the one that doesn't, per SRS EC-2, with a tooltip explaining why).
- "Send" primary button; for Email, a small preview toggle shows exactly what will be sent (assembled greeting + body + signature) so the tenant sees the final result before it goes out, even though they only typed the body.

### 7.5 Inbox
- Layout: classic two-pane messaging UI — left pane a conversation list (business name, channel icon, last message preview, relative time, unread dot), right pane the open thread.
- Thread view: chat bubbles, outbound right-aligned in accent-500 with white text, inbound left-aligned in neutral-100 with neutral-900 text — visually identical whether the channel is WhatsApp or Email, with a small channel icon on each bubble as the only differentiator (matches the "feels like WhatsApp regardless of channel" principle).
- Composer at the bottom of the thread: single text box + send button, same auto-assembly behavior as the Lead Detail drawer's composer for Email.
- Opening a conversation clears its unread state immediately (SRS FR-24).

### 7.6 Follow-ups
- Layout: a simple list (not a table — fewer columns needed), each row: business name, status pill, days since last activity, a one-click "Send follow-up" button that opens a small pre-filled composer modal (reusing the same composer component as 7.4.1).
- Empty state: when nothing needs following up, a calm confirmation message rather than a blank list (Section 11).

### 7.7 Settings
- Same four sections as First-Run Setup (Service Profile — shown read-only/locked here, Email template, SMTP/IMAP, WhatsApp), now editable independently rather than as a forced wizard, laid out as a single scrollable page with clear section headings.
- Service Profile section shows the current profile with a disabled selector and the same explanatory copy as to why it's locked, rather than simply hiding the option — the tenant should be able to see what they can't change and why, not wonder where it went.

### 7.8 Admin — Usage Dashboard
- Layout: four stat cards across the top (Firestore reads, writes, and storage vs. free-tier ceiling; Groq Account A calls vs. cap; Groq Account B calls vs. cap; overall cost — "$0" in green when within free tier), each with a simple horizontal progress bar.
- Below: a small table of the day's activity (searches run, messages sent, replies received) for a sanity-check view alongside the raw usage numbers.

## 8. Core Components

| Component | Variants / States | Notes |
|---|---|---|
| Button | Primary (accent-500 fill), Secondary (neutral-200 border, transparent fill), Danger (danger-700 fill), each with default / hover / disabled / loading | Loading state replaces label with a spinner, keeps the button's width fixed to avoid layout shift |
| Text input / Textarea | Default, focus (accent-400 ring), error (danger-700 border + helper text below), disabled | Label always above the field (Label style, Section 3), never a placeholder-only field |
| Score badge | Numeric, color-coded: Opportunity Score and AI Score both use the same 3-tier coloring — success-700 tint for high, warning-700 tint for medium, neutral-500 for low | Exact thresholds are a product/business-rule decision (SRS-adjacent), not a UI one — this document fixes the visual treatment, not the cut points |
| Status pill | The six CRM statuses (Section 2.3) plus a generic "Failed" pill in danger colors for send failures | Pill text uses the Label type style (uppercase, semibold, small) |
| Chat bubble | Outbound (accent-500, right-aligned) / Inbound (neutral-100, right or left per direction), each with a small channel icon and a timestamp on hover | Never shows raw HTML for email replies — always the quote-stripped plain text (SRS FR-22) |
| Table | Sortable column headers (click to toggle sort direction, small arrow indicator), zebra-striped rows (neutral-50 alternating), pagination footer | Column headers use the Label type style; never more than 25 rows rendered at once (SRS NFR-3) |
| Slide-over drawer | Right-anchored, 480px wide on desktop, full-screen on mobile, dismiss via close icon, click-outside, or Esc | Used for Lead Detail; keeps the underlying table state (scroll position, filters) intact |
| Modal | Centered, max 480px wide, used sparingly (follow-up composer, destructive-action confirmations only) | Anything that isn't a quick, focused action belongs in a drawer or its own screen, not a modal |
| Toast | Success (success-700 accent bar), Error (danger-700 accent bar), auto-dismiss after 4s, manually dismissible | Used for fire-and-forget confirmations ("Message sent", "Settings saved") — never for anything the tenant must read carefully (that goes inline instead) |
| Connection status dot | Green (connected) / neutral-400 (not connected), 8px circle | Used in the top bar for WhatsApp and Email; clicking navigates to Settings |
| Skeleton loader | Gray (neutral-100) animated placeholder blocks matching the shape of the content being loaded | Used for the lead table and inbox thread while data loads — never a generic full-page spinner for content that has a known shape |

## 9. Key User Flows

### 9.1 Find & score leads (SRS FR-1–FR-12)
- Dashboard → enter area + niche → Find Leads → button shows loading state → Leads screen opens automatically, populated and already scored, sorted by AI Score.
- If zero results (EC-1): Leads screen shows the empty state directly, no error styling.
- If the daily/per-click cap is hit (ERR-5): the Find Leads button is disabled before submission with the limit and reset time shown inline, not after a failed attempt.

### 9.2 Generate & send a first message (SRS FR-13–FR-19)
- Leads table → open a row → Lead Detail drawer → Generate Message → draft appears in the composer → tenant edits if needed → chooses channel (or accepts the default) → Send → drawer shows a brief success state → row's status pill updates to Contacted without a page reload.

### 9.3 Reply & continue a conversation (SRS FR-20–FR-24)
- A new reply increments the Inbox nav badge live → tenant opens Inbox → selects the conversation (bolded while unread) → thread opens, unread clears → tenant types a reply → Send → bubble appears immediately (optimistic UI), confirmed once the backend acknowledges the send.

### 9.4 Update pipeline status (SRS FR-25–FR-26)
- From either the Leads table row, the Lead Detail drawer, or the Inbox thread header, the same status dropdown component is used — one control, available everywhere the lead's context is visible, not three different patterns.

### 9.5 Follow up on a stale lead (SRS FR-27–FR-28)
- Follow-ups screen → row → Send follow-up → pre-filled composer modal (last conversation context shown above it for reference) → Send → row disappears from the Follow-ups list (its last_message_at just updated, so it no longer qualifies).

### 9.6 First-time setup (SRS AUTH/VAL requirements)
- Covered fully in Screen 7.2 — the one flow that is a forced linear wizard rather than a free-navigation screen, because none of the rest of the product is usable until it's complete.

## 10. Forms & Validation

Validation rules themselves are specified in the SRS (VAL-1 through VAL-6); this section defines how they surface in the UI.

- Inline, not on-submit-only: a field validates on blur (not on every keystroke, which feels harsh) and shows its error state immediately below the field in danger-700 text with a small icon — the tenant never submits a whole form just to discover the first problem.
- Submit buttons are disabled while any required field is invalid or empty, rather than enabled-then-rejected — matches VAL-1, VAL-4, VAL-6's "blocked before submission" intent.
- Destructive or hard-to-reverse actions (only really the Service Profile confirmation at setup, since MVP has no delete actions) use an explicit two-step confirm — a checkbox or typed confirmation, not just a modal with an OK button that's easy to click through.
- Character counters appear on any field with a hard cap (message body length, VAL-5) once the tenant is within 20% of the limit — not shown constantly, to avoid visual noise on short messages.

## 11. Loading, Error & Empty States

Specified per screen so nothing is left to "figure it out during implementation."

| Screen | Loading | Empty | Error |
|---|---|---|---|
| Dashboard | Search button → spinner + "Finding leads…" label, up to ~2 min | N/A (search card is always actionable) | Scrape/AI failure (ERR-1/ERR-2): inline banner above the search card, "Search failed — try again," Find Leads re-enabled |
| Leads | Skeleton table rows while a page loads | Illustration + "No leads yet — run a search from the Dashboard" with a button back to Dashboard | N/A at this screen (errors surface at the point of search, above) |
| Lead Detail | Button-level spinner during Generate Message | N/A | Generation failure: inline message under the composer, "Couldn't generate a message — try again," button re-enabled (EC-4 pattern) |
| Inbox | Skeleton conversation list + skeleton bubbles on first load | Illustration + "No conversations yet — messages you send will show up here" | Send failure (ERR-3): the failed bubble shows a small retry icon and danger-700 tint instead of disappearing |
| Follow-ups | Skeleton list rows | Calm confirmation illustration + "Nothing needs a follow-up right now" — a genuinely good state, styled positively, not like a generic empty-list message | N/A |
| Settings | Field-level spinners during "Test Connection" | N/A | Connection test failure (VAL-2): inline error naming the likely cause (auth/host/port) beneath the relevant fields |
| WhatsApp pairing | QR code with a subtle pulsing border while waiting for a scan | N/A | Session disconnected (ERR-4): banner across Inbox and Settings, "WhatsApp disconnected — reconnect," linking straight to the QR step |
| Admin Usage | Skeleton stat cards | N/A (always has today's data) | If a usage figure fails to load, that one card shows "—" with a retry icon rather than blocking the other three cards |

## 12. Interactions & Motion

Minimal and fast — motion confirms what happened, it never becomes something the tenant has to wait through.

- Standard transition: 150ms ease-out for hover/focus states, 200ms for drawers and modals entering/exiting. Nothing in the product should animate longer than ~250ms.
- New inbox messages and new lead rows (from a live Firestore listener) fade/slide in gently rather than snapping into place, so a live update doesn't read as a jarring layout jump.
- No skeleton-to-content "flash" — skeleton loaders match the exact shape/size of the real content, so the swap is not a layout shift.
- Optimistic UI for sending a message (Section 9.3): the bubble appears the instant Send is clicked, with a small pending indicator (a faint clock icon) that clears when the backend confirms — the tenant never stares at a spinner for something as routine as sending a chat message.

## 13. Responsive Behavior

Desktop-first — this is a work tool used primarily from a laptop while actively prospecting — but the Inbox specifically must work well on mobile, since replying to a hot lead shouldn't wait until the tenant is back at their desk.

| Breakpoint | Range | Behavior |
|---|---|---|
| Desktop | ≥1024px | Full layout as specified in Section 7: persistent sidebar, two-pane Inbox, slide-over Lead Detail drawer. |
| Tablet | 768–1023px | Sidebar collapses to icons-only (labels on hover/tap); Lead Detail drawer widens to 60% of the viewport instead of a fixed 480px. |
| Mobile | <768px | Sidebar becomes a bottom tab bar (Dashboard, Leads, Inbox, Follow-ups, Settings — Admin Usage accessible via an overflow menu). Inbox's two-pane layout becomes single-pane with back navigation (conversation list → tap → thread → back). Lead Detail drawer becomes a full-screen view, not an overlay. |

- Tables (Leads screen) on mobile switch from a multi-column table to a stacked card per lead (business name + both scores + status pill + last activity, in that priority order) — never a horizontally-scrolling table, which is hard to use on a phone.
- Touch targets are at least 44×44px on any breakpoint below 1024px, per standard mobile accessibility guidance (Section 14).

## 14. Accessibility

- Color contrast: every text/background pairing used anywhere in the product (Section 2) meets WCAG AA (4.5:1 for normal text, 3:1 for large/bold text) — verified, not assumed, for all neutral, accent, and semantic combinations.
- Color is never the only signal: every status pill carries a text label, not just a color; the WhatsApp/Email channel distinction on chat bubbles uses an icon, not color alone; connection status dots are paired with a text label on hover/focus.
- Keyboard navigation: every interactive element (buttons, table rows, status dropdowns, the drawer's close control) is reachable and operable via Tab/Enter/Esc; the Lead Detail drawer traps focus while open and returns focus to the triggering row on close.
- Focus states: a visible accent-400 focus ring on every focusable element — never suppressed for aesthetic reasons.
- Live regions: the Inbox's incoming-message stream and the unread-count badge use `aria-live="polite"` so a screen-reader user is told about new messages without the whole page being re-announced.
- Alt text: the logo, any status icons, and empty-state illustrations all carry descriptive alt text; purely decorative elements are marked `aria-hidden`.
- Minimum touch target size of 44×44px on mobile breakpoints (Section 13), and comfortably-spaced click targets on desktop even though the requirement is looser there.
- Form errors are associated with their field via `aria-describedby`, not just visually positioned nearby, so assistive tech announces the specific error for the specific field.
