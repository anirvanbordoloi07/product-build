# Call Scorer — Backend Notes

Generated: 2026-03-27

---

## What Was Built

A complete Python/FastAPI backend for scoring discovery calls against sales
qualification rubrics using Claude AI.

---

## Endpoint Inventory

### Auth  (`/auth/*`)

| Method | Path             | Auth Required | Description                              |
|--------|------------------|---------------|------------------------------------------|
| POST   | `/auth/register` | No            | Register email + password via Supabase Auth |
| POST   | `/auth/login`    | No            | Login — returns JWT Bearer token         |
| POST   | `/auth/logout`   | No            | Client-side session cleanup              |

**JWT flow:** Supabase issues HS256 JWTs. The backend validates them using
`SUPABASE_JWT_SECRET` via `PyJWT`. All `/api/*` endpoints require
`Authorization: Bearer <token>`.

---

### Granola Integration  (`/api/granola/*`)

| Method | Path                                    | Description                        |
|--------|-----------------------------------------|------------------------------------|
| POST   | `/api/granola/connect`                  | Save Granola API key for workspace |
| GET    | `/api/granola/meetings`                 | List meetings from Granola API     |
| GET    | `/api/granola/meetings/{id}/transcript` | Fetch + normalise + ingest         |

The Granola API key is stored in `workspace_settings` (key=`granola_api_key`).
The normaliser auto-detects 6 transcript formats (timestamped speaker, plain
speaker:text, block format, JSON segments array, plain paragraphs).

---

### Transcripts  (`/api/transcripts/*`)

| Method | Path                      | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | `/api/transcripts/upload` | Manual upload (text or Markdown)   |
| GET    | `/api/transcripts`        | List transcripts for workspace     |
| GET    | `/api/transcripts/{id}`   | Single transcript + segments       |

**Query params for list:** `workspace_id` (required), `limit` (max 200), `offset`

---

### Rubrics  (`/api/rubrics/*`)

| Method | Path                 | Description                            |
|--------|----------------------|----------------------------------------|
| GET    | `/api/rubrics`       | List rubrics (prebuilt + workspace)    |
| POST   | `/api/rubrics`       | Create custom rubric with checks array |
| GET    | `/api/rubrics/{id}`  | Single rubric with all checks          |
| PUT    | `/api/rubrics/{id}`  | Update (workspace-owned only)          |
| DELETE | `/api/rubrics/{id}`  | Delete (workspace-owned only)          |

**Prebuilt rubrics:** BANT, MEDDIC, SPICED — seeded on startup.
Cannot be modified or deleted. `workspace_id` is NULL for prebuilt rubrics.

**Create rubric body:**
```json
{
  "name": "My Custom Rubric",
  "framework": "CUSTOM",
  "workspace_id": "uuid",
  "description": "Optional description",
  "checks": [
    {
      "check_key": "problem_clarity",
      "label": "Problem Clarity",
      "description": "Has the prospect clearly described the core problem?",
      "weight": 1.5
    }
  ]
}
```

---

### Scoring  (`/api/score-jobs/*`)

| Method | Path                    | Description                          |
|--------|-------------------------|--------------------------------------|
| POST   | `/api/score-jobs`       | Trigger async scoring job            |
| GET    | `/api/score-jobs/{id}`  | Poll status + get result when done   |

**Request body:**
```json
{
  "transcript_id": "uuid",
  "rubric_id":     "uuid",
  "workspace_id":  "uuid"
}
```

**Response (202 Accepted):**
```json
{
  "job_id":        "uuid",
  "status":        "pending",
  "transcript_id": "uuid",
  "rubric_id":     "uuid",
  "workspace_id":  "uuid",
  "created_at":    "2026-03-27T..."
}
```

**Poll response when complete:**
```json
{
  "job_id":  "uuid",
  "status":  "complete",
  "result":  { /* ScoredCallDetail — see below */ }
}
```

---

### Calls  (`/api/calls/*`)

| Method | Path                        | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/api/calls`                | List scored calls (with filters)         |
| GET    | `/api/calls/{id}`           | Full scorecard with evidence citations   |
| POST   | `/api/calls/{id}/overrides` | Human override a check score             |

**List filters (all optional):**
- `workspace_id` — required
- `rep_name` — partial match (case-insensitive)
- `rubric_id` — exact UUID match
- `score_min` / `score_max` — score_pct range 0–100
- `date_from` / `date_to` — ISO date strings

**Full scorecard shape:**
```json
{
  "id": "uuid",
  "transcript_id": "uuid",
  "rubric_id": "uuid",
  "workspace_id": "uuid",
  "overall_score": 17.5,
  "max_possible_score": 21.0,
  "score_pct": 83.33,
  "rep_name": "Alex Chen",
  "prospect_company": "Acme Corp",
  "call_date": "2026-03-20T...",
  "scored_at": "2026-03-27T...",
  "rubric_name": "BANT",
  "framework": "BANT",
  "check_scores": [
    {
      "id": "uuid",
      "check_key": "budget_confirmed",
      "check_label": "Budget Confirmed",
      "score": 2,
      "rationale": "Prospect confirmed $50K budget approved for Q2.",
      "is_overridden": false,
      "evidence_citations": [
        {
          "speaker": "Sarah (Prospect)",
          "text": "We have $50K approved for this quarter",
          "timestamp": "05:42"
        }
      ]
    }
  ]
}
```

**Override body:**
```json
{
  "check_score_id": "uuid",
  "override_score": 1,
  "override_note": "Budget was mentioned but not confirmed — downgrading to 1"
}
```

---

### Analytics  (`/api/analytics/*`)

| Method | Path                          | Description                            |
|--------|-------------------------------|----------------------------------------|
| GET    | `/api/analytics/team`         | Team-wide analytics                    |
| GET    | `/api/analytics/rep/{name}`   | Individual rep analytics               |

**Team analytics response:**
```json
{
  "weekly_trends": [
    { "week": "2026-W12", "rep_name": "Alex", "avg_score_pct": 72.5, "call_count": 4 }
  ],
  "rep_comparison": [
    { "rep_name": "Alex", "avg_score_pct": 72.5, "call_count": 12, "last_call_date": "..." }
  ],
  "dimension_heatmap": [
    { "check_key": "budget_confirmed", "check_label": "Budget Confirmed", "avg_score": 1.4, "call_count": 12 }
  ]
}
```

---

### Workspace  (`/api/workspace/*`)

| Method | Path                    | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/workspace`        | Workspace metadata       |
| POST   | `/api/workspace/invite` | Invite user by email     |
| GET    | `/api/workspace/members`| List members + roles     |

---

## Database Schema

### Tables

| Table                | Key Columns                                                    |
|----------------------|----------------------------------------------------------------|
| `workspaces`         | id, name, created_at                                           |
| `workspace_members`  | workspace_id, user_id, role                                    |
| `workspace_settings` | workspace_id, key, value (stores Granola API key)             |
| `workspace_invites`  | workspace_id, email, role, invited_by                         |
| `transcripts`        | workspace_id, title, rep_name, prospect_company, call_date    |
| `transcript_segments`| transcript_id, speaker, text, timestamp, order_index          |
| `rubrics`            | workspace_id (NULL=prebuilt), name, framework, is_prebuilt    |
| `rubric_checks`      | rubric_id, check_key, label, description, weight, order_index |
| `scoring_jobs`       | transcript_id, rubric_id, status, celery_task_id              |
| `scored_calls`       | transcript_id, rubric_id, overall_score, score_pct            |
| `check_scores`       | scored_call_id, check_id, score (0/1/2), rationale, override  |
| `evidence_citations` | check_score_id, speaker, text (verbatim), timestamp           |

### Indexes

```sql
idx_transcripts_workspace       ON transcripts(workspace_id)
idx_scoring_jobs_status         ON scoring_jobs(status)
idx_scored_calls_workspace      ON scored_calls(workspace_id)
idx_scored_calls_transcript     ON scored_calls(transcript_id)
idx_check_scores_scored_call    ON check_scores(scored_call_id)
idx_evidence_citations_check_score ON evidence_citations(check_score_id)
```

---

## Scoring Engine Details

**File:** `services/scoring_engine.py`

**Model:** `claude-sonnet-4-6`

**Why Sonnet not Opus:** Sonnet is used as the PRD specifies `claude-sonnet-4-6`.
Swap `MODEL` constant to `claude-opus-4-6` for higher accuracy on complex calls.

**Structured output:** Uses `output_config.format` with a strict JSON schema.
This guarantees Claude returns valid, parseable JSON every time.

**System prompt key rules enforced:**
1. Scores must be 0, 1, or 2 only
2. Evidence must be verbatim — no paraphrasing
3. Empty `evidence_excerpts` array if no clear evidence
4. Confidence rating (low/medium/high) per dimension

**Fallback behaviour:**
- If Claude omits a dimension → score defaults to 0 with a note
- If overall_composite is 0.0 → recomputed from weighted check scores
- Up to 2 automatic retries on API or parse failures

**Token budget:** ~4096 output tokens (sufficient for 8–10 BANT dimensions with full rationale + evidence).

---

## Auth Flow

```
1. POST /auth/register or /auth/login
   → Supabase issues HS256 JWT
   → Client stores token

2. Every /api/* request:
   Authorization: Bearer <supabase_jwt>
   → FastAPI: api/deps.py validates token with SUPABASE_JWT_SECRET
   → Extracts user.sub (UUID) and user.email
   → Passes to route handler as `user` dict

3. POST /auth/logout
   → Client discards stored token
   → Supabase Auth session invalidated server-side
```

---

## Blockers & Known Limitations

### Hard Requirements Before Production

1. **`SUPABASE_JWT_SECRET`** — Must be set to the exact secret from Supabase
   project settings → Auth → JWT Secret. Wrong value = all authenticated
   requests fail with 401.

2. **Granola API access** — Granola's API is in limited/enterprise access.
   The current implementation targets `https://api.granola.so/v1`. Verify
   endpoints with your Granola account rep. The `GranolaClient` in
   `services/granola.py` is straightforward to update if the API surface differs.

3. **Database migration** — Must run the schema either via Alembic
   (`alembic upgrade head` with `DATABASE_URL` set) OR by pasting
   `MIGRATION_SQL` from `services/database.py` into the Supabase SQL editor.
   The app will fail on startup if tables don't exist.

### Design Decisions to Revisit

4. **Analytics join filtering** — `rep_name` filter in `GET /api/calls` is
   applied in Python because Supabase PostgREST has limitations filtering on
   joined columns. For high volume, implement a Supabase RPC (stored procedure)
   that does this in Postgres.

5. **Single Celery queue** — All scoring jobs share one `scoring` queue.
   At scale, consider priority queues or per-workspace isolation.

6. **No rate limiting** — There is no per-user or per-workspace rate limit on
   `POST /api/score-jobs`. Add a Redis-backed rate limiter (e.g.,
   `slowapi`) before production to prevent Anthropic API cost explosions.

7. **Granola API key storage** — Keys are stored as plaintext in
   `workspace_settings`. Supabase encrypts at rest, but consider using
   Supabase Vault for secrets if your security posture requires it.

8. **`workspace_id` in request body** — Currently, workspace membership is
   not enforced in API endpoints (any authenticated user can read any workspace
   if they know the UUID). Add a `workspace_members` check via Supabase RLS
   or a Python dependency before production.

---

## File Map

```
backend/
├── main.py                         FastAPI app, all routers registered
├── config.py                       Pydantic settings (reads .env)
├── celery_app.py                   Celery config, routes scoring to "scoring" queue
├── requirements.txt                All Python dependencies
├── alembic.ini                     Alembic config (reads DATABASE_URL from env)
├── alembic/
│   ├── env.py                      Alembic env, imports ORM Base
│   ├── script.py.mako              Migration template
│   └── versions/
│       └── 0001_initial_schema.py  Full schema migration (up + down)
├── api/
│   ├── auth.py                     POST /auth/register|login|logout
│   ├── deps.py                     JWT validation dependency
│   ├── granola.py                  POST /api/granola/connect, GET /api/granola/meetings*
│   ├── transcripts.py              POST /api/transcripts/upload, GET /api/transcripts*
│   ├── rubrics.py                  CRUD /api/rubrics*
│   ├── scoring.py                  POST|GET /api/score-jobs*
│   ├── calls.py                    GET /api/calls*
│   ├── overrides.py                POST /api/calls/{id}/overrides
│   ├── analytics.py                GET /api/analytics/team|rep/*
│   └── workspace.py                GET|POST /api/workspace*
├── models/
│   ├── transcript.py               Pydantic schemas for transcripts
│   ├── rubric.py                   Pydantic schemas for rubrics
│   ├── score.py                    Pydantic schemas for jobs + scored calls
│   └── orm.py                      SQLAlchemy ORM models (for Alembic)
├── services/
│   ├── database.py                 Supabase client + all DB helpers + seed data + MIGRATION_SQL
│   ├── granola.py                  Granola API HTTP client
│   ├── normalizer.py               Multi-format transcript normalizer
│   └── scoring_engine.py           Claude scoring engine (THE CORE)
└── tasks/
    └── scoring_task.py             Celery task: load → score → persist → mark complete
```
