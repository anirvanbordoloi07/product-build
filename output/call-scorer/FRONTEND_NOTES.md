# Call Scorer — Frontend Notes

## Stack
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 + shadcn base-nova style (via `@base-ui/react`)
- Recharts 3 for all charts
- TanStack Query v5 (provider wired, queries ready to swap mock data)
- Sonner for toast notifications
- Lucide React for icons

---

## File Structure

```
frontend/
  app/
    page.tsx                      # Landing/onboarding + login (single component, two views)
    layout.tsx                    # Root layout: fonts, dark class, Providers, Toaster
    globals.css                   # Tailwind v4 + shadcn CSS vars (dark mode)
    dashboard/
      page.tsx                    # Call library + rep leaderboard + quick actions
    connect/
      page.tsx                    # Granola OAuth/API key flow (3-step wizard)
    calls/
      new/page.tsx                # Upload/paste/Granola picker + rubric selector + scoring progress
      [id]/page.tsx               # Per-call scorecard: score ring, check cards, override UI, transcript viewer
    rubrics/
      page.tsx                    # Rubric library grid
      new/page.tsx                # Re-exports edit page with id="new"
      [id]/edit/page.tsx          # Rubric editor (name, framework, drag-to-reorder criteria)
    analytics/
      page.tsx                    # Team trend chart, per-rep trend, framework pie, heatmap, bar chart
    settings/
      page.tsx                    # Workspace name, team members, invite flow, weekly digest, API key, danger zone

  components/
    app-shell.tsx                 # Sidebar nav + main content layout
    providers.tsx                 # TanStack Query provider
    score-badge.tsx               # ScoreBadge (0/1/2 with color) + ScoreRing (SVG donut)
    link-button.tsx               # LinkButton: Next.js Link styled with buttonVariants CVA
    ui/
      badge.tsx, button.tsx, card.tsx, dialog.tsx
      input.tsx, label.tsx, progress.tsx, select.tsx
      separator.tsx, sonner.tsx, table.tsx, tabs.tsx, textarea.tsx

  lib/
    api.ts                        # All API types + apiFetch helper + every endpoint function
    auth.ts                       # localStorage session helpers (save/clear/get token+user)
    mock-data.ts                  # Realistic mock data: users, transcripts, rubrics, scores, trends, Granola meetings, workspace members
    query-client.ts               # TanStack QueryClient singleton
    utils.ts                      # cn() classname helper
```

---

## Pages Summary

| Route | Component | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Landing (hero, features, testimonials) + inline login form |
| `/dashboard` | `app/dashboard/page.tsx` | Scored call list with search, stat cards, rep leaderboard, quick actions |
| `/connect` | `app/connect/page.tsx` | 3-step: API key → select Granola meetings → done |
| `/calls/new` | `app/calls/new/page.tsx` | 3-step: source (upload/paste/Granola) → transcript → rubric → scoring progress |
| `/calls/[id]` | `app/calls/[id]/page.tsx` | Scorecard: ring, check cards with evidence, override modal, transcript viewer |
| `/rubrics` | `app/rubrics/page.tsx` | Rubric cards with framework tags, duplicate action |
| `/rubrics/[id]/edit` | `app/rubrics/[id]/edit/page.tsx` | Rubric editor (also handles `/rubrics/new`) |
| `/analytics` | `app/analytics/page.tsx` | KPIs, team trend line, per-rep line, framework pie, BANT heatmap, rep bar chart |
| `/settings` | `app/settings/page.tsx` | Workspace name, team member list, invite, digest settings, API key, danger zone |

---

## Key Components

### `ScoreBadge` / `ScoreRing`
- `ScoreBadge`: colored pill for 0/1/2 scores (red/amber/emerald). `showLabel` controls text vs numeric.
- `ScoreRing`: SVG donut with animated stroke. Color threshold: ≥75% emerald, ≥40% amber, else red.

### `AppShell`
- Fixed sidebar (240px) with logo, nav links, settings link, sign out.
- Nav active state: `bg-indigo-600/20 text-indigo-400` + right chevron.

### `LinkButton`
- Workaround for `@base-ui/react` Button not supporting `asChild`.
- Uses `buttonVariants` CVA to style a `<Link>` tag identically to `<Button>`.

### Check cards (`/calls/[id]`)
- Collapsible per check: show AI reasoning + verbatim evidence quotes.
- Inline override flow: pick 0/1/2 + text note. Override reflected immediately in total/percentage.

---

## Mock Data (`lib/mock-data.ts`)

| Export | Description |
|---|---|
| `MOCK_USER` | Current user (manager role) |
| `MOCK_REPS` | 5 sales reps |
| `MOCK_TRANSCRIPTS` | 5 realistic discovery call transcripts (verbatim dialogue) |
| `MOCK_RUBRICS` | BANT (8 criteria), MEDDIC (6 criteria), custom Competitive Intel (4 criteria) |
| `MOCK_SCORES` | 5 fully scored reports with evidence, reasoning, per-check scores |
| `MOCK_TRENDS` | Team weekly trend, per-rep trend, framework breakdown percentages |
| `MOCK_REP_STATS` | Rep summary stats for leaderboard + heatmap |
| `MOCK_GRANOLA_MEETINGS` | 4 Granola meetings for import picker |
| `MOCK_WORKSPACE_MEMBERS` | 5 workspace members with roles |

---

## Backend API Endpoints Expected

All wired in `lib/api.ts`. Currently bypassed with mock data — swap `apiFetch` calls when backend is live.

| Method | Path | Used by |
|---|---|---|
| POST | `/api/auth/login` | Login page |
| GET | `/api/granola/connect` | Connect page |
| GET | `/api/granola/meetings` | Connect page meeting list |
| POST | `/api/transcripts/upload` | `/calls/new` upload flow |
| GET | `/api/transcripts` | Granola picker in `/calls/new` |
| GET | `/api/transcripts/:id` | Scorecard page (transcript viewer) |
| GET | `/api/rubrics` | Rubric list + scoring picker |
| POST | `/api/rubrics` | Rubric editor save |
| GET | `/api/rubrics/:id` | Rubric editor pre-fill |
| PUT | `/api/rubrics/:id` | Rubric editor update |
| POST | `/api/score` | Trigger scoring job |
| GET | `/api/scores` | Dashboard call list |
| GET | `/api/scores/:id` | Scorecard data |
| PUT | `/api/scores/:id/checks/:checkId/override` | Score override |
| GET | `/api/analytics/trends` | Analytics page all charts |

---

## Known Notes / Gotchas

1. **Button `asChild` not supported**: `@base-ui/react` Button has no `asChild` prop. Use `LinkButton` from `components/link-button.tsx` for all router link buttons.

2. **Next.js version**: This is Next.js 16 (AGENTS.md warns it has breaking changes vs training data). Check `node_modules/next/dist/docs/` if behavior differs from expectations. App Router is used throughout.

3. **Tailwind v4**: Uses `@import "tailwindcss"` syntax, not a `tailwind.config.js`. Color vars are CSS custom properties defined in `globals.css`.

4. **Dark mode**: HTML root has `dark` class hardcoded. All colors use `slate-*` and `indigo-*` with opacity modifiers.

5. **Auth flow**: Login is mocked (bypasses `/api/auth/login`, saves fake token to localStorage). Replace `handleSubmit` in `app/page.tsx` with real `login()` call when backend is ready.

6. **Scoring simulation**: `/calls/new` simulates a scoring job with fake progress updates. Wire to `POST /api/score` + polling `GET /api/score-jobs/:id` when backend is ready.

7. **Recharts**: Using v3. `Cell`, `PieChart`, `LineChart`, `BarChart` all imported from `recharts`. Tooltips use custom `contentStyle` for dark theme.

---

## How to Run

```bash
cd /Users/anirvan/dev/Agents/app/call-scorer/frontend
npm install       # already done
npm run dev       # starts on http://localhost:3000
```

Login with any email/password — the demo pre-fills `sarah.chen@acme.com` / `password`.
