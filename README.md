# Product Build — Multi-Agent Pipeline

## Usage

Open this folder in Claude Code, then run:

```
/product-build <your product description>
```

Example:
```
/product-build A job application tracker where users can log jobs they've applied to, track status, set follow-up reminders, and see analytics on their job search.
```

## How It Works

5 specialized agents run in sequence and in parallel:

| Agent | Role | Runs |
|-------|------|------|
| PM Agent | Research + PRD | First |
| Frontend Agent | UI/UX + React code | Parallel (2nd wave) |
| Architecture Agent | System design + integrations | Parallel (2nd wave) |
| Backend Agent | API + database logic | Parallel (2nd wave) |
| QA Agent | Test planning + execution + feedback loop | Last |

## Output Structure

```
output/
  PRD.md                  ← Product Requirements Document
  FRONTEND_NOTES.md       ← Frontend decisions + API contracts
  ARCHITECTURE.md         ← System design + integration plan
  BACKEND_NOTES.md        ← API endpoints + schema
  QA_REPORT.md            ← Test results + gap analysis

app/
  frontend/               ← All frontend code
  backend/                ← All backend code
  .env.example            ← Required environment variables
```
