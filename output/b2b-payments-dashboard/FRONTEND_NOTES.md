# B2B Payments Dashboard — Frontend Notes

## Status
- Build: PASSING (tsc + vite build — 0 errors, 0 TS errors)
- To run: `cd frontend && npm run dev`

---

## File Structure

```
frontend/
├── index.html                    # Entry HTML — loads Inter font, sets title
├── package.json                  # All deps (React 18, Recharts, React Router, Lucide)
├── vite.config.ts                # Vite config with @/ alias
├── tailwind.config.js            # Custom navy sidebar color, Inter font
├── postcss.config.js
├── tsconfig.json / tsconfig.node.json
└── src/
    ├── main.tsx                  # React DOM root
    ├── App.tsx                   # BrowserRouter + Routes
    ├── index.css                 # Tailwind directives + custom scrollbar
    ├── types/
    │   └── index.ts              # All shared TypeScript types (Transaction, BudgetItem, Anomaly, etc.)
    ├── data/
    │   └── mockData.ts           # All mock data: 20 transactions, 7 budget items, 8 anomalies, 7 reports, 9 integrations, KPIs
    ├── utils/
    │   └── format.ts             # formatCurrency, formatDate, formatPercent, classNames
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx        # Outer shell: Sidebar + <Outlet>
    │   │   ├── Sidebar.tsx       # Fixed dark-navy sidebar; NavLink active states; ERP sync badge
    │   │   └── Header.tsx        # Top bar: page title, search, notifications bell, user avatar
    │   └── ui/
    │       ├── KpiCard.tsx       # Reusable KPI card with icon, value, trend arrow
    │       ├── StatusBadge.tsx   # Color-coded status pill (completed/pending/failed/critical/etc.)
    │       └── TrafficLight.tsx  # Green/amber/red dot for budget status
    └── pages/
        ├── Dashboard.tsx         # KPI cards, area chart (spend vs budget), donut chart (category), recent txns table
        ├── Transactions.tsx      # Full searchable/filterable/sortable table; CSV export button
        ├── BudgetVsActuals.tsx   # Bar chart + per-dept table with progress bars + traffic lights
        ├── Reports.tsx           # Saved report cards grid + 2-step Create Report modal
        ├── Anomalies.tsx         # Flagged transaction cards with approve/dismiss actions (local state)
        └── Settings.tsx          # 4-tab settings: Profile, Integrations (toggles), Notifications, Security/RBAC
```

---

## Key Components

| Component | Purpose |
|---|---|
| `Layout` | Wraps all pages; positions fixed sidebar + scrollable main |
| `Sidebar` | Navigation with active route highlighting; ERP sync status chip |
| `KpiCard` | Dashboard metric card — accepts icon, value, delta, change label |
| `StatusBadge` | Polymorphic status pill covering transaction, budget, and anomaly states |
| `Dashboard` | Primary landing page; AreaChart + PieChart from Recharts with custom tooltips |
| `Transactions` | Client-side filter + sort + search over 20 realistic transactions |
| `BudgetVsActuals` | BarChart comparison + per-department progress bars + traffic light indicators |
| `Reports` | Report card grid; two-step modal to configure and save new reports |
| `Anomalies` | Severity-sorted alert queue; approve/dismiss mutates local state with `useState` |
| `Settings` | Tabbed settings with functional toggle switches for notifications and integrations |

---

## API Endpoints This Frontend Expects (Backend Agent)

All requests are expected at `/api/v1/`.

### Transactions
- `GET /api/v1/transactions` — paginated list with query params: `page`, `limit`, `search`, `status`, `department`, `category`, `startDate`, `endDate`, `sortBy`, `sortDir`
- `GET /api/v1/transactions/:id` — single transaction detail
- `GET /api/v1/transactions/export?format=csv` — CSV export

### KPIs & Dashboard
- `GET /api/v1/dashboard/kpis` — `{ totalSpendMTD, budgetRemaining, transactionsToday, openAlerts, criticalAlerts, ... }`
- `GET /api/v1/dashboard/spend-trend?months=6` — monthly `[{ month, spend, budget }]`
- `GET /api/v1/dashboard/category-breakdown?period=current-month` — `[{ name, value, color }]`

### Budget
- `GET /api/v1/budget` — all departments with budgeted, actual, remaining, status
- `PUT /api/v1/budget/:department` — update budget allocation

### Anomalies
- `GET /api/v1/anomalies` — list with optional `?status=pending&severity=critical`
- `PATCH /api/v1/anomalies/:id/status` — body: `{ status: "approved" | "dismissed" | "pending" }`

### Reports
- `GET /api/v1/reports` — saved reports list
- `POST /api/v1/reports` — create report: `{ name, type, dateRange, departments, schedule, format }`
- `DELETE /api/v1/reports/:id`
- `POST /api/v1/reports/:id/run` — trigger report execution
- `GET /api/v1/reports/:id/download` — download last run output

### Integrations
- `GET /api/v1/integrations` — list with `connected` status and `lastSync`
- `PATCH /api/v1/integrations/:id` — body: `{ connected: boolean }`
- `POST /api/v1/integrations/:id/sync` — trigger manual sync

### Auth (RBAC)
- `GET /api/v1/auth/me` — current user with role, permissions
- `GET /api/v1/users` — list users (admin only)
- `PATCH /api/v1/users/:id/role` — update role

### ERP
- `GET /api/v1/erp/sync-status` — `{ status, lastSync, provider, errorMessage? }`
- `POST /api/v1/erp/sync` — trigger manual sync

---

## Notes & Open Questions

1. **Auth/session management** — frontend currently has no auth gate; assumes a token is injected or SSO session exists. Backend should define the auth scheme (JWT vs. session cookie) and the frontend needs a login page + protected routes added.

2. **Real-time updates** — the dashboard KPIs and anomaly queue would benefit from WebSocket or SSE for live updates (new transactions, new anomalies). Currently polling is not implemented.

3. **Pagination** — the Transactions table is client-side only (20 mock rows). Production will need server-side pagination via TanStack Query.

4. **Report execution** — the "Run Now" and "Download" buttons are UI-only stubs. Backend needs async report generation (job queue) + signed download URLs.

5. **Chart colors** — category spend colors are hardcoded in `mockData.ts`. Backend should return a stable color per category or frontend should manage a palette map.

6. **Multi-entity support** — PRD calls for multi-entity view (P1). The current data model assumes a single entity/company. The entity switcher should be added to the Sidebar header area.

7. **Mobile responsiveness** — Sidebar is fixed at 240px. On screens below 768px, a hamburger menu + slide-in drawer should be added.

8. **ERP sync status** — currently hardcoded in the Sidebar footer. Wire to `GET /api/v1/erp/sync-status` polling every 60 seconds.

9. **Bundle size** — the single JS chunk is 658 KB (182 KB gzipped). Consider lazy-loading pages with `React.lazy()` and `Suspense` once backend integration begins.
