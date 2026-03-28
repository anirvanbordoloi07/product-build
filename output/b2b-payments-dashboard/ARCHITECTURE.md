# System Architecture
## B2B Payments Analytics Dashboard

**Version:** 1.0
**Date:** March 28, 2026
**Author:** Senior Systems & Infrastructure Engineer
**Status:** Draft — Ready for Engineering Review

---

## Table of Contents

1. [Existing Codebase Audit](#1-existing-codebase-audit)
2. [Architecture Overview](#2-architecture-overview)
3. [System Diagram](#3-system-diagram)
4. [Service Catalog](#4-service-catalog)
5. [Data Flow](#5-data-flow)
6. [Integration Specifications](#6-integration-specifications)
7. [Environment Variables](#7-environment-variables)
8. [Infrastructure Setup](#8-infrastructure-setup)
9. [Security Architecture](#9-security-architecture)
10. [Scalability and Reliability](#10-scalability-and-reliability)

---

## 1. Existing Codebase Audit

### What Exists

```
/app/b2b-payments-dashboard/
└── frontend/
    ├── index.html
    ├── package.json          # React 18.3, Recharts, react-router-dom, Tailwind
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
    └── src/                  # Empty — no source files yet
        ├── components/
        │   ├── layout/       # Empty
        │   └── ui/           # Empty
        ├── data/             # Empty
        ├── hooks/            # Empty
        ├── pages/            # Empty
        ├── store/            # Empty
        ├── types/            # Empty
        └── utils/            # Empty
```

### Audit Findings

| Item | Status | Notes |
|------|--------|-------|
| Frontend scaffold | Exists | Vite + React 18.3 + TypeScript + Tailwind — correct stack |
| React version | Needs upgrade | package.json pins React 18.3; PRD specifies React 19 |
| Zustand | Missing | Not in package.json; needed for global state |
| TanStack Query | Missing | Not in package.json; needed for server state / caching |
| TanStack Table | Missing | Not in package.json; needed for transaction data grids |
| Radix UI / shadcn | Missing | Not in package.json; component library not installed |
| D3.js | Missing | Not in package.json; needed for custom financial charts |
| Backend | Does not exist | No backend directory, no Node.js/Fastify service |
| Python ML service | Does not exist | No data pipeline or ML service |
| Database | Does not exist | No schema, no migrations, no ORM config |
| Infrastructure | Does not exist | No Dockerfile, no docker-compose, no K8s manifests |
| Auth | Does not exist | No auth service or SSO config |
| .env.example | Does not exist | Created as part of this architecture document |

### Required Changes to Existing Code

1. **Upgrade React to 19** — update `package.json` `react` and `react-dom` to `^19.0.0`; update `@types/react` and `@types/react-dom` accordingly.
2. **Add missing frontend dependencies** — Zustand, TanStack Query, TanStack Table, Radix UI primitives, D3.js, React Grid Layout.
3. **All other layers are greenfield** — backend, data pipeline, ML service, databases, auth, and infrastructure must be built from scratch per the specifications below.

---

## 2. Architecture Overview

The platform is a **multi-tenant SaaS analytics layer**. It does not process payments — it ingests, normalizes, stores, and analyzes data from upstream payment systems. The architecture follows a service-oriented pattern with clear domain boundaries:

| Domain | Responsibility |
|--------|---------------|
| **Web Application** | React 19 SPA; primary user interface |
| **API Service** | Fastify/Node.js REST API; all client-facing business logic |
| **Data Pipeline Service** | Python/FastAPI + Celery; ingests and normalizes data from all upstream integrations |
| **ML Service** | Python; anomaly detection, categorization inference, cash flow forecasting |
| **Auth Service** | Token issuance, SAML/OAuth SSO, RBAC enforcement |
| **Notification Service** | Alert fanout — email, Slack, Teams, in-app |
| **Report Service** | Async report generation; exports to PDF/CSV/Sheets |
| **ERP Sync Service** | Bidirectional ERP sync orchestration via Temporal |
| **OLTP Database** | PostgreSQL (Aurora) — transactional records, users, orgs, configs |
| **OLAP Database** | ClickHouse — aggregation queries over transaction history |
| **Message Broker** | Apache Kafka — event streaming between services |
| **Cache** | Redis — session data, KPI caches, rate limiting |
| **Search** | Elasticsearch — full-text transaction and vendor search |
| **File Storage** | AWS S3 — PDFs, exports, receipt images |
| **Job Orchestration** | Temporal — durable ERP sync and ETL workflows |
| **API Gateway** | Kong — rate limiting, auth enforcement, routing |

---

## 3. System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL CLIENTS                                  │
│                                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                   │
│   │  Web Browser │   │  Mobile App  │   │  API Client  │                   │
│   │ (React 19 +  │   │ (React Natv) │   │ (Partner /   │                   │
│   │  TypeScript) │   │              │   │  Embedded SDK│                   │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                   │
└──────────┼──────────────────┼──────────────────┼───────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│                    AWS CLOUDFRONT CDN                         │
│              (Static assets + API edge caching)               │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   AWS APPLICATION LOAD BALANCER               │
│                   + AWS WAF (DDoS / injection protection)     │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                   KONG API GATEWAY                            │
│   Rate limiting · Auth token validation · Route dispatch     │
│   Request logging → Datadog · mTLS between services          │
└──┬──────────────┬──────────────┬──────────────┬─────────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  AUTH   │ │   API    │ │  REPORT  │ │ NOTIFICATION │
│ SERVICE │ │ SERVICE  │ │ SERVICE  │ │   SERVICE    │
│         │ │          │ │          │ │              │
│ Node.js │ │ Fastify  │ │ Node.js  │ │  Node.js     │
│ Passport│ │ TypeScript│ │ Puppeteer│ │  Nodemailer  │
│ SAML 2.0│ │          │ │ (PDF gen)│ │  Slack SDK   │
│ OAuth2  │ │          │ │          │ │  Teams SDK   │
└────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
     │           │             │              │
     └───────────┴──────┬──────┴──────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │    APACHE KAFKA     │
             │  (Event Streaming)  │
             │                     │
             │ Topics:             │
             │  transactions.raw   │
             │  transactions.norm  │
             │  anomaly.alerts     │
             │  erp.sync.events    │
             │  budget.updates     │
             │  notification.queue │
             └──────┬──────┬───────┘
                    │      │
          ┌─────────┘      └──────────┐
          ▼                           ▼
┌──────────────────┐       ┌──────────────────────┐
│  DATA PIPELINE   │       │    ML SERVICE         │
│    SERVICE       │       │                       │
│                  │       │  Python 3.12          │
│  Python 3.12     │       │  scikit-learn / PyOD  │
│  FastAPI         │       │  Prophet (forecasting)│
│  Celery workers  │       │  Claude API           │
│  Temporal client │       │   (categorization +   │
│                  │       │    narrative)          │
│  Connectors:     │       │  Feast feature store  │
│  - Ramp          │       │  Redis (model cache)  │
│  - Brex          │       │                       │
│  - Amex          │       └──────────┬────────────┘
│  - Navan         │                  │
│  - Bill.com      │                  │
│  - Tipalti       │                  │
│  - Coupa         │                  │
│  - Plaid         │                  │
│  - JPMorgan      │                  │
└────────┬─────────┘                  │
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    ERP SYNC SERVICE                           │
│                                                              │
│   Temporal Workflows (durable, retryable)                    │
│   Connectors: NetSuite · QuickBooks · SAP · Xero · Workday   │
│   Bidirectional: Transactions OUT → ERP / Budgets IN         │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                    │
│                                                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │   PostgreSQL     │  │   ClickHouse      │  │   Redis (Cluster)      │  │
│  │   (Aurora v2)    │  │   (OLAP)          │  │                        │  │
│  │                  │  │                   │  │  - Session tokens      │  │
│  │  - users         │  │  - transactions   │  │  - KPI cache (5 min)   │  │
│  │  - organizations │  │    (partitioned   │  │  - Rate limit counters │  │
│  │  - integrations  │  │    by org + date) │  │  - Job queues          │  │
│  │  - budgets       │  │  - spend_agg      │  │  - Pub/sub             │  │
│  │  - erp_mappings  │  │  - vendor_metrics │  │                        │  │
│  │  - audit_log     │  │  - anomaly_scores │  └────────────────────────┘  │
│  │  - reports       │  │  - forecasts      │                              │
│  │  - roles/perms   │  │                   │  ┌────────────────────────┐  │
│  │  TimescaleDB ext │  └──────────────────┘  │   Elasticsearch        │  │
│  │  (time-series)   │                         │   (OpenSearch)         │  │
│  └─────────────────┘                          │                        │  │
│                                               │  - tx_search index     │  │
│  ┌─────────────────────────────────────────┐  │  - vendor_search index │  │
│  │   AWS S3                                 │  │  - Full-text search    │  │
│  │                                          │  └────────────────────────┘  │
│  │  - /exports/{org_id}/reports/            │                              │
│  │  - /receipts/{org_id}/{year}/{month}/    │                              │
│  │  - /jd-documents/                        │                              │
│  │  - /ml-models/artifacts/                 │                              │
│  └─────────────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY LAYER                                   │
│                                                                         │
│   Datadog (APM + Infrastructure)   ·   Sentry (Errors + Source Maps)   │
│   AWS CloudWatch (Infra metrics)   ·   LaunchDarkly (Feature Flags)    │
│   Temporal UI (Workflow visibility)                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    UPSTREAM INTEGRATIONS                                 │
│                                                                         │
│   Card/Spend:  Ramp API · Brex API · Amex API · Navan API              │
│   AP/Payments: Bill.com API · Tipalti API · Coupa API                  │
│   Banking:     Plaid · JPMorgan Access API                              │
│   ERP:         NetSuite SuiteQL · QuickBooks API · SAP RFC/BAPIs        │
│               Xero API · Workday SOAP/REST                              │
│   Alerts:      Slack Webhooks · Microsoft Teams Webhooks               │
│   SSO:         Google Workspace SAML · Microsoft Entra ID              │
│   AI:          Anthropic Claude API (categorization + narratives)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Service Catalog

### 4.1 Frontend — Web Application

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 20 LTS (build only) |
| **Framework** | React 19 + TypeScript 5.4 |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Component Library** | Radix UI primitives + shadcn/ui |
| **State — Global** | Zustand 4 |
| **State — Server** | TanStack Query v5 (React Query) |
| **Charts** | Recharts 2 (standard) + D3.js v7 (custom financial) |
| **Tables** | TanStack Table v8 (virtual scrolling, filtering, sorting) |
| **Report Builder** | React Grid Layout (drag-and-drop) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod |
| **Date handling** | date-fns |
| **Icons** | Lucide React |
| **Hosting** | AWS S3 + CloudFront |
| **CDN** | CloudFront (edge caching, gzip/brotli) |

**Rationale:** React 19 with concurrent features (Suspense boundaries, streaming) is optimal for a data-dense dashboard. Zustand replaces Redux boilerplate without sacrificing predictability. TanStack Query handles all server state, caching, background refetch, and optimistic updates — critical for real-time financial data. Radix + shadcn gives accessible, unstyled primitives that can be fully themed to match enterprise finance aesthetics.

---

### 4.2 API Service

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Fastify 4 + TypeScript |
| **ORM** | Prisma (PostgreSQL) |
| **Validation** | Zod (shared schemas with frontend) |
| **Auth middleware** | custom JWT validation + RBAC guard |
| **API style** | REST (versioned: `/api/v1/`) + Webhooks |
| **Rate limiting** | Kong plugin (upstream) + Fastify rate-limit (defense-in-depth) |
| **Containerization** | Docker |
| **Health checks** | `/health` (liveness) + `/ready` (readiness) |

**Key responsibilities:**
- All CRUD operations for users, organizations, integrations, budgets, reports
- Query interface for transaction data (proxies to ClickHouse for OLAP, PostgreSQL for OLTP)
- Webhook ingestion endpoint for real-time transaction pushes from card platforms
- SSE (Server-Sent Events) endpoint for live dashboard updates
- Delegates ML inference to ML Service via internal HTTP

**Rationale:** Fastify outperforms Express by 2–3x on throughput benchmarks. TypeScript consistency across frontend and backend reduces context switching and enables shared Zod schema validation. Prisma provides type-safe database access with migration management.

---

### 4.3 Data Pipeline Service

| Property | Value |
|----------|-------|
| **Runtime** | Python 3.12 |
| **API** | FastAPI (health, admin, trigger endpoints) |
| **Task Queue** | Celery 5 + Redis broker |
| **Workflow Orchestration** | Temporal (durable long-running ERP syncs) |
| **HTTP Client** | httpx (async) |
| **Data validation** | Pydantic v2 |
| **Scheduling** | Temporal cron schedules (replaces Celery Beat for critical jobs) |
| **Containerization** | Docker |

**Key responsibilities:**
- Poll card/AP/banking APIs on configured intervals (per integration)
- Receive webhook pushes for real-time transaction data
- Normalize all transactions to canonical `Transaction` schema
- Deduplicate across sources (matching on amount + date + vendor fingerprint)
- Publish normalized events to Kafka `transactions.normalized` topic
- Write raw payloads to S3 for audit/replay

**Connector map (v1):**

| Source | Method | Polling Interval |
|--------|--------|-----------------|
| Ramp | OAuth REST API | Real-time webhook + 15 min poll |
| Brex | OAuth REST API | Real-time webhook + 15 min poll |
| Amex | REST API (Amex for Developers) | 30 min poll |
| Navan | REST API | 30 min poll |
| Bill.com | REST API | 15 min poll |
| Tipalti | REST API | 30 min poll |
| Coupa | REST API (OAuth) | 30 min poll |
| Plaid | Webhooks (primary) + REST fallback | Webhook-driven |
| JPMorgan Access | REST API | 60 min poll |

---

### 4.4 ML Service

| Property | Value |
|----------|-------|
| **Runtime** | Python 3.12 |
| **API** | FastAPI (inference endpoints) |
| **Anomaly Detection** | scikit-learn (Isolation Forest), PyOD (DBSCAN, LOF) |
| **Forecasting** | Prophet (Meta) for 30/60/90-day cash flow |
| **Categorization** | Claude API (claude-3-5-haiku for speed/cost; claude-opus for ambiguous) |
| **Narrative generation** | Claude API (claude-opus-4) |
| **Feature store** | Feast (open source) backed by Redis online store + S3 offline store |
| **Model artifacts** | Stored in AWS S3 `/ml-models/artifacts/` |
| **Model versioning** | MLflow tracking server |

**Inference endpoints:**

| Endpoint | Model | SLA |
|----------|-------|-----|
| `POST /categorize` | Claude API | < 500ms P95 |
| `POST /anomaly/score` | Isolation Forest | < 100ms P95 |
| `GET /forecast/{org_id}` | Prophet | < 2s P95 (cached 4hr) |
| `POST /narrative/generate` | Claude API (opus) | < 10s (async) |

**Model training pipeline:**
- Anomaly model: retrained nightly per organization using last 90 days of transactions
- Categorization: few-shot prompting with organization-specific vendor→GL mappings passed as context
- False positive feedback loop: user dismissals/corrections logged to PostgreSQL, fed back into prompt context and periodic retraining

---

### 4.5 Auth Service

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Fastify |
| **Token format** | JWT (RS256) — asymmetric keys rotated every 30 days |
| **Session storage** | Redis (short-lived sessions, refresh token rotation) |
| **SSO protocols** | SAML 2.0, OAuth 2.0 / OIDC |
| **SSO providers** | Google Workspace, Microsoft Entra ID (Azure AD) |
| **Password hashing** | bcrypt (cost factor 12) |
| **MFA** | TOTP (RFC 6238) via Speakeasy; hardware key (WebAuthn/FIDO2) |

**RBAC model:**

| Role | Scope |
|------|-------|
| `org:admin` | Full org access including billing, integrations, user management |
| `finance:manager` | All financial data, all entities, all reports |
| `department:owner` | Own cost center(s) only; read + approve workflow |
| `viewer` | Read-only, scoped to permitted entities/departments |
| `auditor` | Read-only including audit log; no write access |
| `api:service` | Machine-to-machine OAuth client credentials |

Row-level security (RLS) is enforced at the PostgreSQL level via `org_id` and `department_id` columns, providing defense-in-depth beyond application-layer RBAC.

---

### 4.6 Notification Service

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Fastify |
| **Email** | AWS SES (transactional) |
| **Email templates** | React Email (JSX-based email rendering) |
| **Slack integration** | Slack Bolt SDK (webhook + App API) |
| **Teams integration** | Microsoft Teams Incoming Webhooks + Adaptive Cards |
| **In-app notifications** | PostgreSQL `notifications` table + SSE push |
| **Queue** | Kafka topic `notification.queue` consumed by this service |

---

### 4.7 Report Service

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 20 LTS |
| **PDF generation** | Puppeteer (headless Chromium — renders HTML templates to PDF) |
| **CSV generation** | Fast-csv |
| **Excel export** | ExcelJS |
| **Google Sheets export** | Google Sheets API v4 |
| **Storage** | AWS S3 with pre-signed URLs (15 min expiry for downloads) |
| **Async processing** | Kafka `report.generation.queue` → worker consumers |
| **Scheduling** | Temporal cron workflows (for scheduled report delivery) |

---

### 4.8 ERP Sync Service

| Property | Value |
|----------|-------|
| **Runtime** | Python 3.12 |
| **Orchestration** | Temporal (durable workflows with retry/timeout semantics) |
| **NetSuite** | SuiteQL + REST Record API |
| **QuickBooks Online** | QuickBooks API v3 (OAuth 2.0) |
| **QuickBooks Desktop** | Intuit Web Connector (on-premise bridge) |
| **SAP** | RFC/BAPI via pyrfc + SAP Business Technology Platform APIs |
| **Xero** | Xero API (OAuth 2.0) |
| **Workday** | Workday REST API + SOAP (Financial Management module) |

**Sync directions:**

| Direction | Data | Frequency |
|-----------|------|-----------|
| ERP → Dashboard | Chart of accounts, GL codes, budgets, cost centers | 15 min / on change |
| Dashboard → ERP | Categorized transactions, journal entries | Real-time (cards) / 15 min batch (AP) |

**Temporal workflow design:**
Each ERP sync is a durable Temporal workflow. If a sync step fails (network timeout, API rate limit), Temporal replays from the last checkpoint. No data is lost. Sync history and error logs are exposed in the dashboard UI via the ERP Sync Service admin API.

---

### 4.9 Message Broker — Apache Kafka

| Property | Value |
|----------|-------|
| **Deployment** | Amazon MSK (Managed Streaming for Kafka) |
| **Version** | Kafka 3.6 |
| **Replication factor** | 3 (production) |
| **Retention** | 7 days (raw transaction topics) |

**Topic design:**

| Topic | Producers | Consumers | Partitioning |
|-------|-----------|-----------|-------------|
| `transactions.raw` | Data Pipeline Service | ML Service, ClickHouse Kafka connector | By `org_id` |
| `transactions.normalized` | ML Service | API Service (SSE), ClickHouse Kafka connector | By `org_id` |
| `anomaly.alerts` | ML Service | Notification Service, API Service | By `org_id` |
| `erp.sync.events` | ERP Sync Service | API Service (audit log), Notification Service | By `org_id` |
| `budget.updates` | API Service | Notification Service, ML Service | By `org_id` |
| `notification.queue` | API Service, ML Service | Notification Service | Round-robin |
| `report.generation.queue` | API Service | Report Service | Round-robin |

---

### 4.10 Databases

#### PostgreSQL (AWS Aurora v2 — OLTP)

**Multi-tenant isolation:** All tables include `org_id` column. Row-level security policies enforce tenant isolation at the database layer. No cross-tenant data leakage is possible even with application bugs.

**Key schema domains:**

```
organizations        users               roles
integrations         oauth_tokens        saml_configurations
budgets              cost_centers        budget_periods
erp_field_mappings   erp_sync_logs       erp_sync_errors
reports              report_schedules    report_exports
notifications        notification_rules  alert_thresholds
audit_log            feature_flags       api_keys
```

**Extensions required:** `uuid-ossp`, `pgcrypto`, `timescaledb` (for time-series metrics)

#### ClickHouse (OLAP)

**Deployment:** ClickHouse Cloud (managed) or self-hosted on EKS with persistent volumes

**Key tables:**

```sql
-- Primary transaction table (partitioned by toYYYYMM(transaction_date), ordered by (org_id, transaction_date))
transactions (
    transaction_id UUID,
    org_id UUID,
    source_platform String,    -- 'ramp', 'brex', 'bill_com', etc.
    transaction_date DateTime,
    amount Decimal64(2),
    currency LowCardinality(String),
    vendor_name String,
    vendor_id String,
    gl_code String,
    department_id String,
    cost_center_id String,
    entity_id String,
    payment_method LowCardinality(String),
    category LowCardinality(String),
    anomaly_score Float32,
    is_flagged Bool,
    raw_source_id String,
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY (org_id, toYYYYMM(transaction_date))
ORDER BY (org_id, transaction_date, vendor_id);

-- Pre-aggregated spend by org/department/period (materialized view)
spend_aggregates_mv (org_id, period_month, department_id, category, total_amount, tx_count)

-- Vendor metrics table
vendor_metrics (org_id, vendor_id, vendor_name, period_month, total_spend, avg_transaction, tx_count)

-- Anomaly scores time-series
anomaly_scores (org_id, transaction_id, score, model_version, scored_at)
```

**Query SLA target:** < 3 seconds for any aggregation query over 12 months of data (up to 10M rows per org).

#### Redis (Cluster Mode)

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `session:{token}` | 24h | User session data |
| `kpi:{org_id}:overview` | 5 min | Unified spend overview KPIs |
| `kpi:{org_id}:budget:{dept_id}` | 2 min | Budget vs. actuals per department |
| `forecast:{org_id}` | 4h | Cached ML forecast |
| `ratelimit:{ip}:{endpoint}` | 60s | API rate limit counters |
| `integration:token:{integration_id}` | variable | Cached OAuth tokens |
| `ml:model:{org_id}:anomaly` | 24h | Serialized anomaly model |

#### Elasticsearch (AWS OpenSearch Service)

**Indices:**

| Index | Documents | Use Case |
|-------|-----------|---------|
| `transactions` | One doc per transaction | Full-text search on memo/description/vendor |
| `vendors` | One doc per org-vendor | Vendor search and deduplication |

**Sync mechanism:** Kafka connector consumes from `transactions.normalized` → indexes into OpenSearch asynchronously (< 5s lag).

---

### 4.11 Infrastructure Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **DNS** | Route 53 | Domain management, health-check-based failover |
| **CDN** | CloudFront | Static asset delivery, API edge caching |
| **Load Balancer** | AWS ALB | Layer 7 routing, SSL termination, health checks |
| **WAF** | AWS WAF v2 | OWASP Top 10 protection, rate limiting, geo-blocking |
| **Secrets** | AWS Secrets Manager | All credentials, API keys, DB passwords |
| **Config** | AWS Parameter Store | Non-secret environment configuration |
| **Containers** | Amazon EKS (K8s 1.29) | Container orchestration for all services |
| **Container Registry** | Amazon ECR | Docker image storage |
| **Kafka** | Amazon MSK | Managed Kafka |
| **Object Storage** | AWS S3 | Exports, receipts, ML artifacts, raw ingestion |
| **VPN** | AWS Client VPN | Developer and admin access to private subnets |
| **CI/CD** | GitHub Actions + ArgoCD | Build pipeline + GitOps deployment |
| **Monitoring** | Datadog | APM, infrastructure, log aggregation, dashboards |
| **Error tracking** | Sentry | Runtime errors with source maps |
| **Feature flags** | LaunchDarkly | Progressive rollout, A/B testing |
| **Workflow engine** | Temporal Cloud | Durable workflow orchestration |

---

## 5. Data Flow

### 5.1 Transaction Ingestion Flow (Real-Time Webhook Path)

```
1. Card platform (e.g., Ramp) fires webhook to:
   POST https://api.paymentiq.com/v1/webhooks/ramp/{org_id}

2. Kong API Gateway validates HMAC signature, routes to Data Pipeline Service

3. Data Pipeline Service:
   a. Validates payload with Pydantic schema
   b. Deduplicates against Redis bloom filter (transaction_id + source)
   c. Persists raw payload to S3: s3://raw-ingestion/{source}/{org_id}/{date}/{id}.json
   d. Publishes to Kafka topic: transactions.raw

4. ML Service consumes transactions.raw:
   a. Calls Claude API for GL categorization (< 500ms)
   b. Runs Isolation Forest anomaly scoring (< 100ms)
   c. Enriches transaction with: category, gl_code, anomaly_score, is_flagged
   d. Publishes enriched event to Kafka: transactions.normalized

5. Multiple consumers process transactions.normalized in parallel:
   a. ClickHouse Kafka connector → inserts into transactions table
   b. OpenSearch Kafka connector → indexes into transactions index
   c. API Service consumer → pushes SSE event to connected clients (live dashboard update)
   d. Notification Service consumer → evaluates alert rules, fires if triggered

6. If anomaly_score > threshold:
   a. ML Service publishes to anomaly.alerts topic
   b. Notification Service sends: in-app alert + email + Slack/Teams (if configured)
```

### 5.2 Transaction Ingestion Flow (Polling Path)

```
1. Temporal cron workflow fires every 15–60 min per integration per org

2. Data Pipeline Service worker:
   a. Fetches access token from Redis / refreshes via OAuth if expired
   b. Calls integration API with last_sync_timestamp cursor
   c. Pages through results (handles pagination)
   d. For each transaction: dedup check → S3 raw store → Kafka transactions.raw

3. Continues same as webhook flow from step 4 above
```

### 5.3 Dashboard Query Flow

```
1. User opens Unified Spend Overview dashboard

2. React Query checks browser cache (stale-while-revalidate strategy)

3. If stale: GET /api/v1/orgs/{org_id}/spend/overview?from=...&to=...

4. Kong validates JWT → routes to API Service

5. API Service:
   a. Checks Redis cache: key kpi:{org_id}:overview:{hash(params)}
   b. Cache hit → return immediately (< 50ms)
   c. Cache miss → query ClickHouse:
      SELECT department_id, category, SUM(amount), COUNT(*)
      FROM transactions
      WHERE org_id = ? AND transaction_date BETWEEN ? AND ?
      GROUP BY department_id, category
   d. Store result in Redis with 5-min TTL
   e. Return to client

6. React renders with Recharts bar chart, pie chart, ranked table
```

### 5.4 ERP Bidirectional Sync Flow

```
OUTBOUND (Dashboard → ERP):
1. Temporal workflow: sync_transactions_to_erp_{erp_type}_{org_id}
2. Query ClickHouse for transactions since last_sync_watermark
3. Apply org-configured field mappings (vendor → vendor code, category → GL code)
4. Batch upsert to ERP API (NetSuite SuiteQL, QuickBooks journal entries, etc.)
5. On success: update last_sync_watermark in PostgreSQL
6. On failure: Temporal retries with exponential backoff; alert via Notification Service after 3 failures
7. Publish sync event to Kafka: erp.sync.events

INBOUND (ERP → Dashboard):
1. Temporal workflow: sync_budgets_from_erp_{erp_type}_{org_id}
2. Query ERP for budget records (GL account budgets, cost center budgets)
3. Upsert into PostgreSQL budgets and cost_centers tables
4. Invalidate Redis budget cache for org
5. Publish budget.updates Kafka event → Notification Service evaluates threshold alerts
```

### 5.5 Report Generation Flow (Async)

```
1. User requests report: POST /api/v1/reports/generate {config: {...}}

2. API Service:
   a. Creates report record in PostgreSQL with status=PENDING
   b. Returns 202 Accepted with report_id
   c. Publishes to Kafka: report.generation.queue

3. Report Service worker consumes job:
   a. Executes ClickHouse query(ies) for report data
   b. Applies aggregations, period comparisons
   c. Renders HTML template with data
   d. Puppeteer renders HTML → PDF (or fast-csv → CSV, ExcelJS → XLSX)
   e. Uploads to S3: s3://exports/{org_id}/reports/{report_id}.{ext}
   f. Updates PostgreSQL report record: status=COMPLETE, s3_key=...
   g. Publishes notification event

4. API Service SSE stream pushes update to client: {type: "report_ready", report_id}

5. Client calls: GET /api/v1/reports/{report_id}/download
   → API Service generates pre-signed S3 URL (15 min TTL) → 302 redirect
```

---

## 6. Integration Specifications

### 6.1 Card and Spend Platforms

#### Ramp
- **Auth:** OAuth 2.0 (client credentials + authorization code for orgs)
- **Endpoints:** `/developer/v1/transactions`, `/developer/v1/cards`, `/developer/v1/departments`
- **Webhooks:** `transaction.created`, `transaction.updated` — configure via Ramp Developer Portal
- **Rate limits:** 100 req/min (OAuth), exponential backoff on 429
- **Setup:** Register app at developer.ramp.com, request `transactions:read` scope

#### Brex
- **Auth:** OAuth 2.0
- **Endpoints:** `/v2/transactions/card/primary`, `/v2/budgets`, `/v2/vendors`
- **Webhooks:** Supported via Brex Webhooks API
- **Rate limits:** 1,000 req/hour per token
- **Setup:** Create app at developer.brex.com, enable `transactions.readonly` scope

#### American Express (Amex)
- **Auth:** OAuth 2.0 (Amex for Developers program)
- **Endpoints:** Amex Corporate Data API — `/apiplatform/v3/financials/enhanced/...`
- **Webhooks:** Not supported; polling only
- **Rate limits:** Vary by tier; negotiate at onboarding
- **Setup:** Apply at developer.americanexpress.com (approval process, 2–4 weeks)

#### Navan (formerly TripActions)
- **Auth:** API Key + OAuth 2.0 for customer auth
- **Endpoints:** Navan Developer API — expense reports, transactions, policy data
- **Setup:** Partner API access via navan.com/developers

### 6.2 AP / Payables Platforms

#### Bill.com
- **Auth:** OAuth 2.0 (session-based login + developer key)
- **Endpoints:** Bill.com REST API v3 — `Bill`, `VendorCredit`, `Payment`
- **Webhooks:** Supported (event subscriptions)
- **Multi-org:** Each org requires separate OAuth session

#### Tipalti
- **Auth:** API key (HMAC-signed requests)
- **Endpoints:** Tipalti API — payee list, payment history, AP aging
- **Setup:** Enable API in Tipalti Hub → generate API key

#### Coupa
- **Auth:** OAuth 2.0 (OIDC)
- **Endpoints:** Coupa REST API — `/api/invoices`, `/api/purchase_orders`, `/api/expenses`
- **Rate limits:** 2,000 req/hour per client
- **Setup:** Register integration in Coupa Business Community

### 6.3 Banking

#### Plaid
- **Auth:** Plaid Link (end-user OAuth flow) → access_token
- **Endpoints:** `/transactions/get`, `/transactions/sync` (preferred — incremental updates), `/accounts/get`
- **Webhooks:** `DEFAULT_UPDATE`, `TRANSACTIONS_REMOVED` — near-real-time
- **Products required:** `transactions`, `balance`
- **Setup:** Create app at dashboard.plaid.com; start in Sandbox, promote to Production

#### JPMorgan Access API
- **Auth:** Mutual TLS (mTLS) + OAuth 2.0 (client credentials)
- **Endpoints:** JPMorgan Payments API — account balances, transaction history, wire status
- **Setup:** JPMorgan developer program enrollment; dedicated bank representative required for enterprise customers

### 6.4 ERP Systems

#### NetSuite
- **Auth:** OAuth 1.0a (Token-Based Authentication, TBA) or OAuth 2.0 (OIDC)
- **Query:** SuiteQL (`/query/v1/suiteql`) — SQL-like query over NetSuite records
- **Records API:** `/record/v1/` — CRUD on all standard + custom records
- **Field mapping:** Store customer's subsidiary, account, department segment mappings in PostgreSQL `erp_field_mappings`

#### QuickBooks Online
- **Auth:** OAuth 2.0 (Intuit Identity)
- **Endpoints:** QBO API v3 — `JournalEntry`, `Vendor`, `Account`, `Budget`
- **Webhooks:** Real-time entity change notifications
- **Sandbox:** Use Intuit Developer sandbox company for testing

#### SAP
- **Auth:** OAuth 2.0 (SAP Business Technology Platform) or basic auth (legacy on-premise)
- **Endpoints:** SAP S/4HANA Cloud APIs (OData v4) — `A_JournalEntry`, `A_CostCenter`, `A_GLAccount`
- **On-premise SAP ECC:** RFC/BAPI via `pyrfc` Python library (requires SAP router or VPN)

#### Xero
- **Auth:** OAuth 2.0
- **Endpoints:** Xero API v2 — `ManualJournals`, `Accounts`, `BudgetSummary`, `TrackingCategories`

#### Workday
- **Auth:** OAuth 2.0 (Workday ISU — Integration System User)
- **Endpoints:** Workday REST API + SOAP (Financial Management) — Cost Centers, GL Accounts, Budgets, Journal Entries

### 6.5 Communication Platforms

#### Slack
- **Auth:** OAuth 2.0 (Slack App installation)
- **Method:** Incoming Webhooks (simple alerts) + Slack API `chat.postMessage` (rich messages with Block Kit)
- **Bot scopes:** `incoming-webhook`, `chat:write`
- **Setup:** Create Slack App at api.slack.com/apps; enable Incoming Webhooks

#### Microsoft Teams
- **Auth:** Azure Active Directory OAuth 2.0
- **Method:** Incoming Webhooks (simple) + Teams Bot Framework (interactive Adaptive Cards)
- **Setup:** Register app in Azure AD; enable webhook in Teams channel

### 6.6 SSO Providers

#### Google Workspace (SAML 2.0)
- Entity ID: `https://app.paymentiq.com`
- ACS URL: `https://app.paymentiq.com/auth/saml/google/callback`
- Attribute mapping: `email`, `firstName`, `lastName`, `groups` (for role mapping)

#### Microsoft Entra ID / Azure AD (SAML 2.0 + OIDC)
- SAML and OIDC both supported
- Group claims used for RBAC role mapping
- Supports Conditional Access Policies (enterprise requirement)

### 6.7 AI / ML APIs

#### Anthropic Claude API
- **Models:**
  - `claude-3-5-haiku-20241022` — transaction categorization (high volume, latency-sensitive)
  - `claude-opus-4-5` — narrative report generation (low volume, quality-sensitive)
- **Usage:** Few-shot prompts with org-specific vendor→GL mapping examples
- **Prompt caching:** Use Anthropic prompt caching for system prompts (reduces cost by ~90% for repeated context)
- **Rate limiting:** Handle 529 overload errors with exponential backoff + queue-based retry
- **Cost controls:** Set per-org monthly token budgets; alert at 80% of budget

---

## 7. Environment Variables

See `/app/b2b-payments-dashboard/.env.example` for the canonical template. Reproduced here with annotations:

### Application Core

```bash
NODE_ENV=development                          # development | staging | production
APP_URL=http://localhost:3000                 # Public-facing URL
API_URL=http://localhost:8080                 # Internal API URL
PORT=8080                                     # API service port
LOG_LEVEL=debug                               # debug | info | warn | error
```

### Database

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/b2b_dashboard   # PostgreSQL connection (Prisma format)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
CLICKHOUSE_URL=http://localhost:8123          # ClickHouse HTTP interface
CLICKHOUSE_DATABASE=b2b_analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
REDIS_URL=redis://localhost:6379
REDIS_CLUSTER=false                           # Set true in production
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=paymentiq_
```

### Authentication

```bash
JWT_SECRET=                                   # NEVER use this in prod — use RS256 with key pair
JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem
JWT_EXPIRY=15m                                # Access token TTL
REFRESH_TOKEN_EXPIRY=30d
SESSION_SECRET=                               # Random 64-byte hex string

# SAML / SSO
SAML_GOOGLE_ENTITY_ID=https://app.paymentiq.com
SAML_GOOGLE_SSO_URL=                          # From Google Admin → SAML app
SAML_GOOGLE_CERTIFICATE=                      # Base64 PEM from Google Admin
SAML_MICROSOFT_ENTITY_ID=https://app.paymentiq.com
SAML_MICROSOFT_SSO_URL=                       # From Azure AD → Enterprise app
SAML_MICROSOFT_CERTIFICATE=

# OAuth providers (for SSO, not integration auth)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
MICROSOFT_OAUTH_CLIENT_ID=
MICROSOFT_OAUTH_CLIENT_SECRET=
MICROSOFT_OAUTH_TENANT_ID=
```

### Kafka (Amazon MSK)

```bash
KAFKA_BROKERS=localhost:9092                  # Comma-separated list
KAFKA_SECURITY_PROTOCOL=PLAINTEXT             # SASL_SSL in production
KAFKA_SASL_MECHANISM=SCRAM-SHA-512
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=
KAFKA_CLIENT_ID=b2b-dashboard-api
KAFKA_CONSUMER_GROUP_PREFIX=b2b-dashboard
```

### AWS

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=                            # Use IAM role in production; never hardcode
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_EXPORTS=b2b-dashboard-exports-prod
S3_BUCKET_RAW_INGESTION=b2b-dashboard-raw-prod
S3_BUCKET_ML_ARTIFACTS=b2b-dashboard-ml-artifacts
S3_BUCKET_RECEIPTS=b2b-dashboard-receipts-prod
```

### Integration Credentials — Card Platforms

```bash
# Ramp
RAMP_CLIENT_ID=
RAMP_CLIENT_SECRET=
RAMP_WEBHOOK_SECRET=                          # HMAC secret for webhook signature validation

# Brex
BREX_CLIENT_ID=
BREX_CLIENT_SECRET=
BREX_WEBHOOK_SECRET=

# American Express
AMEX_CLIENT_ID=
AMEX_CLIENT_SECRET=
AMEX_API_KEY=

# Navan
NAVAN_API_KEY=
NAVAN_CLIENT_ID=
NAVAN_CLIENT_SECRET=
```

### Integration Credentials — AP Platforms

```bash
# Bill.com
BILLDOTCOM_CLIENT_ID=
BILLDOTCOM_CLIENT_SECRET=
BILLDOTCOM_DEVELOPER_KEY=

# Tipalti
TIPALTI_API_KEY=
TIPALTI_PAYER_NAME=

# Coupa
COUPA_CLIENT_ID=
COUPA_CLIENT_SECRET=
COUPA_BASE_URL=                               # https://yourcompany.coupahost.com
```

### Integration Credentials — Banking

```bash
# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox                             # sandbox | development | production
PLAID_WEBHOOK_URL=https://api.paymentiq.com/v1/webhooks/plaid

# JPMorgan Access
JPMORGAN_CLIENT_ID=
JPMORGAN_CLIENT_SECRET=
JPMORGAN_MTLS_CERT_PATH=/run/secrets/jpmorgan_cert.pem
JPMORGAN_MTLS_KEY_PATH=/run/secrets/jpmorgan_key.pem
JPMORGAN_API_BASE_URL=https://api-sandbox.jpmorgan.com
```

### Integration Credentials — ERP

```bash
# NetSuite
NETSUITE_ACCOUNT_ID=
NETSUITE_CONSUMER_KEY=
NETSUITE_CONSUMER_SECRET=
NETSUITE_TOKEN_ID=
NETSUITE_TOKEN_SECRET=

# QuickBooks Online
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_ENVIRONMENT=sandbox                       # sandbox | production
QBO_WEBHOOK_VERIFIER_TOKEN=

# SAP (Cloud)
SAP_BTP_CLIENT_ID=
SAP_BTP_CLIENT_SECRET=
SAP_BTP_TOKEN_URL=
SAP_S4HANA_BASE_URL=

# Xero
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_WEBHOOK_KEY=

# Workday
WORKDAY_TENANT=
WORKDAY_ISU_USERNAME=
WORKDAY_ISU_PASSWORD=
WORKDAY_BASE_URL=                             # https://wd3.myworkday.com/yourco/...
```

### Communication Platforms

```bash
# Slack
SLACK_BOT_TOKEN=                              # xoxb-...
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# Microsoft Teams
TEAMS_APP_ID=
TEAMS_APP_PASSWORD=
TEAMS_TENANT_ID=
```

### AI / ML

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL_CATEGORIZATION=claude-3-5-haiku-20241022
ANTHROPIC_MODEL_NARRATIVE=claude-opus-4-5
ANTHROPIC_MAX_TOKENS_CATEGORIZATION=256
ANTHROPIC_MAX_TOKENS_NARRATIVE=2048

# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_EXPERIMENT_NAME=b2b-anomaly-detection
```

### Temporal

```bash
TEMPORAL_ADDRESS=localhost:7233               # Temporal Cloud address in production
TEMPORAL_NAMESPACE=b2b-dashboard-prod
TEMPORAL_API_KEY=                             # Temporal Cloud API key
```

### Observability

```bash
# Datadog
DD_API_KEY=
DD_APP_KEY=
DD_ENV=development
DD_SERVICE=b2b-dashboard-api
DD_VERSION=1.0.0

# Sentry
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1               # 10% trace sampling in production

# LaunchDarkly
LAUNCHDARKLY_SDK_KEY=
LAUNCHDARKLY_CLIENT_SIDE_ID=               # For frontend
```

### Email

```bash
# AWS SES
SES_FROM_ADDRESS=noreply@paymentiq.com
SES_FROM_NAME=PaymentIQ
SES_REGION=us-east-1
SES_CONFIGURATION_SET=b2b-dashboard-transactional
```

---

## 8. Infrastructure Setup

### 8.1 Local Development Environment

**Prerequisites:**
- Docker Desktop 4.x
- Node.js 20 LTS
- Python 3.12
- AWS CLI v2 (for S3 access; can use LocalStack instead)

**docker-compose services (local):**

```yaml
# Abbreviated — full file at infra/docker-compose.dev.yml
services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: b2b_dashboard
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev

  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    ports: ["8123:8123", "9000:9000"]

  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    ports: ["9200:9200"]
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    ports: ["2181:2181"]

  temporal:
    image: temporalio/auto-setup:1.24
    ports: ["7233:7233"]
    depends_on: [postgres]

  temporal-ui:
    image: temporalio/ui:2.26.2
    ports: ["8088:8080"]
```

**Startup sequence:**

```bash
# 1. Start all infrastructure services
docker-compose -f infra/docker-compose.dev.yml up -d

# 2. Run database migrations
cd services/api && npx prisma migrate dev

# 3. Initialize ClickHouse schema
python scripts/init_clickhouse.py

# 4. Create Kafka topics
python scripts/init_kafka_topics.py

# 5. Seed development data
cd services/api && npx ts-node scripts/seed.ts

# 6. Start all services (using tmux or Procfile)
# Frontend
cd app/b2b-payments-dashboard/frontend && npm run dev

# API Service
cd services/api && npm run dev

# Data Pipeline Service
cd services/pipeline && uvicorn main:app --reload --port 8001

# ML Service
cd services/ml && uvicorn main:app --reload --port 8002

# Temporal worker (ERP Sync)
cd services/erp-sync && python worker.py
```

---

### 8.2 Target Deployment Architecture (AWS)

#### AWS Account Structure

```
AWS Organization Root
├── Management Account (billing, SCPs)
├── Production Account
│   ├── VPC: 10.0.0.0/16
│   │   ├── Public Subnets:  10.0.1.0/24, 10.0.2.0/24 (ALB, NAT GW)
│   │   ├── Private Subnets: 10.0.10.0/24, 10.0.11.0/24 (EKS nodes)
│   │   └── Data Subnets:    10.0.20.0/24, 10.0.21.0/24 (RDS, ElastiCache)
├── Staging Account
└── Development Account
```

#### Kubernetes (EKS) Namespaces

```
k8s namespaces:
├── b2b-dashboard-core        # API service, Auth service
├── b2b-dashboard-pipeline    # Data pipeline, ML service
├── b2b-dashboard-workers     # Report service, Notification service, ERP sync
├── b2b-dashboard-data        # ClickHouse (if self-hosted), Elasticsearch
├── monitoring                # Datadog agents, Prometheus (optional)
└── temporal-system           # Temporal worker deployments
```

#### Service Sizing (Production, Initial Scale)

| Service | Replicas | CPU Request | Memory Request | Notes |
|---------|----------|-------------|----------------|-------|
| API Service | 3 | 500m | 512Mi | HPA: scale to 10 at 70% CPU |
| Auth Service | 2 | 250m | 256Mi | Stateless; scale conservatively |
| Data Pipeline | 3 | 1000m | 1Gi | Celery workers; scale by queue depth |
| ML Service | 2 | 2000m | 2Gi | CPU-bound inference; scale with queue |
| Report Service | 2 | 1000m | 2Gi | Puppeteer needs memory |
| Notification Service | 2 | 250m | 256Mi | Kafka consumer; lightweight |
| ERP Sync (Temporal) | 2 | 500m | 512Mi | Temporal worker |

#### CI/CD Pipeline (GitHub Actions + ArgoCD)

```
Developer pushes to feature branch
    └── GitHub Actions: lint, typecheck, unit tests, integration tests (docker-compose)
        └── PR merged to main
            └── GitHub Actions: build Docker images, push to ECR
                └── ArgoCD (GitOps): detects new image tag in infra/k8s/
                    └── Staging deploy (automatic)
                        └── Smoke tests pass
                            └── Production deploy (manual approval gate for P0 releases)
```

**Branch strategy:**
- `main` → staging deployment on merge
- `release/*` → production deployment (requires 2 approvals in GitHub)
- Feature branches → CI only; no auto-deploy

#### Database Deployment

| Database | AWS Service | Config |
|----------|-------------|--------|
| PostgreSQL | Aurora PostgreSQL v15.4 | Writer + 1 read replica; Multi-AZ failover < 30s |
| ClickHouse | ClickHouse Cloud OR self-hosted on EKS (m6i.2xlarge, 100GB GP3) | Start with ClickHouse Cloud to reduce ops burden |
| Redis | ElastiCache (Redis 7.2, cluster mode) | 3 shards × 1 replica; r7g.large nodes |
| Elasticsearch | AWS OpenSearch Service 2.x | 3 data nodes (m6g.large.search) |

---

## 9. Security Architecture

### 9.1 Defense in Depth

```
Layer 1: Network — AWS WAF (OWASP Top 10), Security Groups, NACLs, VPC isolation
Layer 2: Edge — CloudFront geo-blocking, DDoS protection (AWS Shield Standard)
Layer 3: Gateway — Kong rate limiting, JWT validation, mTLS for service-to-service
Layer 4: Application — RBAC enforcement, input validation (Zod), parameterized queries
Layer 5: Database — Row-level security (PostgreSQL RLS), encryption at rest (AES-256)
Layer 6: Data — Column-level encryption for PII (bcrypt for passwords, AES for tokens)
Layer 7: Audit — Immutable audit log in PostgreSQL (append-only, no DELETE privilege)
```

### 9.2 Data Classification and Handling

| Classification | Examples | Controls |
|----------------|----------|---------|
| **Restricted** | OAuth tokens, API keys, JWT private keys | AWS Secrets Manager; never logged; rotated every 30 days |
| **Confidential** | Transaction amounts, vendor names, user email | Encrypted at rest and in transit; RBAC-gated; org-scoped |
| **Internal** | Aggregated KPIs, anonymized benchmarks | RBAC-gated; no PII |
| **Public** | Marketing pages, docs | No controls required |

### 9.3 Compliance Posture

| Standard | Target | Notes |
|----------|--------|-------|
| SOC 2 Type II | Year 1 target | Engage audit firm by month 6 |
| GDPR | Launch requirement | Data residency option (EU region); right-to-erasure workflow |
| CCPA | Launch requirement | Data deletion endpoint in API |
| PCI DSS | Not applicable | Platform does not store or process card PANs |

### 9.4 Secret Rotation

- Database passwords: rotated every 90 days via AWS Secrets Manager auto-rotation
- JWT key pairs: rotated every 30 days with 7-day overlap window
- Integration OAuth tokens: stored encrypted; refreshed before expiry automatically
- API keys (customer-issued): SHA-256 hash stored (never plaintext); customer can rotate self-service

---

## 10. Scalability and Reliability

### 10.1 Performance Targets

| Metric | Target | Mechanism |
|--------|--------|-----------|
| Dashboard load (P95) | < 1.5s | Redis KPI cache, ClickHouse materialized views, CloudFront |
| Report generation (P95) | < 3s (up to 1M rows) | ClickHouse columnar engine, async processing |
| API response (P95) | < 200ms | Redis cache, connection pooling, CDN edge |
| Transaction ingestion lag | < 5s (webhook) / < 15 min (poll) | Kafka streaming, webhook-first design |
| ERP sync success rate | > 99.5% | Temporal retry semantics, dead-letter queue |
| Anomaly detection latency | < 30s from transaction ingestion | Kafka streaming + ML Service inline processing |

### 10.2 Multi-Tenancy Isolation

- Each tenant (org) is isolated at: DB row level (PostgreSQL RLS), ClickHouse partition level, Redis key namespace, S3 prefix, Kafka partition
- No shared compute state between tenants in application layer
- Enterprise customers can request dedicated ClickHouse cluster and dedicated DB schema

### 10.3 Failure Modes and Recovery

| Failure | Impact | Recovery |
|---------|--------|---------|
| ClickHouse unavailable | Dashboard OLAP queries fail | Serve cached Redis data; display data-freshness banner |
| Kafka broker loss | Transaction ingestion delayed | MSK Multi-AZ; auto-recovers; Data Pipeline retries with cursor |
| ML Service unavailable | Transactions land without categorization | Transactions stored in ClickHouse uncategorized; ML Service backtracks on recovery |
| ERP Sync failure | ERP out of sync | Temporal retries; alert after 3 failures; manual re-trigger UI |
| Claude API unavailable | Categorization falls back | Rule-based fallback categorizer (vendor name → category lookup table) |
| PostgreSQL writer failover | Write operations fail briefly | Aurora Multi-AZ failover < 30s; API returns 503 with Retry-After header |

### 10.4 Data Retention Policy

| Data | Retention | Storage |
|------|-----------|---------|
| Raw transaction payloads (S3) | 7 years (audit/compliance) | S3 Glacier Deep Archive after 90 days |
| Normalized transactions (ClickHouse) | 3 years hot | ClickHouse tiered storage (SSD → S3) |
| Audit log (PostgreSQL) | 7 years | Append-only; archived to S3 after 1 year |
| Session data (Redis) | 24 hours | Redis TTL |
| Report exports (S3) | 90 days | S3 standard; auto-delete via lifecycle policy |
| ML model artifacts (S3) | Indefinite | Versioned; retained for reproducibility |

---

*Architecture Owner: Systems & Infrastructure Engineering*
*Next Review: April 11, 2026*
*Related Documents: PRD.md, ADR/ (Architecture Decision Records), Runbook/, infra/*
