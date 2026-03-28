# B2B Payments Dashboard — Backend Notes

## Running the Server

```bash
cd /Users/anirvan/dev/Agents/app/b2b-payments-dashboard/backend
npm run dev          # starts ts-node-dev on port 3001
```

All demo users share password `password123`. Default CFO login:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cfo@acme.com","password":"password123"}'
```
Use the returned `token` as `Authorization: Bearer <token>` on all other requests.

---

## API Endpoint Reference

All responses follow the envelope:
```json
{
  "data": <payload>,
  "meta": { "page": 1, "pageSize": 20, "total": 55, "totalPages": 3, "timestamp": "..." }
}
```
Errors:
```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} }, "meta": { "timestamp": "..." } }
```

### Auth

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| POST | `/api/v1/auth/login` | No | Returns JWT. Body: `{ email, password }` |
| GET | `/api/v1/auth/me` | Yes | Returns current user profile |

**Login response shape:**
```json
{
  "data": {
    "token": "eyJ...",
    "user": { "id": "usr_cfo", "email": "cfo@acme.com", "name": "Marcus Reyes", "role": "admin" },
    "expiresIn": "8h"
  }
}
```

---

### Dashboard

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/dashboard/summary` | Yes (any role) | KPI snapshot |

**Response fields:** `totalSpend`, `totalBudget`, `budgetUtilization` (%), `pendingApprovals`, `openAnomalies`, `criticalAlerts`, `transactionCount`, `topVendors[]`, `spendByCategory[]`, `spendByDepartment[]`, `monthlyTrend[]`, `erpSyncStatus`, `period`

---

### Transactions

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/transactions` | Yes | Paginated, filterable transaction list |
| GET | `/api/v1/transactions/:id` | Yes | Single transaction |

**Query params:**
- `page` (default: 1), `pageSize` (default: 20, max: 100)
- `search` — searches vendor, description, invoiceNumber, tags
- `status` — `completed | pending | failed | reversed`
- `category` — `software | cloud_infrastructure | travel | office | marketing | hr_benefits | legal | consulting | facilities | finance | other`
- `department` — partial match on department name or exact departmentId
- `vendor` — partial match on vendor name
- `isAnomaly` — `true | false`
- `dateFrom`, `dateTo` — ISO 8601 date strings
- `amountMin`, `amountMax` — numbers
- `sortBy` — `date | amount | vendor | status` (default: `date`)
- `sortOrder` — `asc | desc` (default: `desc`)

---

### Budgets

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/budgets` | Yes | All department budgets with actuals |
| GET | `/api/v1/budgets/:id` | Yes | Single budget by id or departmentId |

**Query params:** `department`, `fiscalYear`, `fiscalQuarter`, `overBudget` (true/false), `page`, `pageSize`

**Response fields per budget:** `id`, `department`, `departmentId`, `fiscalYear`, `fiscalQuarter`, `budgetAmount`, `actualSpend`, `committedSpend`, `remainingBudget`, `utilizationRate` (0–1), `lastUpdated`, `categories[]`

---

### Anomalies

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/anomalies` | Yes | List of flagged transactions |
| GET | `/api/v1/anomalies/:id` | Yes | Single anomaly |
| PATCH | `/api/v1/anomalies/:id` | Yes | Update status |

**PATCH body:** `{ "status": "approved|dismissed|investigating|open", "notes": "optional string" }`

**Query params (GET list):** `severity` (critical/high/medium/low), `status` (open/investigating/approved/dismissed), `type`, `department`, `sortBy` (detectedAt/riskScore/amount/severity), `sortOrder`

**Anomaly types:** `duplicate_payment | unusual_amount | off_hours_transaction | new_vendor | policy_violation | budget_breach | velocity_spike`

Side effect: PATCH automatically appends an audit log entry.

---

### Reports

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/reports` | Yes | List saved reports |
| GET | `/api/v1/reports/:id` | Yes | Single report |
| POST | `/api/v1/reports` | Yes | Create new report |
| DELETE | `/api/v1/reports/:id` | Yes | Delete report |

**POST body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "frequency": "daily|weekly|monthly|quarterly|on_demand",
  "format": "pdf|csv|xlsx",
  "recipients": ["email@example.com"],
  "filters": {
    "departments": ["dept_eng"],
    "categories": ["software"],
    "vendors": ["vnd_aws"],
    "dateRange": { "from": "2026-01-01", "to": "2026-03-31" },
    "amountRange": { "min": 1000, "max": 100000 },
    "statuses": ["completed"]
  }
}
```

---

### Integrations

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/integrations` | Yes | List connected integrations |
| GET | `/api/v1/integrations/:id` | Yes | Single integration |
| POST | `/api/v1/integrations/:id/sync` | Yes | Trigger manual sync |

**Query params:** `status` (connected/pending/error/disconnected), `type` (erp/accounting/banking/expense_management/hris)

**Sync endpoint** returns 409 if integration is in `error` or `pending` state.

---

### Vendors

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/vendors` | Yes | Vendor analytics list |
| GET | `/api/v1/vendors/:id` | Yes | Single vendor with spend trend |

**Query params:** `search`, `category`, `riskLevel` (low/medium/high), `department`, `sortBy` (totalSpend/transactionCount/name/riskLevel), `sortOrder`

**Response fields per vendor:** `id`, `name`, `category`, `totalSpend`, `transactionCount`, `averageInvoice`, `currency`, `lastPayment`, `paymentTerms`, `contractValue`, `contractExpiry`, `spendTrend[]` (6-month monthly), `department`, `riskLevel`, `onboardedAt`

---

### Cash Flow Forecast

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/cashflow/forecast` | Yes | 30/60/90-day forecast |

**Query params:** `horizon` (30/60/90, default: 90), `from` (date override), `to` (date override)

**Response:**
```json
{
  "data": {
    "horizon": "90d",
    "forecastPeriod": { "from": "2026-03-28", "to": "2026-06-25" },
    "summary": { "totalProjected": 3240000, "totalActual": 1200000, "variance": -400, "currency": "USD" },
    "dataPoints": [
      {
        "date": "2026-03-28",
        "projected": 42000,
        "actual": 41500,
        "lowerBound": 38640,
        "upperBound": 45360,
        "cumulative": 41500
      }
    ]
  }
}
```

---

### Audit Logs

| Method | Path | Auth Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/v1/audit/logs` | Yes (admin/finance_manager/auditor only) | Immutable audit trail |

**Query params:** `userId`, `resourceType`, `resourceId`, `action` (partial match), `severity` (info/warning/critical), `from`, `to` (ISO timestamps), `sortOrder`, `page`, `pageSize`

Returns 403 for `dept_owner` or `viewer` roles.

---

## RBAC — Role Permissions

| Role | Dashboard | Transactions | Budgets | Anomalies (read) | Anomalies (patch) | Reports | Integrations | Vendors | Cash Flow | Audit Logs |
|------|-----------|-------------|---------|-----------------|---------------------|---------|-------------|---------|-----------|------------|
| admin | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| finance_manager | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| dept_owner | Y | Y | Y | Y | Y | Y | Y | Y | Y | N |
| viewer | Y | Y | Y | Y | N | Y | Y | Y | Y | N |
| auditor | Y | Y | Y | Y | N | Y | Y | Y | Y | Y |

Note: Currently all protected routes use `requireAuth` (any valid token). The `requireRole` guard is applied only to `/api/v1/audit/logs`. Tighter per-endpoint RBAC is listed as an open question below.

---

## Database Schema (Production)

The following is what the PostgreSQL schema would look like in production. The v1 demo uses in-memory arrays.

```sql
-- Users & Auth
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','finance_manager','dept_owner','viewer','auditor')),
  department  TEXT,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Departments / Cost Centers
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  parent_id   UUID REFERENCES departments(id),
  owner_id    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Vendors
CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  risk_level      TEXT DEFAULT 'low',
  payment_terms   TEXT,
  contract_value  NUMERIC(18,2),
  contract_expiry DATE,
  onboarded_at    DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            TIMESTAMPTZ NOT NULL,
  vendor_id       UUID REFERENCES vendors(id),
  amount          NUMERIC(18,2) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  category        TEXT NOT NULL,
  department_id   UUID REFERENCES departments(id),
  status          TEXT NOT NULL CHECK (status IN ('completed','pending','failed','reversed')),
  invoice_number  TEXT,
  payment_method  TEXT,
  description     TEXT,
  approved_by     UUID REFERENCES users(id),
  is_anomaly      BOOLEAN DEFAULT false,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_vendor ON transactions(vendor_id);
CREATE INDEX idx_transactions_dept ON transactions(department_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Budgets
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id),
  fiscal_year     INT NOT NULL,
  fiscal_quarter  INT CHECK (fiscal_quarter BETWEEN 1 AND 4),
  category        TEXT,
  budget_amount   NUMERIC(18,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_id, fiscal_year, fiscal_quarter, category)
);

-- Anomalies
CREATE TABLE anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id),
  type            TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  status          TEXT NOT NULL CHECK (status IN ('open','investigating','approved','dismissed')),
  description     TEXT,
  risk_score      INT CHECK (risk_score BETWEEN 0 AND 100),
  detected_at     TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES users(id),
  notes           TEXT
);

-- Reports
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  created_by      UUID REFERENCES users(id),
  frequency       TEXT NOT NULL,
  format          TEXT NOT NULL,
  status          TEXT DEFAULT 'active',
  filters         JSONB DEFAULT '{}',
  recipients      TEXT[],
  run_count       INT DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Integrations
CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  provider        TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  config          JSONB DEFAULT '{}',  -- encrypted in prod
  last_sync_at    TIMESTAMPTZ,
  next_sync_at    TIMESTAMPTZ,
  sync_frequency  TEXT,
  error_message   TEXT,
  connected_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs (append-only)
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ DEFAULT now(),
  user_id         UUID REFERENCES users(id),
  user_name       TEXT,
  user_role       TEXT,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     TEXT,
  resource_name   TEXT,
  ip_address      INET,
  user_agent      TEXT,
  changes         JSONB,
  severity        TEXT DEFAULT 'info'
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Cash Flow Forecasts (generated/stored by forecast engine)
CREATE TABLE cashflow_forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  projected       NUMERIC(18,2),
  actual          NUMERIC(18,2),
  lower_bound     NUMERIC(18,2),
  upper_bound     NUMERIC(18,2),
  cumulative      NUMERIC(18,2),
  model_version   TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now()
);
```

**Redis usage (production):**
- JWT token blacklist (logout/revoke)
- Dashboard summary cache (TTL: 5 min)
- Rate limiting counters
- ERP sync job queue (Bull/BullMQ)

---

## Auth Flow

```
Client                          API Server                      JWT
  |                                 |                            |
  |-- POST /auth/login -----------> |                            |
  |   { email, password }          |                            |
  |                                 |-- verify creds in DB ----> |
  |                                 |<-- sign JWT (8h TTL) ----- |
  |<-- { token, user } ----------- |                            |
  |                                 |                            |
  |-- GET /api/v1/dashboard ------> |                            |
  |   Authorization: Bearer <token> |                            |
  |                                 |-- jwtVerify() -----------> |
  |                                 |<-- decoded payload -------- |
  |                                 |   { sub, email, role, ... }|
  |<-- 200 { data: ... } --------- |                            |
```

**OAuth 2.0 / SAML 2.0** (not yet implemented): Would integrate via a library like `@fastify/passport` with strategies for Google Workspace (OAuth) and Okta/Azure AD (SAML). The JWT payload structure is pre-designed to support SSO claims mapping.

---

## Mock Data Summary

| Resource | Count |
|----------|-------|
| Transactions | 55 (real vendors: AWS, GCP, Salesforce, Snowflake, Workday, HubSpot, etc.) |
| Departments | 8 (Engineering, Sales, Marketing, HR, Finance, IT, Operations, Customer Success) |
| Budgets | 8 (one per department, Q1 FY2026) |
| Anomalies | 11 (mix of severity/status, various anomaly types) |
| Reports | 5 (active, draft, various frequencies) |
| Integrations | 6 (NetSuite, QuickBooks, Brex, Expensify, Workday HCM, SAP S/4HANA) |
| Vendors | 10 with 6-month spend trends |
| Audit Logs | 15 pre-seeded (grows as PATCH /anomalies is called) |
| Cash Flow | 90 days generated (60 days past actuals + 30 days forecast) |
| Users | 10 across all 5 RBAC roles |

Finance department is intentionally **over-budget (108%)** — creates realistic alert scenario.

---

## Open Questions / Production Blockers

1. **Tighter RBAC per endpoint**: Currently `requireAuth` is used for most routes. In production, `dept_owner` should only see their own department's transactions/budgets. Needs row-level scoping in DB queries.

2. **Password hashing**: Demo uses plaintext comparison. Production needs `bcrypt` (work factor 12+) or `argon2`.

3. **JWT refresh tokens**: 8-hour expiry is acceptable for demo. Production needs a refresh token rotation strategy with a Redis blacklist for logout.

4. **Real ERP sync engine**: The `POST /integrations/:id/sync` endpoint simulates a sync. Production needs a BullMQ job queue with NetSuite/QuickBooks API OAuth flows, idempotent upsert logic, and failure retry.

5. **Cash flow model**: Current forecast is deterministic math. Production needs an ML model (linear regression or ARIMA) trained on 12+ months of actuals, fed by the transaction DB.

6. **Audit log immutability**: In-memory logs can be mutated. Production needs append-only storage (possibly separate audit DB or append-only S3 log + DB index).

7. **Multi-tenancy**: All data is single-company. Production needs `org_id` scoping on every table and JWT claim, plus subdomain/tenant routing.

8. **ERP bidirectional sync conflict resolution**: When both sides update the same GL entry, need a last-writer-wins or event-sourcing strategy.

9. **Anomaly detection engine**: Currently anomalies are static data. Production needs a streaming pipeline (e.g., Kafka + rule engine) that evaluates each incoming transaction against rules (velocity, amount thresholds, off-hours, duplicate detection).

10. **File exports**: `GET /reports/:id/export` is not yet implemented. Would generate PDF/CSV/XLSX on demand using a headless renderer (Puppeteer for PDF, fast-csv for CSV).
