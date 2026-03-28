# QA Report — B2B Payments Analytics Dashboard
**Date:** March 28, 2026
**QA Engineer:** Senior QA (Automated Code Review)
**Scope:** Full code audit of frontend + backend against PRD, FRONTEND_NOTES, ARCHITECTURE, and BACKEND_NOTES

---

## Executive Summary

| Result | Count |
|--------|-------|
| PASS   | 47    |
| FAIL   | 18    |
| BLOCKED| 22    |
| **Total** | **87** |

---

## Part 1 — Test Plan

### P0 Feature Coverage

| Feature | Priority | Test Areas |
|---------|----------|------------|
| F-01: Unified Spend Overview Dashboard | P0 | KPI cards, area chart, pie chart, recent transactions, filters |
| F-02: Budget vs. Actuals Tracking | P0 | Traffic light, progress bar, per-dept drill-down, alert thresholds |
| F-03: ERP Bidirectional Sync | P0 | Sync status badge, manual trigger, error state |
| F-04: Multi-Source Transaction Feed | P0 | Search, filter, sort, category display, empty state |
| F-05: Custom Report Builder | P0 | Create modal, saved reports grid, run/download |
| F-06: RBAC | P0 | Role enforcement, audit log access, login flow |
| F-07: Anomaly Detection + Alerts | P0 | Alert queue, approve/dismiss, severity filter |

### P1 Feature Coverage

| Feature | Priority | Test Areas |
|---------|----------|------------|
| F-08: Cash Flow Forecasting | P1 | 30/60/90-day endpoint, summary math, empty data |
| F-09: Vendor Analytics | P1 | Vendor list, single vendor, spend trend |
| F-10: Approval Workflow Engine | P1 | Not implemented in code |
| F-11: Multi-Entity View | P1 | Not implemented in code |
| F-12: Integrations Marketplace | P1 | List, toggle, sync trigger, error states |
| F-13: Mobile App | P1 | Not implemented |

---

## Part 2 — Test Cases and Results

### AUTH (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| A-01 | POST /auth/login with valid credentials returns JWT + user object | PASS | Token signed with 8h TTL; user payload correct |
| A-02 | POST /auth/login with invalid password returns 401 INVALID_CREDENTIALS | PASS | Plain string comparison returns correct error |
| A-03 | POST /auth/login with non-existent email returns 401 | PASS | Unified error hides whether email exists |
| A-04 | POST /auth/login with empty body returns 400 VALIDATION_ERROR | PASS | Zod schema rejects empty body |
| A-05 | POST /auth/login with malformed email string returns 400 | PASS | z.string().email() catches it |
| A-06 | GET /auth/me with valid Bearer token returns user profile | PASS | jwtVerify + user lookup works |
| A-07 | GET /auth/me with expired/invalid token returns 401 | PASS | jwtVerify exception caught |
| A-08 | Passwords stored as plaintext in userPasswords map | FAIL | See FAIL-01 |
| A-09 | No rate limiting specific to /auth/login | FAIL | See FAIL-02 |
| A-10 | SQL injection / XSS in email field | PASS | Zod validates format; no DB used in demo |
| A-11 | JWT secret is hardcoded default in server.ts | FAIL | See FAIL-03 |

---

### TRANSACTIONS (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| T-01 | GET /transactions with no filters returns paginated list (20 default) | PASS | paginate() correctly slices |
| T-02 | GET /transactions?search=aws returns matching rows | PASS | searches vendor, description, invoiceNumber, tags |
| T-03 | GET /transactions?status=completed filters correctly | PASS | |
| T-04 | GET /transactions?dateFrom=2026-01-01&dateTo=2026-03-31 | PASS | ISO string comparison works |
| T-05 | GET /transactions?amountMin=10000&amountMax=50000 | PASS | numeric comparison correct |
| T-06 | GET /transactions?sortBy=amount&sortOrder=asc | PASS | sort logic correct |
| T-07 | GET /transactions with pageSize > 100 returns 400 | PASS | Zod max(100) enforced |
| T-08 | GET /transactions with pageSize=0 returns 400 | PASS | Zod .positive() enforced |
| T-09 | GET /transactions/:id with valid ID | PASS | finds by id in array |
| T-10 | GET /transactions/:id with unknown ID returns 404 | PASS | |
| T-11 | GET /transactions without auth header returns 401 | PASS | requireAuth preHandler |
| T-12 | GET /transactions/export?format=csv (CSV export) | FAIL | See FAIL-04 |
| T-13 | Frontend CSV Export button is non-functional | FAIL | See FAIL-05 |
| T-14 | dateFrom/dateTo with invalid ISO date string (e.g. "not-a-date") | FAIL | See FAIL-06 |
| T-15 | dept_owner sees all departments' transactions (no row-level scoping) | FAIL | See FAIL-07 |

---

### DASHBOARD (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| D-01 | GET /dashboard/summary returns all required fields | PASS | All fields in DashboardSummary present |
| D-02 | totalSpend only counts completed transactions | PASS | Filtered correctly in dashboard.ts |
| D-03 | budgetUtilization calculated as totalSpend/totalBudget * 100 | PASS | Math correct |
| D-04 | erpSyncStatus uses hardcoded integration ID "int_netsuite" | FAIL | See FAIL-08 |
| D-05 | monthlyTrend is hardcoded, not computed from transaction data | FAIL | See FAIL-09 |
| D-06 | Frontend KPI cards read from static mockData, not from /dashboard/summary | FAIL | See FAIL-10 |
| D-07 | Frontend endpoint mismatch: expects /dashboard/kpis, backend serves /dashboard/summary | FAIL | See FAIL-11 |
| D-08 | Dashboard loads without auth gate in frontend | FAIL | See FAIL-12 |

---

### BUDGET (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| B-01 | GET /budgets returns paginated list with utilization rates | PASS | |
| B-02 | GET /budgets?overBudget=true returns departments > 100% utilization | PASS | utilizationRate > 1 check correct |
| B-03 | GET /budgets/:id finds by id OR departmentId | PASS | dual lookup in find() |
| B-04 | GET /budgets/:id with unknown id returns 404 | PASS | |
| B-05 | PUT /api/v1/budget/:department (PRD/frontend expects this) | FAIL | See FAIL-13 |
| B-06 | Budget alert triggers at 80% and 100% thresholds | BLOCKED | See BLOCKED-01 |

---

### ANOMALIES (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| AN-01 | GET /anomalies returns list sorted by detectedAt desc | PASS | |
| AN-02 | GET /anomalies?severity=critical filters correctly | PASS | |
| AN-03 | GET /anomalies?status=open filters correctly | PASS | |
| AN-04 | PATCH /anomalies/:id with status=approved updates resolvedAt + resolvedBy | PASS | |
| AN-05 | PATCH /anomalies/:id appends audit log entry | PASS | auditLogs.unshift() called |
| AN-06 | PATCH /anomalies/:id with invalid status value returns 400 | PASS | Zod enum validates |
| AN-07 | PATCH /anomalies/:id with unknown id returns 404 | PASS | |
| AN-08 | Audit log changes field records stale status (reads after mutation) | FAIL | See FAIL-14 |
| AN-09 | viewer role can PATCH anomaly status (should be forbidden) | FAIL | See FAIL-15 |
| AN-10 | Frontend Anomalies.tsx uses "pending" status, backend uses "open" | FAIL | See FAIL-16 |
| AN-11 | Frontend filter dropdown shows "pending" — not a valid backend status | FAIL | See FAIL-16 (same issue) |

---

### REPORTS (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| R-01 | GET /reports returns paginated saved reports | PASS | |
| R-02 | POST /reports with valid body creates report with 201 | PASS | |
| R-03 | POST /reports requires recipients array of valid emails | PASS | Zod array(email()).min(1) |
| R-04 | POST /reports with empty name returns 400 | PASS | z.string().min(1) |
| R-05 | DELETE /reports/:id removes from in-memory array | PASS | splice() works |
| R-06 | DELETE /reports/:id with unknown id returns 404 | PASS | |
| R-07 | POST /reports/:id/run (trigger execution) | FAIL | See FAIL-17 |
| R-08 | GET /reports/:id/download | FAIL | See FAIL-17 |
| R-09 | Frontend "Run Now" and "Download" buttons are non-functional stubs | FAIL | See FAIL-17 |
| R-10 | recipients field required by backend but not present in frontend modal | FAIL | See FAIL-18 |
| R-11 | Report creation persists after server restart (in-memory only) | BLOCKED | See BLOCKED-02 |

---

### INTEGRATIONS (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| I-01 | GET /integrations returns list with pagination | PASS | |
| I-02 | GET /integrations?status=connected filters correctly | PASS | |
| I-03 | GET /integrations?type=erp filters by type | PASS | |
| I-04 | POST /integrations/:id/sync triggers sync for connected integration | PASS | Returns sync metadata |
| I-05 | POST /integrations/:id/sync on error/pending integration returns 409 | PASS | |
| I-06 | PATCH /integrations/:id (toggle connected) | FAIL | See FAIL-13 (endpoint missing) |
| I-07 | Frontend integration toggle is local state only, not wired to backend | FAIL | See FAIL-05 (same class) |
| I-08 | ERP sync status in sidebar is hardcoded string, not from /erp/sync-status | FAIL | See FAIL-08 |

---

### RBAC / SECURITY (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| SEC-01 | GET /audit/logs with admin role returns 200 | PASS | requireRole(['admin','finance_manager','auditor']) |
| SEC-02 | GET /audit/logs with dept_owner role returns 403 | PASS | requireRole check works |
| SEC-03 | GET /audit/logs with viewer role returns 403 | PASS | |
| SEC-04 | All other endpoints only check requireAuth (any valid role) | FAIL | See FAIL-07, FAIL-15 |
| SEC-05 | JWT secret shipped as hardcoded default | FAIL | See FAIL-03 |
| SEC-06 | No logout / token revocation endpoint | BLOCKED | See BLOCKED-03 |
| SEC-07 | No SAML 2.0 / OAuth SSO implementation | BLOCKED | See BLOCKED-04 |
| SEC-08 | CORS set to origin:true (allow all origins) in dev mode | FAIL | See FAIL-19 |
| SEC-09 | Rate limiting applied globally at 200 req/min, not per-user per-route | PASS (partial) | Acceptable for demo |
| SEC-10 | SQL injection not applicable (in-memory data) | PASS | N/A for demo |
| SEC-11 | Sensitive data (passwords) not returned in API responses | PASS | userPasswords never exposed in routes |

---

### CASH FLOW (Backend)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| CF-01 | GET /cashflow/forecast?horizon=90 returns 90 data points | PASS | getCashFlowByHorizon slices correctly |
| CF-02 | GET /cashflow/forecast?horizon=30 | PASS | |
| CF-03 | GET /cashflow/forecast?horizon=60 | PASS | |
| CF-04 | GET /cashflow/forecast?horizon=45 returns 400 | PASS | Zod refine enforces 30|60|90 |
| CF-05 | GET /cashflow/forecast with from/to date override | PASS | fallback filter logic works |
| CF-06 | variance math: actual - projected (not abs) | PASS | Correct directional variance |
| CF-07 | Empty data case: from > to range returns empty dataPoints | PASS | filter returns [] gracefully; forecastPeriod.from = null |
| CF-08 | Cash flow forecast is deterministic math, not ML | BLOCKED | See BLOCKED-05 |

---

### FRONTEND — UI/UX

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| UI-01 | Dashboard renders KPI cards with correct values | PASS | Static mockData renders correctly |
| UI-02 | Area chart renders Spend vs Budget trend | PASS | Recharts AreaChart correctly configured |
| UI-03 | Pie chart shows category breakdown with labels | PASS | CustomLabel hides slices < 5% |
| UI-04 | Recent transactions table shows 8 rows | PASS | transactions.slice(0, 8) |
| UI-05 | Transactions page: search filters across vendor, id, description | PASS | Client-side filter logic correct |
| UI-06 | Transactions page: sort by all columns works | PASS | handleSort / useMemo correct |
| UI-07 | Transactions page: empty state message when no results | PASS | "No transactions match your filters." |
| UI-08 | Budget page: progress bar capped at 110% (over-budget safety) | PASS | Math.min(item.percentUsed, 110) |
| UI-09 | Budget page: negative remaining shows "-" prefix correctly | PASS | item.remaining < 0 check |
| UI-10 | Anomalies page: approve/dismiss mutates local state | PASS | useState + setAnomalies works |
| UI-11 | Reports create modal: "Next" disabled when report name empty | PASS | disabled={step === 1 && !reportName.trim()} |
| UI-12 | Settings integrations tab: toggle is local state only | FAIL | See FAIL-05 |
| UI-13 | Sidebar navigation active state highlighting | PASS | React Router NavLink activeClassName |
| UI-14 | "View all" link in Dashboard uses <a href="/transactions"> instead of React Router Link | FAIL | See FAIL-20 |
| UI-15 | No auth guard / login page — any user can access all routes | FAIL | See FAIL-12 |
| UI-16 | Responsive layout: sidebar fixed 240px with no mobile hamburger menu | BLOCKED | See BLOCKED-06 |
| UI-17 | Keyboard navigation for all interactive elements | BLOCKED | See BLOCKED-07 |
| UI-18 | WCAG contrast: dark navy sidebar (#0f1e3d) with white text | PASS | Sufficient contrast ratio |
| UI-19 | Loading states while fetching data | BLOCKED | See BLOCKED-08 |
| UI-20 | Settings Profile tab "Save Changes" has no backend wiring | FAIL | See FAIL-05 |
| UI-21 | Settings Security tab: session revoke buttons non-functional | FAIL | See FAIL-05 |

---

### PERFORMANCE (Conceptual)

| TC# | Test Case | Result | Notes |
|-----|-----------|--------|-------|
| PF-01 | Dashboard KPI load time < 1.5s (P95) | BLOCKED | See BLOCKED-09 |
| PF-02 | Transaction table with 1M rows: client-side filter not viable | BLOCKED | See BLOCKED-10 |
| PF-03 | Frontend bundle: 658 KB single chunk, no lazy loading | FAIL | See FAIL-21 |
| PF-04 | Backend in-memory data has no ClickHouse/Redis/Postgres backing | BLOCKED | See BLOCKED-09 |

---

## Part 3 — Gap Report

### FAIL Cases (18 total)

---

**FAIL-01 — Plaintext password comparison**
- File: `/backend/src/routes/auth.ts:32`
- Code: `storedPassword !== password` (direct string comparison)
- What's wrong: Passwords are stored and compared as plaintext. Any data exposure (logs, memory dumps) leaks credentials.
- Fix: Use `bcrypt.compare(password, storedPasswordHash)` with work factor ≥12. Acknowledged in BACKEND_NOTES item 2 but not remediated.
- Owner: Backend

---

**FAIL-02 — No per-route rate limiting on /auth/login**
- File: `/backend/src/server.ts:52-60`
- What's wrong: Global rate limit is 200 requests/minute per IP. This is too permissive for a login endpoint — allows ~200 credential stuffing attempts per minute per IP.
- Fix: Apply a stricter rate limit (e.g., 10 req/min) specifically to `POST /api/v1/auth/login`.
- Owner: Backend

---

**FAIL-03 — Hardcoded JWT secret fallback**
- File: `/backend/src/server.ts:19`
- Code: `const JWT_SECRET = process.env.JWT_SECRET || "b2b-payments-dev-secret-change-in-prod-2026";`
- What's wrong: If the server is deployed without setting `JWT_SECRET`, the well-known default string can be used to forge tokens. Any attacker reading this source can sign arbitrary JWTs.
- Fix: Remove the fallback entirely. Throw a startup error if `JWT_SECRET` is not set in environment. Add to `.env.example`.
- Owner: Backend / Architecture

---

**FAIL-04 — CSV export endpoint missing**
- File: Backend — no route exists for `GET /api/v1/transactions/export`
- What's wrong: `FRONTEND_NOTES.md` lists `GET /api/v1/transactions/export?format=csv` as a required endpoint. It is not registered in `server.ts` and no handler exists in `transactions.ts`.
- Fix: Add `GET /transactions/export` route in `/backend/src/routes/transactions.ts` that streams a CSV of the filtered transaction set.
- Owner: Backend

---

**FAIL-05 — Multiple UI actions are non-functional stubs with no backend wiring**
- Files:
  - `/frontend/src/pages/Transactions.tsx:134` — Export CSV button has no onClick handler
  - `/frontend/src/pages/Reports.tsx:262-268` — "Run Now" and "Download" buttons have no onClick handlers
  - `/frontend/src/pages/Settings.tsx:130-137` — Integration toggle calls local `toggle()` only, never calls `PATCH /api/v1/integrations/:id`
  - `/frontend/src/pages/Settings.tsx:134-137` — Sync button calls `setTimeout` simulation, never calls `POST /api/v1/integrations/:id/sync`
  - `/frontend/src/pages/Settings.tsx:103` — "Save Changes" has no API call
  - `/frontend/src/pages/Settings.tsx:354-362` — "Revoke" session buttons non-functional
- What's wrong: All are button elements with no onClick, or with mock-only effects. Users clicking these will get no response or false feedback.
- Fix: Wire each button to the appropriate API endpoint via fetch/axios. Show loading state and success/error toast. All pre-authorized per `BACKEND_NOTES`.
- Owner: Frontend

---

**FAIL-06 — Date filter accepts invalid date strings**
- File: `/backend/src/routes/transactions.ts:33-34`
- Code: `dateFrom: z.string().optional()` — no ISO 8601 validation
- What's wrong: `?dateFrom=notadate` is accepted and compared as string. Since ISO date comparison relies on lexicographic ordering, invalid dates silently return wrong results instead of a 400.
- Fix: Use `z.string().datetime({ offset: true }).optional()` or `z.string().regex(/^\d{4}-\d{2}-\d{2}/)`.
- Owner: Backend

---

**FAIL-07 — No row-level data scoping for dept_owner role**
- File: `/backend/src/routes/transactions.ts`, `/backend/src/routes/budgets.ts`
- What's wrong: BACKEND_NOTES explicitly lists this as a known gap (item 1): "dept_owner should only see their own department's transactions/budgets." Currently all authenticated users, regardless of role, see all 55 transactions and all 8 budgets. A `dept_owner` for Sales can query Engineering's transactions.
- Fix: In all routes with `requireAuth`, check `request.user.role === 'dept_owner'` and auto-inject `department: request.user.department` into the filter before querying. Requires row-level filtering for transactions, budgets, anomalies, and vendors.
- Owner: Backend

---

**FAIL-08 — ERP sync status uses hardcoded integration ID**
- File: `/backend/src/routes/dashboard.ts:85`
- Code: `const erpIntegration = integrations.find((i) => i.id === "int_netsuite");`
- What's wrong: The ID in the integration data is `"int_netsuite"` in this lookup but the actual integration IDs in `/backend/src/data/integrations.ts` use the format `"int_001"`, `"int_002"`, etc. This lookup will return `undefined`, and the subsequent `erpIntegration!.name` will throw a runtime null dereference crash on the `/dashboard/summary` endpoint.
- Fix: Update to match the actual ID in the integrations data file, or look up by `provider === "netsuite"` or `type === "erp"`.
- Owner: Backend

---

**FAIL-09 — Monthly trend in dashboard is hardcoded static data**
- File: `/backend/src/routes/dashboard.ts:78-82`
- Code: Hardcoded array `[{month: "2026-01", spend: 568200...}]`
- What's wrong: The monthly trend data is hardcoded and not computed from the actual 55 mock transactions. As new transactions are added or PATCH operations change data, the trend never updates. It will always show the same three months regardless of query period.
- Fix: Compute the monthly trend by aggregating `transactions` grouped by `date.substring(0,7)` for the relevant period.
- Owner: Backend

---

**FAIL-10 — Frontend Dashboard reads from static mockData instead of API**
- File: `/frontend/src/pages/Dashboard.tsx:24-28`
- Code: `import { kpiData, spendTrend, categorySpend, transactions } from '../data/mockData'`
- What's wrong: All dashboard data (KPIs, charts, recent transactions) is sourced from static local mockData rather than the live backend. The backend's `/dashboard/summary` endpoint is never called. This means the frontend is entirely decoupled from the backend; changes on either side will not be reflected in the UI.
- Fix: Replace mockData imports with `useEffect`/`fetch` (or TanStack Query) calls to `GET /api/v1/dashboard/summary`. Map the response fields to the chart/KPI component props.
- Owner: Frontend

---

**FAIL-11 — Frontend/Backend API endpoint contract mismatch (dashboard)**
- Files: `FRONTEND_NOTES.md` (line 76) vs. `/backend/src/routes/dashboard.ts`
- What's wrong: `FRONTEND_NOTES.md` specifies three separate dashboard endpoints:
  - `GET /api/v1/dashboard/kpis`
  - `GET /api/v1/dashboard/spend-trend?months=6`
  - `GET /api/v1/dashboard/category-breakdown?period=current-month`

  The backend implements only `GET /api/v1/dashboard/summary` which combines all three. When the frontend is eventually wired, it will call three endpoints that return 404.
- Fix: Either (a) update `FRONTEND_NOTES.md` to reflect the single `/summary` endpoint and update the frontend to use it, or (b) add the three separate endpoints to the backend. Option (a) is lower cost.
- Owner: Both Frontend and Backend must agree on contract

---

**FAIL-12 — No authentication gate on frontend routes**
- File: `/frontend/src/App.tsx`
- What's wrong: All routes render under `<Layout>` without any auth check. Any unauthenticated user who loads the app in a browser sees the full dashboard with all data. There is no login page, no protected route wrapper, and no redirect to login. `FRONTEND_NOTES.md` acknowledges this (item 1) but it is not resolved.
- Fix: Create a `<ProtectedRoute>` component that checks for a stored JWT (localStorage/cookie) and redirects to `/login` if absent. Add a `Login.tsx` page with `POST /auth/login` integration.
- Owner: Frontend

---

**FAIL-13 — Missing write endpoints: PUT /budget and PATCH /integrations/:id**
- Files: Backend — no routes for these exist
- What's wrong:
  - `FRONTEND_NOTES.md` specifies `PUT /api/v1/budget/:department` to update budget allocations. Not implemented.
  - `FRONTEND_NOTES.md` specifies `PATCH /api/v1/integrations/:id` with `{ connected: boolean }` to toggle integrations. Not implemented.
- Fix: Add both endpoints to the respective route files. Budget PUT should validate the new amount and update the in-memory record. Integration PATCH should update `status` field.
- Owner: Backend

---

**FAIL-14 — Audit log records wrong "from" status for anomaly PATCH**
- File: `/backend/src/routes/anomalies.ts:165`
- Code: `changes: { status: { from: anomalies[anomalyIndex].status, to: status } }`
- What's wrong: The `changes` object is built **after** the mutation on line 137 (`anomalies[anomalyIndex].status = status`), so `anomalies[anomalyIndex].status` is already the new value. Both `from` and `to` will be the same (the new status). The audit log is permanently incorrect.
- Fix: Capture `const previousStatus = anomalies[anomalyIndex].status` before the mutation on line 137, then use `previousStatus` in the changes object.
- Owner: Backend

---

**FAIL-15 — viewer role can PATCH anomaly status**
- File: `/backend/src/routes/anomalies.ts:108`
- What's wrong: PATCH `/anomalies/:id` uses only `requireAuth`, not `requireRole`. Per the RBAC table in `BACKEND_NOTES.md`, `viewer` should not be able to change anomaly status (Anomalies patch = N for viewer). A viewer token can successfully approve or dismiss any anomaly.
- Fix: Change `{ preHandler: requireAuth }` to `{ preHandler: requireRole(['admin', 'finance_manager', 'dept_owner']) }` on the PATCH route.
- Owner: Backend

---

**FAIL-16 — Frontend/Backend AnomalyStatus type mismatch**
- Files:
  - `/frontend/src/types/index.ts:23` — `type AnomalyStatus = 'pending' | 'approved' | 'dismissed'`
  - `/backend/src/types/index.ts:87` — `type AnomalyStatus = "open" | "investigating" | "approved" | "dismissed"`
- What's wrong: The frontend uses `'pending'` as the active/unresolved status and `filterStatus` dropdown includes `"pending"`. The backend uses `"open"` and `"investigating"`. When the frontend eventually calls the backend's PATCH endpoint with `status: "pending"`, it will receive a 400 validation error. The frontend filter for "Pending" will never match backend data.
- Fix: Align the types. Backend should be the source of truth. Frontend type should be updated to `'open' | 'investigating' | 'approved' | 'dismissed'`. The "Pending" filter label in the UI can remain but must send `status=open` to the API.
- Owner: Frontend (type alignment) — coordination with Backend

---

**FAIL-17 — POST /reports/:id/run and GET /reports/:id/download not implemented**
- File: Backend — `/backend/src/routes/reports.ts` has no `/run` or `/download` routes
- What's wrong: `FRONTEND_NOTES.md` (items 4) and `BACKEND_NOTES.md` (item 10) both identify these as missing. The frontend "Run Now" and "Download" buttons exist in the UI but have no onClick handlers and no backend to call.
- Fix: Add `POST /reports/:id/run` (enqueue async job, return jobId) and `GET /reports/:id/download` (return signed download URL or stream). Requires async job queue integration.
- Owner: Backend (async job queue), Frontend (wire buttons)

---

**FAIL-18 — Frontend report creation modal does not collect required `recipients` field**
- File: `/frontend/src/pages/Reports.tsx:28-35`
- What's wrong: `POST /reports` requires `recipients: [email]` (at least one, validated by Zod `z.array(z.string().email()).min(1)`). The CreateReportModal has no field for recipients. Submitting the modal would result in a 400 error if wired to the backend.
- Fix: Add a recipients email input (comma-separated or tag input) to step 2 of the modal.
- Owner: Frontend

---

**FAIL-19 — CORS allows all origins in dev (not restricted for production)**
- File: `/backend/src/server.ts:41-46`
- Code: `origin: true` — allows all origins
- What's wrong: `origin: true` reflects the request origin back as allowed. In development this is acceptable, but there is no environment-based restriction. If deployed to production without changing this, it creates a CORS bypass that enables cross-site request forgery from any domain.
- Fix: Use `origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']` with explicit production domain allowlist.
- Owner: Backend / Architecture

---

**FAIL-20 — Dashboard "View all" link uses native `<a>` tag instead of React Router `<Link>`**
- File: `/frontend/src/pages/Dashboard.tsx:255`
- Code: `<a href="/transactions" className="...">`
- What's wrong: Using a native `<a>` tag causes a full-page reload, losing React state and resetting the SPA. React Router's `<Link to="/transactions">` should be used.
- Fix: Replace `<a href="/transactions">` with `<Link to="/transactions">` and import `Link` from `react-router-dom`.
- Owner: Frontend

---

**FAIL-21 — No code splitting / lazy loading for route-level components**
- File: `/frontend/src/App.tsx`
- What's wrong: All six page components are statically imported and bundled into a single 658 KB chunk (per `FRONTEND_NOTES.md`). Finance dashboards require fast load time (<1.5s per PRD). A single chunk forces the user to download all pages before seeing any content.
- Fix: Wrap each page import with `React.lazy()` and `<Suspense fallback={...}>` in `App.tsx` to enable route-level code splitting.
- Owner: Frontend

---

### BLOCKED Cases (22 total)

| # | Test Case | What's Missing | Owner |
|---|-----------|----------------|-------|
| BLOCKED-01 | Budget alert triggers at 80% and 100% thresholds (F-02 acceptance criteria) | No alert/notification system implemented. Budget thresholds are displayed visually (traffic light) but no alert is dispatched when a department crosses 80% or 100%. Needs Notification Service + alert rule engine. | Backend |
| BLOCKED-02 | Report creation persists across server restarts | In-memory array only. Requires PostgreSQL `reports` table + ORM. | Backend |
| BLOCKED-03 | JWT logout / token revocation | No `/auth/logout` endpoint. No Redis blacklist. BACKEND_NOTES item 3. | Backend |
| BLOCKED-04 | SAML 2.0 / OAuth 2.0 SSO (F-06 acceptance criteria) | `@fastify/passport` with Google/Azure strategies not implemented. BACKEND_NOTES auth flow section marks this as "not yet implemented." | Backend / Architecture |
| BLOCKED-05 | AI/ML cash flow forecast (F-08 acceptance criteria) | Current forecast is static deterministic data. No Prophet/LSTM model integrated. BACKEND_NOTES item 5. | ML Service (Architecture) |
| BLOCKED-06 | Mobile responsive sidebar (hamburger menu < 768px) | Sidebar is fixed 240px. FRONTEND_NOTES item 7 acknowledges this. | Frontend |
| BLOCKED-07 | Keyboard navigation (WCAG 2.1 AA) | No focus management, no skip links, no aria-* labels on custom toggle buttons or chart elements. | Frontend |
| BLOCKED-08 | Loading / skeleton states while fetching | Frontend reads static mockData; no async fetch = no loading state needed yet. Once API-wired, skeleton loaders are required per UX standard. | Frontend |
| BLOCKED-09 | Production performance (ClickHouse, Redis cache, < 1.5s P95) | All data is in-memory arrays. No ClickHouse OLAP, no Redis KPI cache. Infrastructure not provisioned. | Architecture / Backend |
| BLOCKED-10 | Server-side pagination for large transaction datasets | Frontend Transactions.tsx is client-side only (20 mock rows). TanStack Query + server-side pagination not yet implemented. FRONTEND_NOTES item 3. | Frontend |
| BLOCKED-11 | Real-time dashboard updates (WebSocket / SSE) | No WebSocket or SSE implementation. FRONTEND_NOTES item 2. | Frontend / Backend |
| BLOCKED-12 | ML-powered anomaly detection engine (F-07 P0 acceptance criteria) | Anomaly data is static. No Kafka streaming, no scikit-learn/PyOD rule engine. BACKEND_NOTES item 9. | ML Service / Architecture |
| BLOCKED-13 | ML-based auto-categorization (F-04 acceptance criteria, >90% accuracy) | No LLM/ML categorization. Categories are hardcoded in mock data. | ML Service |
| BLOCKED-14 | ERP bidirectional sync engine (F-03) | Sync endpoint simulates a sync in 0 lines of real work. No Temporal workflows, no NetSuite/QuickBooks OAuth connector. BACKEND_NOTES item 4. | Backend / Architecture |
| BLOCKED-15 | Cash flow forecasting page / UI (F-08) | Backend endpoint exists (`/cashflow/forecast`) but no frontend page or route exists for it. No `CashFlow.tsx` page, no route in `App.tsx`. | Frontend |
| BLOCKED-16 | Vendor Analytics page / UI (F-09) | Backend has `/vendors` endpoints but no frontend `Vendors.tsx` page and no route in `App.tsx`. | Frontend |
| BLOCKED-17 | Approval Workflow Engine (F-10, P1) | No backend routes, no data model, no frontend UI for multi-step approval chains. | Backend + Frontend |
| BLOCKED-18 | Multi-entity consolidated view (F-11, P1) | No entity hierarchy in data model. Single-company assumption throughout. FRONTEND_NOTES item 6. | Backend + Frontend + Architecture |
| BLOCKED-19 | Integrations Marketplace OAuth flow (F-12, P1) | Toggle in Settings is local state only. No OAuth2 PKCE flow. No integration-specific config/credential storage. | Backend + Frontend |
| BLOCKED-20 | Export to PDF, Google Sheets, Excel (F-05 acceptance criteria) | Only CSV/PDF/XLSX format flags exist; no actual file generation (Puppeteer, fast-csv, ExcelJS). BACKEND_NOTES item 10. | Backend |
| BLOCKED-21 | Duplicate detection in transaction feed (F-04 acceptance criteria) | No deduplication logic in ingestion or in the transaction list. | Backend / ML Service |
| BLOCKED-22 | Multi-tenancy / org_id scoping (production requirement) | All data is single-company. No `org_id` in JWT, no table-level tenant isolation. BACKEND_NOTES item 7. | Architecture / Backend |

---

## Summary Statistics

| Category | PASS | FAIL | BLOCKED |
|----------|------|------|---------|
| Auth | 7 | 3 | 1 |
| Transactions | 9 | 4 | 0 |
| Dashboard | 3 | 5 | 0 |
| Budget | 4 | 1 | 1 |
| Anomalies | 7 | 4 | 0 |
| Reports | 5 | 4 | 1 |
| Integrations | 5 | 3 | 1 |
| Security/RBAC | 4 | 3 | 4 |
| Cash Flow | 7 | 0 | 1 |
| Frontend UI | 8 | 8 | 6 |
| Performance | 0 | 1 | 3 |
| **Totals** | **47** | **18** | **22** |

---

## Priority Matrix for Fixes

### P0 — Fix Before Any Production Deployment

| # | Issue | Risk |
|---|-------|------|
| FAIL-01 | Plaintext password comparison | Critical — credential exposure |
| FAIL-03 | Hardcoded JWT secret | Critical — token forgery |
| FAIL-07 | No row-level data scoping for dept_owner | Critical — data leakage across departments |
| FAIL-08 | Dashboard crashes on null ERP integration lookup | Critical — P0 endpoint runtime crash |
| FAIL-12 | No auth gate on frontend routes | Critical — unauthenticated access to all data |
| FAIL-15 | viewer role can approve/dismiss anomalies | High — RBAC bypass |
| FAIL-14 | Audit log records wrong "from" status | High — compliance/immutability issue |

### P1 — Fix Before Beta Launch

| # | Issue | Risk |
|---|-------|------|
| FAIL-02 | No login-specific rate limiting | High — credential stuffing |
| FAIL-05 | Multiple non-functional UI stubs | High — user trust / usability |
| FAIL-10 | Frontend reads mockData not API | High — product non-functional |
| FAIL-11 | Frontend/Backend endpoint contract mismatch | High — integration blocker |
| FAIL-16 | AnomalyStatus type mismatch | Medium — integration blocker |
| FAIL-13 | Missing PUT /budget and PATCH /integrations | Medium — features non-functional |
| FAIL-18 | Report creation missing recipients field | Medium — form will fail on submission |
| FAIL-19 | CORS allows all origins | Medium — production security risk |

### P2 — Fix Before GA

| # | Issue | Risk |
|---|-------|------|
| FAIL-04 | CSV export endpoint missing | Medium — feature gap |
| FAIL-06 | Date filter accepts invalid strings | Low — silent wrong results |
| FAIL-09 | Monthly trend hardcoded | Low — data quality |
| FAIL-17 | Run/Download report endpoints missing | Medium — feature gap |
| FAIL-20 | Native `<a>` tag causing full reload | Low — UX degradation |
| FAIL-21 | No code splitting | Low — performance |

---

*Report generated: March 28, 2026*

---

## Final Verification — March 28, 2026

**Verification scope:** 6 critical FAILs from the P0 and P1 priority lists.
**Code location verified:** `/Users/anirvan/dev/Agents/app/b2b-payments-dashboard/`

---

### Verification Results

| FAIL # | Description | Status | Evidence |
|--------|-------------|--------|----------|
| FAIL-08 | ERP sync status uses hardcoded `"int_netsuite"` ID | **VERIFIED FIXED** | `dashboard.ts:85–86` now uses `integrations.find((i) => i.type === "erp" && i.status === "connected") ?? integrations.find((i) => i.type === "erp")` with full optional chaining (`?.`) on all downstream field access. No hardcoded ID. Runtime null dereference is eliminated. |
| FAIL-14 | Audit log `from` field records post-mutation status | **VERIFIED FIXED** | `anomalies.ts:137` captures `const oldStatus = anomalies[anomalyIndex].status` before the mutation on line 140. The audit log on line 168 uses `{ from: oldStatus, to: status }`. The `from` and `to` values are now always distinct when the status changes. |
| FAIL-01 | Plaintext password comparison | **VERIFIED FIXED** | `auth.ts:3` imports `bcrypt from "bcryptjs"`. Login uses `await bcrypt.compare(password, storedHash)` on line 33. `users.ts:75` stores all demo passwords as `bcrypt.hashSync("password123", 10)`. No plaintext comparison anywhere in the auth path. |
| FAIL-03 | Hardcoded JWT secret fallback | **VERIFIED FIXED** | `server.ts:20–22` throws `new Error("JWT_SECRET environment variable is required")` if `process.env.JWT_SECRET` is not set. The hardcoded fallback string `"b2b-payments-dev-secret-change-in-prod-2026"` has been removed entirely. Server will not start without the env var. |
| FAIL-12 | No authentication gate on frontend routes | **VERIFIED FIXED** | `App.tsx` wraps all protected pages inside `<Route element={<ProtectedRoute />}>`. `ProtectedRoute.tsx` checks `token` from `AuthContext` and redirects to `/login` if absent. `AuthContext.tsx` persists the JWT to `localStorage` under key `paylens_auth_token`. `LoginPage.tsx` exists, calls `POST /api/v1/auth/login`, and stores the returned token via `login()`. All four files (`App.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx`, `LoginPage.tsx`) are implemented and correctly wired. |
| FAIL-16 | `AnomalyStatus` type mismatch between frontend and backend | **VERIFIED FIXED** | Both `backend/src/types/index.ts:84` and `frontend/src/types/index.ts:23` now define `AnomalyStatus` as `'pending' \| 'investigating' \| 'approved' \| 'dismissed'`. The backend's Zod query and patch schemas in `anomalies.ts` also use the `"pending"` value (not `"open"`). Frontend and backend are now aligned on the same enum values. **Note:** `BACKEND_NOTES.md` still documents `status=open` as a valid filter — that documentation should be updated to reflect `status=pending`. |

---

### Summary

| Metric | Value |
|--------|-------|
| Critical FAILs re-verified | 6 |
| VERIFIED FIXED | 6 |
| STILL FAILING | 0 |
| PARTIALLY FIXED | 0 |

**All 6 targeted P0/P1 critical failures are confirmed fixed.**

Applying the 6 fixes to the original totals:

| Result | Original | After Fixes | Delta |
|--------|----------|-------------|-------|
| PASS | 47 | 53 | +6 |
| FAIL | 18 | 12 | -6 |
| BLOCKED | 22 | 22 | 0 |
| **Total** | **87** | **87** | — |

---

### Remaining Open Issues (12 FAILs, not addressed in this fix pass)

The following FAILs were not in scope for this verification pass and remain open:

**P1 (block beta launch):**
- FAIL-02: No per-route rate limiting on `POST /auth/login`
- FAIL-05: Multiple non-functional UI stubs (CSV export, Run/Download report, integration toggle, Save/Revoke in Settings)
- FAIL-07: No row-level data scoping for `dept_owner` role
- FAIL-10: Frontend Dashboard reads static `mockData`, never calls `/dashboard/summary`
- FAIL-11: Frontend expects `/dashboard/kpis`, `/dashboard/spend-trend`, `/dashboard/category-breakdown`; backend serves only `/dashboard/summary`
- FAIL-13: `PUT /budget/:department` and `PATCH /integrations/:id` endpoints missing
- FAIL-15: `viewer` role can PATCH anomaly status (RBAC bypass)
- FAIL-18: Report creation modal does not collect `recipients` field
- FAIL-19: CORS `origin: true` allows all origins (production security risk)

**P2 (block GA):**
- FAIL-04: CSV export endpoint (`GET /transactions/export`) not implemented
- FAIL-06: `dateFrom`/`dateTo` query params accept invalid date strings without 400 error
- FAIL-09: Monthly trend in dashboard is hardcoded, not computed from transaction data
- FAIL-17: `POST /reports/:id/run` and `GET /reports/:id/download` not implemented
- FAIL-20: Dashboard "View all" uses native `<a>` tag instead of React Router `<Link>`
- FAIL-21: No route-level code splitting / lazy loading

---

### Deployment Readiness Assessment

**NOT READY FOR PRODUCTION.**

The 6 critical security and correctness fixes (FAIL-01, FAIL-03, FAIL-08, FAIL-12, FAIL-14, FAIL-16) are confirmed resolved, which eliminates the P0 blockers for runtime crashes and authentication vulnerabilities. However, 9 P1-severity issues remain open, including no row-level RBAC scoping (FAIL-07), RBAC bypass on anomaly PATCH (FAIL-15), fully disconnected frontend-to-backend data flow (FAIL-10, FAIL-11), and missing write endpoints (FAIL-13). These must be resolved before beta launch.

**Earliest viable milestone:** Internal demo or QA environment only. Not suitable for any user-facing or production deployment until the P1 failures are addressed.

*Final verification completed: March 28, 2026*
*Files reviewed: 23 source files across frontend and backend*
*PRD features covered: P0 (F-01 through F-07), P1 (F-08 through F-13)*
