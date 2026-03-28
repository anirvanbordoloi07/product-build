# Call Scorer — System Architecture
**Version:** 1.1
**Date:** March 27, 2026
**Status:** Draft

---

## Overview

Call Scorer is a Granola-native discovery call intelligence platform. It ingests meeting transcripts, scores them against structured sales qualification frameworks (BANT, MEDDIC, SPICED, or custom rubrics) using Claude via the Anthropic API, and surfaces results in a Next.js dashboard with per-check scores backed by verbatim transcript evidence.

---

## A. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                               │
│                                                                              │
│   ┌─────────────┐   ┌──────────────────┐   ┌────────────┐  ┌─────────────┐ │
│   │ Granola API │   │  Anthropic Claude │   │  Langfuse  │  │   Resend /  │ │
│   │  (OAuth /   │   │  (claude-sonnet-  │   │   (LLM     │  │   Slack     │ │
│   │   API Key)  │   │    4-6, tool_use) │   │  tracing)  │  │  Webhooks   │ │
│   └──────┬──────┘   └────────┬─────────┘   └─────┬──────┘  └──────┬──────┘ │
└──────────│───────────────────│─────────────────────│────────────────│────────┘
           │                   │                     │                │
           ▼                   │                     │                │
┌──────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND (Railway)                                │
│                                                                              │
│   ┌────────────────────────────────────────────────┐                        │
│   │              FastAPI  (port 8000)               │                        │
│   │                                                 │                        │
│   │  /api/auth/*     /api/transcripts/*             │                        │
│   │  /api/rubrics/*  /api/score/*                   │                        │
│   │  /api/scores/*   /api/analytics/*               │                        │
│   │  /api/workspace/*                               │                        │
│   │                                                 │                        │
│   │  Auth: Supabase JWT verification                │                        │
│   │  Rate limit: 10 concurrent jobs / workspace     │                        │
│   └──────────────┬──────────────────────────────────┘                        │
│                  │ enqueue (POST /api/score)                                  │
│                  ▼                                                            │
│   ┌──────────────────────────┐     ┌──────────────────────────────────────┐ │
│   │   Redis  (port 6379)     │────▶│    Celery Worker                     │ │
│   │                          │     │                                      │ │
│   │  • Celery task broker    │◀────│  1. Pull transcript + rubric from DB │ │
│   │  • Job result cache      │     │  2. Assemble prompt                  │ │
│   │  • Rate limit counters   │     │  3. Call Anthropic API               │ │
│   └──────────────────────────┘     │  4. Parse + validate JSON response   │ │
│                                    │  5. Write scored_calls, check_scores  │ │
│                                    │     evidence_citations to Postgres    │ │
│                                    │  6. Log trace to Langfuse            │ │
│                                    │  7. Emit PostHog event               │ │
│                                    │  8. Send digest (Resend / Slack)     │ │
│                                    └──────────────────┬───────────────────┘ │
└───────────────────────────────────────────────────────│─────────────────────┘
                                                        │ reads/writes
                                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER (Supabase)                           │
│                                                                              │
│   PostgreSQL (RLS enforced per workspace)                                    │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  users · workspaces · workspace_members · granola_connections        │  │
│   │  rubrics · rubric_checks                                             │  │
│   │  transcripts (normalized_segments JSONB)                             │  │
│   │  scoring_jobs (queued → processing → completed/failed)               │  │
│   │  scored_calls · check_scores · evidence_citations                    │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Supabase Auth (JWT issuance + session mgmt)                                │
│   Supabase Storage (uploaded transcript files)                               │
└──────────────────────────────────────────────────────────────────────────────┘
           ▲
           │ REST / Supabase JS client
           │
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vercel)                                   │
│                                                                              │
│   Next.js 15 (App Router)                                                    │
│                                                                              │
│   /login          → Supabase Auth UI                                         │
│   /dashboard      → Score trends + recent calls                              │
│   /transcripts    → Import from Granola or upload                            │
│   /calls/:id      → Score report with per-check breakdown + evidence        │
│   /rubrics        → Manage scoring frameworks                                │
│   /settings       → Workspace, members, Granola API key                      │
│                                                                              │
│   Polling: GET /api/score/:job_id/status every 3s until complete            │
└──────────────────────────────────────────────────────────────────────────────┘


Data Flow Summary (happy path):
────────────────────────────────
User → Next.js → POST /api/score → FastAPI → Redis (enqueue)
                                                    ↓
                                            Celery Worker
                                                    ↓
                                        Granola API (transcript fetch)
                                                    ↓
                                        Anthropic Claude (score)
                                                    ↓
                                        PostgreSQL (store results)
                                                    ↓
                                   Langfuse (trace) + PostHog (event)
                                                    ↓
                              Next.js polls status → renders score report
```

---

## B. Request & Data Flow

### Full Request Lifecycle (Step-by-Step)

```
1. User authenticates (Supabase Auth → JWT issued)
2. User connects Granola API key OR uploads transcript file
3. Transcript ingested → normalized to: { speaker, text, timestamp }[]
4. User selects rubric (BANT / MEDDIC / SPICED / custom) + clicks "Score"
5. POST /api/score → FastAPI enqueues Celery task (returns job_id immediately)
6. Celery worker picks up task from Redis queue
7. Worker builds prompt: system prompt (rubric checks injected) + user message (transcript)
8. Anthropic API call (claude-sonnet-4-6, tool_use mode for structured output)
9. Claude returns structured JSON: { checks: [{ check_id, score, rationale, evidence_excerpts }] }
10. Worker parses response, writes rows to: scoring_jobs, scored_calls, check_scores, evidence_citations
11. Job status updated to "completed" in Redis + PostgreSQL
12. Frontend polls GET /api/score/:job_id/status until status = "completed"
13. Frontend fetches GET /api/scores/:id → renders score report
```

### Transcript Ingestion Sub-Flow

```
Option A — Granola API:
  User provides Granola API key (stored encrypted in DB)
  → GET granola_api/meetings (list last 30)
  → User selects meeting
  → GET granola_api/meetings/:id/transcript
  → Raw Granola JSON parsed by normalizer
  → Output: TranscriptSegment[] = { speaker: str, text: str, timestamp: str }

Option B — Manual Upload:
  User pastes or uploads .txt / .docx / .json transcript file
  → File stored in Supabase Storage
  → Normalizer detects format, parses speaker turns
  → Output: same TranscriptSegment[] format
```

### Scoring Sub-Flow (Celery Worker)

```
Worker receives: { job_id, transcript_id, rubric_id, workspace_id }

1. Fetch transcript segments from DB
2. Fetch rubric + checks from DB
3. Assemble prompt (see Section D)
4. Check token count:
   - If < 150K tokens: single Anthropic API call (full rubric + full transcript)
   - If >= 150K tokens: chunk transcript by speaker segment; score in passes, merge results
5. Call Anthropic API with tool_use for structured output enforcement
6. Parse tool_call response JSON
7. Validate against Pydantic schema (ScoreResult)
8. Write to PostgreSQL (scored_calls, check_scores, evidence_citations)
9. Update job status → "completed"
10. Log full prompt + response to Langfuse
11. Emit PostHog event: scoring_completed { workspace_id, rubric_type, duration_ms, token_count }
```

---

## C. Database Schema

### Design Principles
- Multi-tenant via `workspace_id` foreign key on all core tables
- Row-Level Security (RLS) enforced at Supabase layer — all queries filter by workspace
- Soft deletes with `deleted_at` where data preservation matters
- `created_at` / `updated_at` on all tables
- UUIDs for all primary keys

---

### Table Definitions

#### `users`
Managed primarily by Supabase Auth. This table extends the auth.users record.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `workspaces`
A workspace maps to an organization or team. All data is scoped to a workspace.

```sql
CREATE TABLE workspaces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  owner_id          UUID NOT NULL REFERENCES users(id),
  granola_api_key   TEXT,                   -- encrypted at rest
  default_rubric_id UUID,                   -- FK set after rubrics table created
  plan              TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'enterprise'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `workspace_members`
Maps users to workspaces with roles.

```sql
CREATE TABLE workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
  invited_by   UUID REFERENCES users(id),
  joined_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);
```

---

#### `transcripts`
Stores normalized transcript data and source metadata.

```sql
CREATE TABLE transcripts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by      UUID NOT NULL REFERENCES users(id),
  title            TEXT NOT NULL,
  meeting_date     DATE,
  duration_seconds INT,
  source           TEXT NOT NULL DEFAULT 'upload',  -- 'granola_api' | 'upload'
  granola_meeting_id TEXT,                           -- external ID from Granola
  raw_content      JSONB,                            -- original Granola JSON or uploaded text
  normalized_segments JSONB NOT NULL,               -- TranscriptSegment[]
  storage_path     TEXT,                             -- Supabase Storage path for uploaded file
  participant_names TEXT[],
  word_count       INT,
  token_estimate   INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_transcripts_workspace ON transcripts(workspace_id);
CREATE INDEX idx_transcripts_meeting_date ON transcripts(meeting_date DESC);
```

---

#### `rubrics`
A rubric is a named collection of checks (e.g., "MEDDIC Q4 2026").

```sql
CREATE TABLE rubrics (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  framework      TEXT NOT NULL DEFAULT 'custom',  -- 'bant' | 'meddic' | 'spiced' | 'custom'
  description    TEXT,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  scoring_scale  JSONB NOT NULL DEFAULT '{"min": 0, "max": 2, "labels": {"0": "Not covered", "1": "Partially covered", "2": "Fully covered"}}',
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_rubrics_workspace ON rubrics(workspace_id);
```

---

#### `rubric_checks`
Individual checks within a rubric (e.g., "Economic Buyer", "Identify Pain").

```sql
CREATE TABLE rubric_checks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id      UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  check_key      TEXT NOT NULL,   -- machine key, e.g. 'economic_buyer'
  label          TEXT NOT NULL,   -- display name, e.g. 'Economic Buyer'
  description    TEXT NOT NULL,   -- what "good" looks like for this check
  example        TEXT,            -- optional example of ideal rep behavior
  weight         NUMERIC NOT NULL DEFAULT 1.0,  -- for weighted average overall score
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rubric_id, check_key)
);

CREATE INDEX idx_rubric_checks_rubric ON rubric_checks(rubric_id);
```

---

#### `scoring_jobs`
Tracks the lifecycle of each async scoring request.

```sql
CREATE TABLE scoring_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  transcript_id   UUID NOT NULL REFERENCES transcripts(id),
  rubric_id       UUID NOT NULL REFERENCES rubrics(id),
  requested_by    UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'queued',  -- 'queued' | 'processing' | 'completed' | 'failed'
  celery_task_id  TEXT,
  error_message   TEXT,
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,
  tokens_used     INT,
  llm_cost_usd    NUMERIC(10, 6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scoring_jobs_workspace ON scoring_jobs(workspace_id);
CREATE INDEX idx_scoring_jobs_status ON scoring_jobs(status);
CREATE INDEX idx_scoring_jobs_transcript ON scoring_jobs(transcript_id);
```

---

#### `scored_calls`
The top-level result record for a completed scoring job.

```sql
CREATE TABLE scored_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  scoring_job_id    UUID NOT NULL REFERENCES scoring_jobs(id),
  transcript_id     UUID NOT NULL REFERENCES transcripts(id),
  rubric_id         UUID NOT NULL REFERENCES rubrics(id),
  scored_by         UUID NOT NULL REFERENCES users(id),  -- the user who triggered scoring
  overall_score     NUMERIC(5,2),                        -- computed weighted average
  max_possible      NUMERIC(5,2),
  score_pct         NUMERIC(5,2),                        -- 0–100
  raw_llm_response  JSONB,                               -- full API response for audit
  manager_notes     TEXT,
  scored_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_scored_calls_workspace ON scored_calls(workspace_id);
CREATE INDEX idx_scored_calls_scored_at ON scored_calls(scored_at DESC);
CREATE INDEX idx_scored_calls_transcript ON scored_calls(transcript_id);
```

---

#### `check_scores`
Per-check score results for a scored call.

```sql
CREATE TABLE check_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scored_call_id    UUID NOT NULL REFERENCES scored_calls(id) ON DELETE CASCADE,
  rubric_check_id   UUID NOT NULL REFERENCES rubric_checks(id),
  check_key         TEXT NOT NULL,   -- denormalized for query convenience
  ai_score          INT NOT NULL,    -- 0 | 1 | 2 (or per rubric scale)
  ai_rationale      TEXT NOT NULL,
  override_score    INT,             -- null if not overridden
  override_note     TEXT,
  overridden_by     UUID REFERENCES users(id),
  overridden_at     TIMESTAMPTZ,
  final_score       INT GENERATED ALWAYS AS (COALESCE(override_score, ai_score)) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scored_call_id, rubric_check_id)
);

CREATE INDEX idx_check_scores_scored_call ON check_scores(scored_call_id);
CREATE INDEX idx_check_scores_rubric_check ON check_scores(rubric_check_id);
```

---

#### `evidence_citations`
Verbatim transcript excerpts cited as evidence for each check score.

```sql
CREATE TABLE evidence_citations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_score_id   UUID NOT NULL REFERENCES check_scores(id) ON DELETE CASCADE,
  speaker          TEXT NOT NULL,
  text             TEXT NOT NULL,    -- verbatim quote from transcript
  timestamp        TEXT,             -- e.g. "00:14:32"
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_citations_check_score ON evidence_citations(check_score_id);
```

---

#### `granola_connections`
Stores per-user Granola API credentials. One user can have one active connection per workspace.
Granola API keys are encrypted at rest using AES-256 via `GRANOLA_ENCRYPTION_KEY`.

```sql
CREATE TABLE granola_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_api_key   TEXT NOT NULL,             -- AES-256 encrypted; decrypted only in worker
  api_key_hint        TEXT,                      -- last 4 chars of raw key for display (e.g., "...j7Kx")
  granola_user_email  TEXT,                      -- verified Granola account email, for display
  granola_user_id     TEXT,                      -- Granola's internal user identifier
  status              TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'revoked' | 'invalid'
  last_sync_at        TIMESTAMPTZ,               -- last successful Granola API call
  last_error          TEXT,                      -- last API error message, for UI feedback
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)                 -- one connection per user per workspace
);

CREATE INDEX idx_granola_connections_workspace ON granola_connections(workspace_id);
CREATE INDEX idx_granola_connections_user ON granola_connections(user_id);
```

**Note:** The Granola API key is decrypted in memory only within the Celery worker at scoring time and for the `/api/granola/meetings` listing endpoint. The raw key is never written to logs or returned in API responses.

---

#### `digest_subscriptions`
Controls who receives email and Slack digests and at what cadence. P1 feature (off by default in v1).

```sql
CREATE TABLE digest_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- null = workspace-level Slack digest
  channel         TEXT NOT NULL,       -- 'email' | 'slack'
  frequency       TEXT NOT NULL DEFAULT 'weekly',  -- 'daily' | 'weekly'
  slack_webhook_url TEXT,              -- encrypted Slack incoming webhook URL (channel-specific)
  email_override  TEXT,                -- override recipient email (for shared team aliases)
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digest_subscriptions_workspace ON digest_subscriptions(workspace_id);
```

---

### Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scored_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Users can only see workspaces they are members of
CREATE POLICY workspace_isolation ON transcripts
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Same policy pattern applied to: rubrics, scoring_jobs, scored_calls
-- (repeat for each table, substituting the table name)

-- Check scores and evidence are accessible via their parent scored_call
CREATE POLICY check_scores_via_workspace ON check_scores
  FOR ALL USING (
    scored_call_id IN (
      SELECT id FROM scored_calls WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY evidence_via_check_score ON evidence_citations
  FOR ALL USING (
    check_score_id IN (
      SELECT cs.id FROM check_scores cs
      JOIN scored_calls sc ON cs.scored_call_id = sc.id
      WHERE sc.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );
```

---

## D. API Endpoints

All endpoints are prefixed with `/api`. Auth header: `Authorization: Bearer <supabase_jwt>`. Workspace is inferred from JWT claims. Non-authenticated routes are marked.

---

### Authentication (proxied via Supabase)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | New user registration (delegates to Supabase) |
| POST | `/api/auth/login` | Email/password login → JWT |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh JWT |

---

### Transcripts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transcripts` | List all transcripts for workspace. Query params: `?page`, `?search`, `?date_from`, `?date_to` |
| POST | `/api/transcripts` | Create transcript from Granola API pull (body: `{ granola_meeting_id }`) |
| POST | `/api/transcripts/upload` | Upload transcript file (multipart/form-data). Stores to Supabase Storage → normalizes |
| GET | `/api/transcripts/:id` | Fetch single transcript with normalized segments |
| DELETE | `/api/transcripts/:id` | Soft-delete transcript |
| GET | `/api/granola/meetings` | List available Granola meetings for connected API key |

---

### Rubrics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rubrics` | List all rubrics for workspace |
| POST | `/api/rubrics` | Create a new rubric (include `checks[]` in body) |
| GET | `/api/rubrics/:id` | Fetch rubric with all checks |
| PUT | `/api/rubrics/:id` | Update rubric metadata or checks |
| DELETE | `/api/rubrics/:id` | Soft-delete rubric |
| GET | `/api/rubrics/templates` | Return built-in BANT / MEDDIC / SPICED templates (no auth required) |

---

### Scoring
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/score` | Enqueue a scoring job. Body: `{ transcript_id, rubric_id }`. Returns `{ job_id }` immediately |
| GET | `/api/score/:job_id/status` | Poll job status. Returns `{ status, scored_call_id? }` |

---

### Scored Calls
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scores` | List all scored calls. Query params: `?page`, `?rubric_id`, `?date_from`, `?date_to`, `?search` |
| GET | `/api/scores/:id` | Fetch full score report: call metadata + per-check scores + evidence citations |
| DELETE | `/api/scores/:id` | Soft-delete scored call |
| PUT | `/api/scores/:id/notes` | Save manager coaching notes on a scored call |
| PUT | `/api/scores/:id/checks/:check_id/override` | Override a check score. Body: `{ score: int, note: str }` |

---

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/trends` | Weekly/monthly score trends. Params: `?date_from`, `?date_to`, `?rubric_id`, `?user_id` |
| GET | `/api/analytics/check-heatmap` | Per-check average scores across all calls in date range |
| GET | `/api/analytics/rep-breakdown` | Per-rep average scores |

---

### Workspace & Members
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workspace` | Fetch current workspace details |
| PUT | `/api/workspace` | Update workspace name, default rubric, Granola API key |
| GET | `/api/workspace/members` | List all workspace members |
| POST | `/api/workspace/members/invite` | Send email invite to new member |
| DELETE | `/api/workspace/members/:user_id` | Remove member from workspace |

---

### Response Shape Conventions

**Scoring job status response:**
```json
{
  "job_id": "uuid",
  "status": "queued | processing | completed | failed",
  "scored_call_id": "uuid | null",
  "error": "string | null",
  "queued_at": "ISO8601",
  "completed_at": "ISO8601 | null"
}
```

**Full score report response:**
```json
{
  "id": "uuid",
  "transcript": { "id": "uuid", "title": "string", "meeting_date": "date", "duration_seconds": 3600 },
  "rubric": { "id": "uuid", "name": "MEDDIC Q4", "framework": "meddic" },
  "overall_score": 8,
  "max_possible": 12,
  "score_pct": 66.7,
  "scored_at": "ISO8601",
  "manager_notes": "string | null",
  "checks": [
    {
      "check_id": "uuid",
      "check_key": "economic_buyer",
      "label": "Economic Buyer",
      "ai_score": 2,
      "ai_rationale": "Rep confirmed CFO approval required and named her directly.",
      "override_score": null,
      "final_score": 2,
      "evidence": [
        {
          "speaker": "Rep",
          "text": "So Sarah Chen is the one who signs off on this budget?",
          "timestamp": "00:14:32"
        }
      ]
    }
  ]
}
```

---

## E. Digest Integrations (Resend + Slack)

### Overview

Both integrations are P1 features, disabled by default in v1 via `ENABLE_SLACK_DIGEST=false`. When enabled, a weekly Celery beat task (`send_weekly_digest`) fires every Monday at 8:00 AM workspace-local time.

### Email Digest (Resend)

**Trigger:** Celery beat schedule or manual POST `/api/digests/send`

**Payload assembled by `services/digest_service.py`:**
- Top 5 scored calls from the past 7 days (by `score_pct` descending)
- Per-check average heatmap (lowest-scoring checks highlighted)
- Rep leaderboard if `>1` active rep in workspace

**Sending:**

```python
import resend

resend.api_key = settings.RESEND_API_KEY

resend.Emails.send({
    "from": "Call Scorer <digest@callscorer.ai>",
    "to": recipient_email,
    "subject": f"Your weekly call scoring digest — {week_label}",
    "html": rendered_html_template,    # Jinja2 template → HTML
})
```

**Environment variables required:**
```
RESEND_API_KEY=re_...
DIGEST_FROM_EMAIL=digest@callscorer.ai
DIGEST_FROM_NAME=Call Scorer
```

---

### Slack Digest (Incoming Webhook)

**Trigger:** Same Celery beat task; fires if workspace has an active Slack digest subscription.

**Webhook URL:** Stored encrypted in `digest_subscriptions.slack_webhook_url`. Decrypted in worker at send time.

**Message format:** Slack Block Kit. Summary card + top 3 calls + lowest-scoring check callout.

```python
import httpx

payload = {
    "blocks": [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"Call Scoring Digest — {week_label}"}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Calls scored:* {call_count}"},
                {"type": "mrkdwn", "text": f"*Avg score:* {avg_score_pct:.0f}%"},
            ]
        },
        # ... top call blocks ...
    ]
}

async with httpx.AsyncClient() as client:
    response = await client.post(webhook_url, json=payload)
    response.raise_for_status()
```

**Environment variables required:**
```
# Stored per-workspace in digest_subscriptions table (encrypted).
# No global SLACK_WEBHOOK_URL — each workspace configures its own.
SLACK_ENCRYPTION_KEY=change-me-to-32-byte-hex-string
```

---

### Granola API Integration (Per-User)

Per-user API key stored in `granola_connections`. The ingestion service uses the key for two operations:

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| List meetings | `GET /v1/meetings` | Populate meeting picker in UI |
| Fetch transcript | `GET /v1/meetings/:id/transcript` | Pull normalized transcript JSON |

**Key client pattern (`services/granola_client.py`):**

```python
class GranolaClient:
    def __init__(self, api_key: str):
        self._client = httpx.AsyncClient(
            base_url=settings.GRANOLA_API_BASE_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )

    async def list_meetings(self, limit: int = 30) -> list[dict]:
        resp = await self._client.get("/meetings", params={"limit": limit})
        resp.raise_for_status()
        return resp.json()["meetings"]

    async def get_transcript(self, meeting_id: str) -> list[dict]:
        resp = await self._client.get(f"/meetings/{meeting_id}/transcript")
        resp.raise_for_status()
        return resp.json()["segments"]  # raw Granola segment format
```

The raw Granola segments are then passed through `TranscriptNormalizer` to produce the canonical `TranscriptSegment[]` format stored in `transcripts.normalized_segments`.

---

## F. Anthropic API Prompt Design

### Approach

- **Method:** Anthropic tool_use (function calling) to enforce structured JSON output
- **Model:** `claude-sonnet-4-6`
- **Single-pass scoring:** Full rubric + full transcript in one API call where token budget allows
- **Chunking fallback:** If transcript exceeds 150K tokens, split into overlapping speaker-turn segments, score per chunk, merge results (highest-evidence score wins per check)

---

### Tool Definition (Pydantic → JSON Schema)

The tool definition sent to Claude enforces the response schema:

```python
SCORING_TOOL = {
    "name": "submit_call_scores",
    "description": (
        "Submit structured scores for each rubric check based on the transcript provided. "
        "You must evaluate every check listed and provide a score, rationale, and verbatim evidence."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "checks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "check_id": {
                            "type": "string",
                            "description": "The check_key exactly as listed in the rubric (e.g., 'economic_buyer')"
                        },
                        "score": {
                            "type": "integer",
                            "enum": [0, 1, 2],
                            "description": "0 = Not covered, 1 = Partially covered, 2 = Fully covered"
                        },
                        "rationale": {
                            "type": "string",
                            "description": "1–2 sentence explanation of the score. Be specific and grounded in the transcript."
                        },
                        "evidence_excerpts": {
                            "type": "array",
                            "description": "Verbatim quotes from the transcript that support the score. Empty array if score is 0.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "speaker": { "type": "string" },
                                    "text": { "type": "string", "description": "Verbatim quote — do not paraphrase." },
                                    "timestamp": { "type": "string", "description": "Timestamp if available (e.g., '00:14:32'), else empty string." }
                                },
                                "required": ["speaker", "text", "timestamp"]
                            }
                        }
                    },
                    "required": ["check_id", "score", "rationale", "evidence_excerpts"]
                }
            }
        },
        "required": ["checks"]
    }
}
```

---

### System Prompt Template

```
You are an expert sales call quality analyst. Your job is to evaluate a discovery call transcript against a structured sales qualification rubric and score it with precision.

## Your Task

Evaluate the transcript provided against each rubric check below. For each check:
- Assign a score using the scale defined
- Write a 1–2 sentence rationale grounded in specific transcript content
- Quote verbatim excerpts from the transcript as evidence (exact words, not paraphrases)
- If a check was not addressed in the call, score it 0 and leave evidence_excerpts empty

## Scoring Scale

0 = Not covered — the topic was not raised or addressed at any point in the call
1 = Partially covered — the topic was touched on but not fully explored or confirmed
2 = Fully covered — the topic was thoroughly addressed with clear confirmation from the prospect

## Rubric Checks

You must score EVERY check listed below. Do not skip any.

{RUBRIC_CHECKS_BLOCK}

## Rules

- Quote VERBATIM from the transcript. Never paraphrase evidence excerpts.
- Include the speaker label and timestamp for each excerpt whenever available.
- Do not infer or assume things not explicitly stated in the transcript.
- If a check is only implicitly addressed (e.g., budget implied but never confirmed), score it 1 and explain the gap in your rationale.
- You MUST use the submit_call_scores tool to return your evaluation. Do not return a text response.
- Score every check listed — the output must contain exactly {NUM_CHECKS} entries in the checks array.

## Output Format

Use the submit_call_scores tool. Return all checks in the order they appear in the rubric above.
```

The `{RUBRIC_CHECKS_BLOCK}` is injected at runtime by the Celery worker:

```python
def build_rubric_checks_block(checks: list[RubricCheck]) -> str:
    lines = []
    for i, check in enumerate(checks, 1):
        lines.append(f"### Check {i}: {check.label} (check_id: {check.check_key})")
        lines.append(f"Description: {check.description}")
        if check.example:
            lines.append(f"Example of ideal coverage: {check.example}")
        lines.append("")
    return "\n".join(lines)
```

---

### User Message Template

```python
def build_user_message(transcript_segments: list[TranscriptSegment]) -> str:
    lines = ["## Transcript\n"]
    for seg in transcript_segments:
        ts = f"[{seg.timestamp}] " if seg.timestamp else ""
        lines.append(f"{ts}{seg.speaker}: {seg.text}")
    return "\n".join(lines)
```

---

### Full API Call (Python)

```python
import anthropic

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=system_prompt,          # rubric-injected system prompt
    messages=[
        {"role": "user", "content": user_message}  # normalized transcript
    ],
    tools=[SCORING_TOOL],
    tool_choice={"type": "any"}    # force tool use, no text-only fallback
)

# Extract tool_use block
tool_result = next(
    block for block in response.content
    if block.type == "tool_use" and block.name == "submit_call_scores"
)
score_data = tool_result.input  # dict matching SCORING_TOOL input_schema
```

---

### Langfuse Logging

Every API call is wrapped in a Langfuse trace:

```python
from langfuse import Langfuse
langfuse = Langfuse()

trace = langfuse.trace(
    name="call_scoring",
    metadata={"workspace_id": job.workspace_id, "rubric": rubric.name}
)
generation = trace.generation(
    name="score_transcript",
    model="claude-sonnet-4-6",
    input={"system": system_prompt, "user": user_message},
    output=score_data,
    usage={"input": response.usage.input_tokens, "output": response.usage.output_tokens}
)
```

---

## G. Environment Variables

See `.env.example` in `/app/call-scorer/` (committed as a template, never with real values).

Key variable groups:

| Group | Variables |
|-------|-----------|
| Anthropic | `ANTHROPIC_API_KEY` |
| Supabase (backend) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Supabase (frontend) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Database | `DATABASE_URL` |
| Redis / Celery | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| App config | `ENVIRONMENT`, `SECRET_KEY`, `ALLOWED_ORIGINS` |
| Granola | `GRANOLA_API_BASE_URL` |
| Observability | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` |
| Error tracking | `SENTRY_DSN` |
| Analytics | `POSTHOG_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY` |

---

## H. Infrastructure

### Hosting Overview

| Service | Provider | Notes |
|---------|----------|-------|
| FastAPI backend | Railway | Web service, auto-deploy from `main` branch |
| Celery worker | Railway | Second service in same project, same codebase, `CMD: celery -A app.worker worker` |
| Redis | Railway | Managed Redis plugin |
| PostgreSQL | Supabase | Managed Postgres + Auth + Storage + RLS |
| Next.js frontend | Vercel | Connected to `frontend/` subdirectory |
| LLM observability | Langfuse Cloud | Or self-hosted via Railway |

---

### Local Development Setup

**Prerequisites:** Docker Desktop, Python 3.12, Node.js 20+, Poetry or pip

**Ports:**
| Service | Port |
|---------|------|
| FastAPI | 8000 |
| Celery worker | (no HTTP port, background) |
| Redis | 6379 |
| PostgreSQL | 5432 |
| Next.js | 3000 |
| Langfuse (optional local) | 3001 |

**Starting all services:**

```bash
# Terminal 1: Local infrastructure (Redis + Postgres)
cd /path/to/call-scorer
docker-compose up

# Terminal 2: FastAPI backend
cd backend/
poetry install
uvicorn app.main:app --reload --port 8000

# Terminal 3: Celery worker
cd backend/
celery -A app.worker worker --loglevel=info --concurrency=2

# Terminal 4: Next.js frontend
cd frontend/
npm install
npm run dev
```

**Supabase local (optional):**
```bash
npx supabase start   # starts local Supabase on ports 54321 (API) + 54322 (Studio)
npx supabase db reset  # applies all migrations
```

---

### docker-compose.yml

See `docker-compose.yml` in `/app/call-scorer/` for local Redis + Postgres services.

---

### Railway Deployment

**Environment services in one Railway project:**
1. `web` — FastAPI: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. `worker` — Celery: `celery -A app.worker worker --loglevel=info`
3. `redis` — Railway Redis plugin

**Deployment triggers:** GitHub push to `main` → Railway auto-deploys both `web` and `worker`.

**Health check:** `GET /health` → `{ "status": "ok", "version": "1.0.0" }`

---

### Vercel Deployment (Frontend)

- Root directory: `frontend/`
- Build command: `npm run build`
- Environment variables: set `NEXT_PUBLIC_*` vars in Vercel dashboard
- Preview deployments on every PR branch

---

## I. Project Directory Structure

```
call-scorer/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app factory
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── worker.py            # Celery app
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── transcripts.py
│   │   │   ├── rubrics.py
│   │   │   ├── scoring.py
│   │   │   ├── scores.py
│   │   │   └── analytics.py
│   │   ├── tasks/
│   │   │   └── scoring_task.py  # Celery task: run_scoring_job()
│   │   ├── services/
│   │   │   ├── anthropic_client.py  # Prompt assembly + API call
│   │   │   ├── transcript_normalizer.py
│   │   │   ├── granola_client.py
│   │   │   └── langfuse_logger.py
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic schemas
│   │   └── db/
│   │       ├── client.py        # Supabase client
│   │       └── migrations/      # SQL migration files
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/                    # Next.js 15 (separate team)
├── docker-compose.yml           # Local dev: Redis + Postgres
├── .env.example
└── ARCHITECTURE.md
```

---

## J. Security Notes

- Granola API keys stored encrypted (AES-256) in the `workspaces` table; decrypted only in the Celery worker at scoring time
- All API routes require valid Supabase JWT; workspace_id extracted from token claims, never from request body
- Supabase RLS enforces workspace isolation at the DB layer — even if application logic has a bug, cross-workspace data leakage is blocked
- `SUPABASE_SERVICE_ROLE_KEY` is used only server-side (Celery worker, FastAPI) — never exposed to frontend
- LLM responses stored as JSONB for audit trail; PII in transcripts is the customer's responsibility (Supabase data region should be configurable)
- Rate limiting on `POST /api/score`: 10 concurrent jobs per workspace, 100 jobs/day on free tier

---

## K. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Async scoring | Celery + Redis | Prevents HTTP timeout; scoring takes 10–90s for long transcripts |
| Structured LLM output | Anthropic tool_use | Enforces exact JSON schema; eliminates parsing failures |
| Multi-tenant isolation | Supabase RLS | Defense-in-depth; workspace isolation holds even if app layer bugs |
| Single-pass scoring | One API call per job | Cheaper, faster, simpler; chunking only for transcripts > 150K tokens |
| Score override | Separate column, both preserved | Preserves AI score for accuracy tracking; override feeds future improvement analysis |
| Evidence as separate table | `evidence_citations` table | Enables per-citation feedback widget (F-04); future accuracy metrics |
| Frontend polling | GET /api/score/:job_id/status | Simpler than WebSockets for v1; replace with SSE or WebSocket in v2 if UX demands it |
