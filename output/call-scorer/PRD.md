# PRD: Discovery Call Scorer (Granola + BANT Intelligence Layer)

**Version:** 2.0
**Date:** March 27, 2026
**Status:** Draft
**Author:** Product research-driven draft

---

## Executive Summary

A lightweight, Granola-native platform that ingests discovery call transcripts from Granola's API, scores them against structured sales qualification frameworks (BANT, MEDDIC, SPICED, or custom rubrics) using Claude, and surfaces structured scorecards with verbatim transcript evidence. The product targets sales managers and AEs at Series A–C SaaS companies who are already using Granola but have no systematic way to enforce or measure qualification framework adoption.

The core loop: connect Granola → select a transcript → select a rubric → get a structured scorecard with per-dimension scores, verbatim evidence excerpts, and confidence levels — all in under 90 seconds.

---

## 1. Problem Statement

### 1.1 The Qualification Gap Is a Tooling Problem, Not a Training Problem

Sales managers at most B2B SaaS companies run through the same cycle: train the team on a qualification framework (BANT, MEDDIC, SPICED), see initial adoption, then watch adherence collapse under quota pressure within 6–9 months. Industry research puts consistent BANT/MEDDIC completion rates at 15–30% without automated enforcement. Frameworks like MEDDIC achieve 94% completion when AI extracts data automatically vs. manual CRM entry.

The root cause is not lack of willingness — it's the absence of a lightweight, low-friction feedback loop between "I finished a discovery call" and "here's what I did well and what I missed."

### 1.2 Current Tools Don't Solve This for Most Teams

The conversation intelligence market is large and growing — from $28.5B in 2025 to $32.3B in 2026 at 13% CAGR (Research and Markets, 2026) — but it is structured around enterprise deals that most teams cannot afford or justify.

**Gong** is the category leader but has become inaccessible to the majority of sales teams:
- Pricing shifted in 2024–2025 to ~$250/user/month in bundled packages
- Mandatory platform fees of $5,000–$50,000/year mean a 10-rep team pays $17,000–$32,000 before onboarding
- Reddit users describe Gong as "surveillance more than coaching," with reps stopping proper meeting tagging after onboarding
- User complaint pattern on G2: "Gong didn't help me prep or follow up — it just felt like tracking"

**Chorus (ZoomInfo)** has stagnated post-acquisition (2022). Users cite slower innovation, high-pressure bundled sales tactics, and costs that rival Gong.

**Clari Copilot** (acquired Wingman) has raised per-user pricing from ~$60–110 to $120–160/month, with a 2–3 month implementation timeline and interfaces described as "non-intuitive" and "requiring extensive navigation."

**Avoma**, **tl;dv**, and **Fireflies** offer lighter-weight alternatives but none:
- Read natively from Granola transcripts
- Produce rubric-grounded, evidence-cited qualification scores
- Allow teams to define and enforce a custom scoring framework
- Serve the SMB price point with a focused, single-purpose tool

### 1.3 Granola Has Become the Meeting Notes Layer for Technical Sales Teams

Granola raised $125M at a $1.5B valuation in March 2026 (Series C, Index Ventures / Kleiner Perkins), growing revenue 250% in the prior quarter. It counts Vanta, Gusto, Asana, Cursor, Mistral, and Lovable among its customers — precisely the companies whose sales teams are the primary market for a tool like this.

Crucially, Granola introduced in early 2025:
- A **Personal API** (Business and Enterprise plans) giving programmatic access to notes, transcripts, and metadata
- An **Enterprise API** with team-level context access
- An **MCP server** enabling direct AI tool integrations
- Native connections to Claude, ChatGPT, HubSpot, Notion, Slack, and 8,000+ apps via Zapier

Granola's design philosophy — device-level audio capture with no bot joining meetings — means it is preferred by sales reps who find meeting bots intrusive. This creates a growing corpus of structured, API-accessible transcripts with no native scoring layer.

### 1.4 The LLM Scoring Paradigm Is Now Proven

LLM-as-judge with rubric-anchored prompting achieves 90%+ accuracy in extracting BANT/MEDDIC criteria from transcripts when using structured, evidence-first prompting. Research shows that rubric-aligned scoring — where the model extracts criterion-specific evidence before scoring — produces greater consistency, interpretability, and traceability than summary-based approaches. Structured JSON output from Claude enables deterministic parsing and storage. At Sonnet pricing, a full transcript scoring run costs approximately $0.03–0.10 per call, making per-seat economics favorable.

### 1.5 The Market Gap This Product Fills

No tool today:
1. Ingests transcripts natively from Granola's API without requiring a meeting bot
2. Applies a fully user-defined qualification rubric with weighted scoring
3. Returns verbatim transcript evidence for every scored dimension
4. Operates at an SMB-friendly price point ($20–50/user/month range) without enterprise contracts or implementation timelines

---

## 2. Target Users

### 2.1 Primary Persona: The Sales Manager / Head of Sales

**Profile:** Player-coach managing 3–12 AEs or SDRs at a Series A–C SaaS company. Already using Granola for personal note-taking. Runs weekly pipeline reviews. Wants visibility into call quality without spending Thursday afternoons listening to recordings.

**Jobs to be done:**
- Know whether reps are executing the qualification framework the team trained on
- Coach reps with grounded, specific evidence ("at this point in the call, you never confirmed the economic buyer")
- Build a defensible, data-backed picture of pipeline health for the VP or board
- Identify which qualification checks the team systematically skips so coaching is targeted

**Current workarounds:** Spot-checking 2–3 calls per week, relying on rep self-reporting in CRM, manual scorecards in Google Sheets, informal impressionistic feedback

**Willingness to pay:** $200–$500/month to cover the full team

**Key frustration:** "I can only review 1 in 10 calls. The other 90% are black boxes."

---

### 2.2 Secondary Persona: The Account Executive

**Profile:** Mid-market AE with a quota. Uses Granola on every call. Wants to improve but receives sporadic, low-specificity feedback from their manager.

**Jobs to be done:**
- Self-assess immediately after a call — did I actually cover what I was supposed to?
- See exactly which qualification criteria I missed and where in the transcript
- Build better habits through consistent self-review, not just manager coaching cycles

**Current workarounds:** Re-reading Granola notes, peer feedback, informal self-reflection — none systematic

**Key frustration:** "I don't get feedback until my manager has reviewed the call, which is maybe once a month. By then the deal has moved."

---

### 2.3 Tertiary Persona: The Revenue Operations Leader

**Profile:** RevOps or Sales Enablement manager responsible for process, methodology, and data quality. Owns the CRM, defines what "qualified" means, runs QBR analysis.

**Jobs to be done:**
- Define and enforce the qualification rubric across the team consistently
- Track methodology adoption trends over weeks and months
- Identify systemic team-level gaps ("we never ask about decision process")
- Export score data for pipeline reporting and forecasting models

**Current workarounds:** Custom Salesforce reports, manual call audits, quarterly QBR analysis, inconsistent rep-by-rep rubric interpretation

---

## 3. Core Platform

**Category:** AI-powered discovery call qualification scoring and coaching tool

**Positioning:** A Granola-native call intelligence layer — not a recording tool, not a full revenue platform, not a CRM replacement. It plugs into the transcript data teams are already generating in Granola and applies structured LLM scoring on demand.

**Delivery model:** Web application (SaaS), user-triggered scoring in v1, with team workspaces and a shared rubric library

**Core data flow:**
```
Granola Account (OAuth / API key)
  ↓
Transcript Ingestion Service
  → Pull notes + transcripts via Granola Personal API
  → Normalize to speaker-labeled, timestamped turns
  ↓
Scoring Engine (Python/FastAPI + Anthropic Claude API)
  → Compose scoring prompt: rubric definitions + normalized transcript
  → Single API call → structured JSON response
  → Parse: per-check scores (0–2 or 1–5), evidence excerpts, rationale, confidence level
  ↓
PostgreSQL (calls, scores, evidence_citations, rubrics, rubric_checks)
  ↓
Frontend Dashboard (Next.js)
  → Per-call scorecard view
  → Team trend analytics
  → Rubric editor
  → Coaching annotation layer
```

---

## 4. Feature List

Features are prioritized P0 (launch blockers), P1 (ship within 90 days of launch), and P2 (v2 roadmap).

---

### P0 — Core Launch Features

#### F-01: Granola Transcript Ingestion

**Priority:** P0
**User story:** As a sales manager, I want to connect my Granola account so I can pull in recent call transcripts without manual copy-paste.

**Details:**
- OAuth or API key connection to Granola's Personal API (`https://public-api.granola.ai/v1/`)
- Fetch paginated list of the user's meetings (notes) from Granola — display title, date, participants, duration
- Retrieve transcript for a selected note via `GET /v1/notes/{note_id}?include=transcript`
- Granola returns transcript in ProseMirror JSON or raw transcript JSON — normalize to speaker-labeled, timestamped turn objects: `{ speaker, text, start_seconds }`
- Handle Granola's enhanced notes format (AI summary + raw transcript — use raw transcript only for scoring)
- Manual upload fallback: user can paste transcript text or upload a `.txt` / `.md` file for teams on Granola's Basic plan (which restricts API transcript access to 30 days)
- Transcript stored in `transcripts` table with source metadata (granola_id, meeting title, date, participants)

**Acceptance criteria:** User authenticates with Granola, sees a paginated list of their last 30 meetings, selects one, and a normalized transcript is available for scoring within 10 seconds.

---

#### F-02: Rubric Framework Library

**Priority:** P0
**User story:** As a sales manager, I want to select a built-in scoring framework or define a custom rubric so the system knows exactly what to evaluate.

**Details:**
- **Prebuilt frameworks available at launch:**
  - **BANT**: Budget, Authority, Need, Timeline (4 dimensions)
  - **MEDDIC**: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion (6 dimensions)
  - **SPICED**: Situation, Pain, Impact, Critical Event, Decision (5 dimensions)
- Each framework dimension has a label, a plain-English description of what "good coverage" looks like, optional example phrases/questions, and a scoring scale description
- **Custom rubric builder:** Add, remove, rename, and reorder dimensions; write custom descriptions per dimension; set per-dimension weight (default equal)
- Rubrics are saved per workspace and reusable across calls
- Each workspace has one default rubric (applied if user doesn't select one manually)
- Rubric versioning: when a rubric is edited, old scores reference the rubric version used — not the current version
- Stored in `rubrics` and `rubric_checks` tables

**Acceptance criteria:** User can create a custom rubric with 5 dimensions, set descriptions and weights, save it, and have it appear as the default for future scoring jobs.

---

#### F-03: On-Demand LLM Scoring Engine

**Priority:** P0
**User story:** As a sales rep or manager, I want to trigger scoring on a call and get structured results within 90 seconds so I can review performance immediately after a meeting.

**Details:**

**Prompt engineering:**
- System prompt: define the rubric dimensions, scoring scale, and explicit instruction to cite verbatim excerpts before scoring each dimension
- User message: normalized transcript (speaker-labeled turns with timestamps)
- Scoring scale per dimension: `0 = not addressed`, `1 = partially addressed`, `2 = fully addressed` (with clear description per level)
- For each dimension, require the model to return: `{ dimension_id, score, confidence (low/medium/high), rationale (1–2 sentences), evidence_excerpts: [{ speaker, text, approx_timestamp }] }`
- Instruct Claude to explicitly state "Not addressed in this call" when evidence is absent — no inference, no hallucination
- Use structured JSON output (Claude's `response_format` or tool use with explicit schema) to enforce parseable responses
- Store raw API response alongside parsed output for debugging

**Processing:**
- Scoring job runs as a background task (Celery worker) to avoid HTTP timeout on long transcripts
- User sees a progress state: Queued → Processing → Complete
- For transcripts > 150K tokens (approximately 3+ hours), chunk by time segments and merge scores

**Output:**
- Per-dimension scores stored in `check_scores` table
- Evidence excerpts stored in `evidence_citations` table (linked to check score + transcript position)
- Overall call score = weighted average of dimension scores
- Confidence level per dimension stored and surfaced in UI

**Cost estimate:** ~$0.03–0.10 per scored call at Claude Sonnet pricing. Budget cap configurable per workspace.

**Acceptance criteria:** A 60-minute transcript scored against a MEDDIC rubric returns a full structured scorecard within 90 seconds, with at least one verbatim quote per dimension where coverage was found, and an explicit "not addressed" flag where it was not.

---

#### F-04: Per-Call Scorecard View

**Priority:** P0
**User story:** As a sales rep, I want to see a clean, readable scorecard after scoring so I can quickly understand where I performed well and where I missed.

**Details:**
- Summary bar at the top: overall call score, date, meeting title, rubric name, duration
- Per-dimension grid: each dimension shows score (0/1/2), color-coded (red/yellow/green), confidence level badge, and collapsible evidence panel
- Evidence panel: verbatim quote in block-quote format, speaker name, approximate timestamp
- If no evidence: "Not addressed in this call" displayed prominently — never a blank
- Coaching notes field: manager (or rep) can add free-text notes per dimension or at call level
- Export options: PDF scorecard download, shareable URL (link-based, no login required for read-only view)
- Score report is permanently stored and linkable

**Acceptance criteria:** Score report renders within 2 seconds of job completion. Every dimension shows either a verbatim quote or an explicit "not addressed" state. PDF export produces a clean one-page document.

---

#### F-05: Evidence Citation Integrity

**Priority:** P0
**User story:** As a manager providing feedback, I want all scores grounded in exact quotes from the transcript — no paraphrasing, no hallucinations — so my coaching is based on what was actually said.

**Details:**
- Evidence excerpts stored verbatim as extracted by Claude (no post-processing modifications)
- Each citation linked to transcript position (speaker + approximate timestamp)
- "Relevant?" micro-feedback on each citation (thumbs up/down) — used for quality monitoring
- System prompt explicitly instructs: do not paraphrase; if no evidence exists, say so
- Confidence level per dimension: `low` = inference-based, `medium` = indirect support, `high` = direct explicit evidence — shown in UI
- Override flag: if a citation is marked irrelevant by user, flag stored in DB for analysis

**Acceptance criteria:** Users can flag any evidence excerpt as irrelevant. At least 80% of flagged citations produce a quality alert for the scoring team within 48 hours.

---

#### F-06: Score History and Call Library

**Priority:** P0
**User story:** As a sales manager, I want all scored calls stored and searchable so I can reference them during 1:1s and review trends at any time.

**Details:**
- Calls list view: all scored calls sorted by date (desc), with columns for meeting title, rep name, overall score, rubric used, scoring date
- Filter by: date range, rep name, rubric, overall score range, specific dimension score
- Search by meeting title or participant name (Postgres full-text search)
- Individual call reports are persistent with stable URLs
- Bulk export: download all scores as CSV for external reporting
- Deletion: workspace owner can delete individual calls; bulk deletion with confirmation

**Acceptance criteria:** With 50 scored calls, the library loads in under 2 seconds and filters by rep name return accurate results.

---

### P1 — High-Value Features (Ship Within 90 Days)

#### F-07: Team Trend Dashboard

**Priority:** P1
**User story:** As a sales manager, I want to see how my team's call quality is trending over time so I can identify coaching patterns and measure improvement.

**Details:**
- Time-series chart: average overall team score by week/month (configurable)
- Per-rep performance table: each rep's average score, call count, score trend (up/down indicator)
- Dimension heatmap: which rubric dimensions does the team consistently score low on? (Grid: reps × dimensions, color-coded by average score)
- Most-missed dimension: a persistent callout showing the single lowest-scoring dimension team-wide
- Filter by date range, rep, rubric framework
- Charts built with Recharts (lightweight, SSR-compatible with Next.js)

**Acceptance criteria:** With 10 or more scored calls, the dashboard renders all three views and the dimension heatmap correctly identifies the lowest-average dimension.

---

#### F-08: Multi-Rep Workspace with Role-Based Access

**Priority:** P1
**User story:** As a sales manager, I want to invite my reps to a shared workspace so they can self-score calls and I can see the full team's results in one place.

**Details:**
- Workspace model: one workspace per team; owner (manager) role + member (rep) role
- Owner can: view all members' scored calls, edit rubrics, invite/remove members, view team analytics
- Member can: view their own scored calls, trigger scoring on their own transcripts, view team aggregate analytics (no individual rep data visible to other reps)
- Email-based invite flow with expiring token
- Shared rubric library: owner sets the workspace default rubric; members use it but cannot modify it
- Members can create private rubrics for self-use; private rubrics not visible to team

**Acceptance criteria:** A manager can invite 3 reps via email, each rep scores a call, and the manager sees all 3 scores in the team trend dashboard within 24 hours of the invites being accepted.

---

#### F-09: Score Override and Human Annotation

**Priority:** P1
**User story:** As a manager, I want to override a dimension score I disagree with so the stored record reflects human judgment, and I want my override reasoning saved for coaching conversations.

**Details:**
- Each dimension score has an "Override" action visible to workspace owners and the scoring rep
- Override modal: select new score (0/1/2), required free-text reason (min 10 chars)
- Both AI score and human override score stored in DB — neither is deleted
- Override is visually flagged in the report (e.g., "Overridden by [Name] on [Date]")
- Override rate tracked as a product quality metric (target: <20% of checks overridden)
- Override data not used for automatic re-training in v1 — stored for future analysis

**Acceptance criteria:** Manager can override any dimension score, add a comment, and the report clearly displays both the original AI score and the override with the manager's note.

---

#### F-10: Dimension Weighting in Rubric Editor

**Priority:** P1
**User story:** As a sales manager, I want certain rubric dimensions to count more toward the overall score so the score reflects my team's actual priorities.

**Details:**
- Each dimension in the rubric editor has a weight field (default: 1.0)
- Overall call score = sum(score × weight) / sum(weights) — displayed as a 0–10 scale
- Weights visible in the score report header (e.g., "Need × 2.0, Budget × 1.0")
- Changing weights on an existing rubric creates a new rubric version; old scores are not retroactively recalculated

**Acceptance criteria:** A rubric with Authority weighted at 2x produces a different overall score than the same rubric with equal weights, and the difference is visible in the score report.

---

#### F-11: Weekly Team Digest (Slack + Email)

**Priority:** P1
**User story:** As a sales manager, I want a weekly summary of my team's scoring activity delivered to Slack or email so I stay informed without logging in daily.

**Details:**
- Weekly digest includes: calls scored this week, average team score (vs. prior week), top-scoring rep, most-missed dimension, call count by rep
- Slack integration: user provides incoming webhook URL; digest posted every Monday at a configurable time
- Email integration: digest sent to workspace owner's email address
- Digest format: clean, scannable, no heavy branding — just the numbers
- Digest is opt-in, configurable to weekly/biweekly

**Acceptance criteria:** A configured workspace with at least 3 scored calls in the past week sends a Slack message on Monday containing all five digest elements.

---

### P2 — Future Roadmap (v2 and Beyond)

#### F-12: Auto-Scoring on New Granola Notes

**Priority:** P2
**User story:** As a manager, I want every new Granola transcript to be automatically scored against my default rubric so nothing falls through.
**Details:** Poll Granola API for new notes (or use MCP/webhook when available); auto-enqueue scoring against workspace default rubric; notify rep/manager via Slack or email on completion. Opt-in per workspace.

---

#### F-13: CRM Integration (HubSpot / Salesforce)

**Priority:** P2
**User story:** As a RevOps lead, I want MEDDIC/BANT scores synced to HubSpot deal properties so qualification data lives in the CRM for pipeline reporting and forecasting.
**Details:** OAuth with HubSpot and Salesforce; map rubric dimension scores to custom deal/contact fields; sync triggered on score completion or manually; field mapping configurable per workspace.

---

#### F-14: AI Coaching Suggestions

**Priority:** P2
**User story:** As a rep, I want the system to suggest specific questions I could have asked on dimensions I missed so I can go into the next call better prepared.
**Details:** Post-score second LLM call: given missed dimensions + transcript context, generate 2–3 specific discovery questions the rep could have asked; surface as "Coaching tips" panel below scorecard. Higher LLM cost per call — implement only after core usage patterns are established.

---

#### F-15: Multi-Source Transcript Ingestion

**Priority:** P2
**User story:** As a manager, I want to score calls from Fireflies, tl;dv, or Zoom transcripts (not just Granola) to cover teammates who use other tools.
**Details:** Abstract ingestion layer already designed for it; add parsers for Fireflies VTT export, tl;dv markdown export, Zoom `.transcript` format; normalize all to the same internal speaker-turn schema.

---

#### F-16: Scoring REST API

**Priority:** P2
**User story:** As a RevOps engineer, I want a public REST endpoint that accepts a transcript and rubric ID and returns scores so I can embed call scoring in internal tooling.
**Details:** Authenticated endpoint (`POST /api/v1/score`); returns structured JSON scorecard; rate-limited per API key; usage tracked against workspace billing quota.

---

#### F-17: Call Comparison View

**Priority:** P2
**User story:** As a manager, I want to compare two scored calls side-by-side to show a rep how their performance changed over time or between call types.

---

## 5. Technical Recommendations

### 5.1 Backend

| Component | Recommendation | Rationale |
|---|---|---|
| Language | Python 3.12 | Best-in-class Anthropic SDK support; strong async ecosystem; fastest LLM app iteration |
| Web framework | FastAPI | Async-native, auto-generates OpenAPI docs, lightweight, easy background task integration |
| LLM | Claude 3.5 Sonnet (claude-3-5-sonnet-20241022 or latest) | Best instruction-following for structured JSON output; 200K context handles full transcripts in one call; strong evidence citation accuracy |
| Structured output | Claude tool use / JSON mode | Enforce `check_id`, `score`, `confidence`, `rationale`, `evidence_excerpts[]` schema — reject and retry on parse failure |
| Task queue | Celery + Redis | Background scoring jobs; prevents timeout on long transcripts; enables status polling from frontend |
| Auth | Clerk or Supabase Auth | Fast to ship; handles multi-tenant workspace invite flows; JWT-based |
| Granola client | Custom Python HTTP client | Thin wrapper around Granola Personal API with OAuth token refresh; abstract for v2 multi-source expansion |

### 5.2 Database

| Component | Recommendation | Rationale |
|---|---|---|
| Primary DB | PostgreSQL (Supabase cloud) | Relational model suits the rubric → check → score hierarchy; Supabase adds row-level security for multi-tenant isolation without custom middleware |
| Core tables | `workspaces`, `users`, `workspace_members`, `rubrics`, `rubric_versions`, `rubric_checks`, `transcripts`, `scoring_jobs`, `scored_calls`, `check_scores`, `evidence_citations`, `score_overrides` | Normalized; rubric versioning preserves historical score integrity |
| Caching | Redis | Scoring job status; Granola API response cache (short TTL); rate limit counters |
| Search | pg_trgm (Postgres full-text) | Sufficient for v1 transcript title and participant search; avoid Elasticsearch overhead |
| Analytics queries | Materialized views or pg aggregation | Team trend dashboard queries on `check_scores` group-by rep/week; materialize for workspaces with >500 scored calls |

### 5.3 Frontend

| Component | Recommendation | Rationale |
|---|---|---|
| Framework | Next.js 15 (React, App Router) | Nested layouts (workspace → call library → scorecard → check detail); server components reduce client bundle; strong ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Fast to ship professional UI; shadcn handles tables, modals, command palettes, progress indicators |
| Charts | Recharts | Lightweight; SSR-compatible; handles line, bar, and cell heatmap charts for trend dashboard |
| State / data fetching | TanStack Query (React Query) | Optimistic updates on score overrides; polling for scoring job status; cache invalidation on new scores |
| Forms | React Hook Form + Zod | Rubric editor form validation; type-safe schema from backend |

### 5.4 Infrastructure

| Component | Recommendation | Rationale |
|---|---|---|
| Backend hosting | Railway or Render | Zero-ops for early stage; supports Celery workers and Redis; easy migration path to AWS later |
| Frontend hosting | Vercel | Native Next.js deployment; edge CDN; free tier sufficient for v1 |
| Database | Supabase cloud | Managed Postgres + Auth + Storage + Row-Level Security; fastest time to multi-tenant operational |
| File storage | Supabase Storage | For uploaded transcript files (txt, md) |
| Error monitoring | Sentry | Frontend and backend error tracking from day one |
| Product analytics | PostHog | User behavior tracking: scoring trigger rate, feature adoption, drop-off points |
| LLM observability | Langfuse | Log every prompt/response pair; track token usage per call; monitor scoring quality metrics; alert on parse failures |

### 5.5 Anthropic API Integration Notes

**Prompt architecture:**
- System prompt: rubric definitions, scoring scale descriptions, explicit instruction to extract evidence before scoring, JSON output schema
- User message: normalized transcript as speaker-labeled turns
- Use a single API call per scoring job (all dimensions scored in one pass) to minimize latency and cost
- Fall back to dimension-chunked calls only for transcripts > 150K tokens

**Structured output enforcement:**
- Use Claude tool use with an explicit schema to guarantee parseable JSON every time
- Schema: `{ call_summary: string, dimensions: [{ id, score (0|1|2), confidence ("low"|"medium"|"high"), rationale: string, evidence_excerpts: [{ speaker, text, approx_timestamp_seconds }] }] }`
- Parse failure → log to Langfuse → retry once with temperature 0 → if still failing, return error state to user

**Cost and rate management:**
- Estimated cost: $0.03–0.10 per scored call (Sonnet pricing, 15K–60K tokens per transcript)
- Anthropic Tier 1 limit: ~40K TPM on Sonnet — at 30K tokens/transcript, queue concurrent jobs to avoid rate limit
- Store raw API response in DB for debugging and override analysis
- Monthly LLM cost target: <15% of MRR

---

## 6. Success Metrics

### 6.1 Adoption Metrics (First 90 Days Post-Launch)

| Metric | Target |
|---|---|
| Registered workspaces | 50 |
| Active workspaces (≥1 scored call in past 30 days) | 30 |
| Calls scored per active workspace per month | ≥10 |
| Day-7 retention (workspace scored ≥1 call in first week and returned) | >50% |
| Day-30 retention | >30% |

### 6.2 Product Quality Metrics

| Metric | Target | How Measured |
|---|---|---|
| Scoring latency p95 (calls up to 60 min) | <90 seconds | Server-side timing via Langfuse |
| Evidence citation relevance rate | >80% rated "relevant" by users | In-app thumbs up/down on each citation |
| Score override rate | <20% of check scores overridden | Override table in PostgreSQL |
| Parse failure rate (malformed JSON from Claude) | <1% | Langfuse error tracking |
| User satisfaction post-score (CSAT) | ≥4.0 / 5.0 | Inline prompt shown after each scoring completion |

### 6.3 Business Metrics (End of Year 1)

| Metric | Target |
|---|---|
| Monthly Recurring Revenue | $15,000 MRR |
| Average revenue per workspace | $250–$400/month |
| Monthly churn | <5% |
| LLM API cost as % of revenue | <15% |
| Net Promoter Score | >40 |

### 6.4 Leading Indicators of Real Value

- **Time from call end to score viewed:** Proxy for how embedded the tool is in the post-call workflow. Target: <24 hours for 60%+ of calls.
- **Repeat scoring frequency:** % of workspaces scoring 5+ calls per week. Signals habitual use rather than trial.
- **Trend dashboard weekly active views:** Indicates managers are using data for team coaching, not just one-off curiosity.
- **Score override rate trending down:** As users calibrate trust in the LLM scoring, override rate should decrease over time. Rising override rate = scoring quality problem.

---

## 7. Out of Scope for v1

The following are explicitly deferred to maintain focus and shippability:

| Feature | Why Deferred |
|---|---|
| Auto-scoring / webhook-triggered scoring | On-demand scoring is sufficient to validate core value; auto-scoring adds infrastructure complexity and requires more Granola API access privileges |
| CRM integration (HubSpot, Salesforce) | High integration complexity; scoring value must be proven before CRM sync adds enough pull |
| Real-time call coaching (live audio during calls) | Requires a completely different audio pipeline; incompatible with transcript-based architecture |
| Call recording and transcription | Granola owns this layer; we do not compete with or duplicate it |
| Video playback with transcript sync | Granola does not expose video via API |
| Multi-source transcript ingestion (Fireflies, tl;dv, Zoom) | Granola-first simplifies v1 normalization; multi-source support targeted for v2 |
| AI-generated coaching suggestions per missed dimension | Adds a second LLM call per job; worth building after scoring data validates the core loop |
| Public Scoring REST API | Useful for RevOps engineers; deferred until internal API is stable |
| Mobile app | Use case is desktop-first (post-call review, manager 1:1s) |
| SOC 2 Type II certification | Required for enterprise deals; not blocking for Series A–C SMB customers in v1 |
| Fine-tuned scoring models | Base Claude with rubric-grounded prompting is sufficient; fine-tuning requires labeled data volume that does not yet exist |
| Predictive deal health scoring | Requires multi-call, multi-signal deal-level data; only possible once significant call history is accumulated |
| MEDDPICC or custom scoring scales beyond 0–2 | BANT/MEDDIC/SPICED on a 0–2 scale covers 90% of target customers; advanced scales can be added based on feedback |

---

## 8. Risks and Mitigations

### 8.1 Technical Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Granola Personal API transcript access requires Business/Enterprise plan (restricts basic plan users) | High (confirmed) | Manual upload fallback ships at launch; pricing page communicates Granola plan requirement clearly |
| Granola changes API schema or deprecates endpoints | Medium | Abstract ingestion layer behind an interface; monitor Granola API changelog; build normalizer with version detection |
| LLM evidence citation quality degrades on low-quality transcripts (crosstalk, multiple speakers, poor audio) | Medium | Implement transcript quality score pre-check; surface warning when speaker attribution is ambiguous |
| Token limit exceeded on very long calls (3+ hour enterprise calls) | Low | Chunking logic ships in v1 as a fallback; most discovery calls are 30–60 minutes |
| Claude API latency spikes or outages | Low-medium | Implement retry with exponential backoff; surface job status clearly to user; consider Anthropic Batch API for non-time-sensitive jobs |

### 8.2 Business Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Granola builds native call scoring as the product expands to enterprise (see: $125M raise, March 2026) | Medium | Move fast on distribution; differentiate on rubric flexibility, evidence quality, and pricing — features Granola is unlikely to prioritize as a horizontal tool |
| Gong, Glyphic, or Avoma launches a direct Granola integration | Low-medium | Granola's API is available to anyone; our moat is product focus, faster iteration, and SMB pricing |
| Sales reps resist being scored (surveillance concern) | High | Frame product as a self-coaching tool first, manager tool second; rep-initiated scoring is the primary flow; evidence-grounded scoring is less threatening than opaque "Gong scores" |
| LLM score quality insufficient to drive trust (users override too frequently) | Medium | Launch with a trust-building loop: show evidence first, score second; invite overrides; track override rate as a quality signal; tune prompts with real override data |

---

## 9. Competitive Landscape

| Tool | Price (est.) | Rubric Scoring | Custom Frameworks | Granola-Native | Verbatim Evidence | Target Market |
|---|---|---|---|---|---|---|
| **Gong** | ~$250/user/mo + platform fee | Yes (Gong methodology) | Limited | No | No | Enterprise |
| **Chorus (ZoomInfo)** | Bundled, high | Limited | No | No | No | Enterprise |
| **Clari Copilot** | $120–160/user/mo | Yes (Clari methodology) | Limited | No | No | Enterprise/Mid-Market |
| **Avoma** | $49–129/user/mo | Yes (MEDDIC, SPICED, custom) | Yes | No | Partial | SMB/Mid-Market |
| **Glyphic** | ~$50–80/user/mo est. | Yes (1–5 per check) | Yes | No | Partial | SMB |
| **tl;dv** | Free–$29/user/mo | Basic | No | No | No | SMB/Individual |
| **Fireflies.ai** | $18/user/mo | Basic | No | No | No | SMB/Individual |
| **This product** | ~$20–40/user/mo (target) | Yes (0–2 per check) | Full (BYO rubric + BANT/MEDDIC/SPICED) | **Yes** | **Yes (verbatim)** | SMB/Mid-Market, Granola users |

**Sustainable differentiators:**
1. **Granola-native ingestion** — no meeting bot, no new setup for teams already on Granola; works with Granola's privacy-preserving design
2. **Verbatim evidence on every scored dimension** — not summaries, not inferences; every score is grounded in exact transcript quotes
3. **Fully custom rubric framework** — define any qualification methodology, weight any dimension, not locked to a vendor's scoring model
4. **Single-purpose pricing** — no platform fee, no recording module, no CRM addon; pay for scoring only

---

## 10. Appendix: Granola API Integration Notes

Based on research into Granola's Personal API and developer community reverse-engineering (March 2025–March 2026):

**Authentication:**
- Personal API key: available to users on Business and Enterprise plans
- Workspace admins can enable/disable personal API key creation via Settings → Workspace
- API keys are long-lived (user-managed rotation)

**Key endpoints:**
- `GET /v1/notes` — paginated list of user's meetings (title, date, participants, duration, granola_id)
- `GET /v1/notes/{note_id}?include=transcript` — returns note content + transcript data
- Transcript format: ProseMirror JSON (enhanced notes) + raw transcript JSON with speaker attribution and timestamps

**Transcript structure (normalized output target):**
```json
[
  { "speaker": "Rep", "text": "Can you walk me through your current budget for this initiative?", "start_seconds": 847 },
  { "speaker": "Prospect", "text": "We have roughly $200K approved for Q2 but it's not finalized.", "start_seconds": 863 }
]
```

**Plan constraints:**
- Basic plan: MCP available, last 30 days only, no transcript access via API
- Business/Enterprise plan: full Personal API access with transcript
- Enterprise API: workspace-level admin access to all team notes

**Fallback strategy:** Manual transcript paste or file upload (`.txt`, `.md`) for Basic plan users — ships at launch.

---

*PRD Version 2.0 — March 27, 2026*
*Research sources: TechCrunch (Granola Series C, March 2026), Research and Markets (Conversation Intelligence Market, 2026), Oliv.ai research, G2 reviews, Claap competitive analysis, Hyperbound AI, Granola Docs, AutoSCORE research (arXiv), Langfuse LLM-as-Judge guide, Reddit/Product Hunt user feedback synthesis*
