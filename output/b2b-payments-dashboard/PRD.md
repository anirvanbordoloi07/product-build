# Product Requirements Document
## B2B Payments Analytics Dashboard

**Version:** 1.0
**Date:** March 28, 2026
**Author:** Senior Product Manager
**Status:** Draft — Ready for Review

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Core Platform](#3-core-platform)
4. [Feature List](#4-feature-list)
5. [Tech Recommendations](#5-tech-recommendations)
6. [Success Metrics](#6-success-metrics)
7. [Out of Scope](#7-out-of-scope)

---

## 1. Problem Statement

### Market Context

The B2B payments market is projected to grow from $1.42 trillion in 2025 to $3.43 trillion by 2031 (15.48% CAGR). Despite this scale, the analytics layer of B2B payments remains deeply underdeveloped. Most enterprise finance teams — whether using Ramp, Brex, JP Morgan Access, or American Express corporate tools — operate with dashboards designed for documentation and compliance, not decision-making.

The fundamental gap: existing platforms answer **"what happened?"** — not **"what's about to happen, and what should we do about it?"**

### Core Pain Points (Evidence-Backed)

**1. Reactive, Backward-Looking Analytics**
Traditional B2B payment analytics are limited to basic reporting on overdue invoices and historical spend, leaving finance teams with significant blind spots. Finance teams spend the last days of every quarter scrambling to estimate accruals because their tools cannot forecast what's coming. This leads to inaccurate financial statements and restated figures.

**2. Data Silos and "Multiple Versions of Truth"**
Finance teams managing multi-entity organizations face compounding complexity: each legal entity, payment provider, and payment method introduces additional reconciliation layers. Month-end close cycles extend as teams manually align data across disconnected systems (ERP + corporate card + AP platform + bank feeds). Highly skilled finance professionals spend most of their time on operational tasks rather than analysis. (Source: CB Insights, Spendesk, ERP Software Blog, 2025-2026)

**3. Insufficient Custom Reporting**
Across the major spend management platforms:
- **Ramp**: Users want greater flexibility and custom fields; enterprise features like period-close are missing.
- **Pleo**: Reporting nuance and dashboard/report-building "does not scream high sophistication."
- **Brex**: Requires manual data pushes to accounting software; no automatic background sync.
- **Navan**: Analytics dashboards are described as "flashy" but lacking depth — users want period-over-period breakdowns and more canned reports.
(Source: CB Insights Product Gaps Report; Capterra/G2 reviews 2025-2026)

**4. No Unified Payables, Cards, and Reimbursements View**
Customers across platforms consistently request consolidation of payables (AP), corporate credit cards, and out-of-pocket reimbursements into a single interface with unified approvals and analytics. Today this requires juggling 3+ platforms. (Source: CB Insights)

**5. Fraud Detection Is Still Reactive**
As real-time settlement replaces ACH timelines, traditional fraud models — built for 2-3 day settlement windows — fail. Behavioral anomaly detection operating within milliseconds is table stakes for 2026, yet most mid-market platforms lack it. (Source: Coinflow, AGMS, WebPRONews, 2026)

**6. Limited AI/Predictive Capability Despite Executive Demand**
68% of finance leaders cite data quality as the #1 barrier to effective predictive analytics (Gartner 2024 CFO Agenda Survey). Only 34% of enterprises have automated reconciliation and reporting (Amex Trendex 2025). 86% of CFOs have yet to achieve significant value from their AI investments. The gap between executive demand and delivered product is vast.

**7. Poor ERP Integration**
Only 47% of enterprises utilize API-driven payment solutions. Integrations that exist are often brittle, unidirectional, or require manual intervention to sync. Ramp's QuickBooks integration, for instance, functions as a ledger rather than a true credit card integration — a commonly cited complaint.

### Opportunity

A purpose-built analytics dashboard that sits on top of B2B payment data — unifying spend, payables, card transactions, and reimbursements — with real-time visibility, AI-driven forecasting, anomaly detection, and flexible reporting is the missing layer in the market. This is the product we are building.

---

## 2. Target Users

### Primary Persona: The Strategic CFO / VP of Finance

**Profile:** CFO or VP Finance at a mid-market to enterprise B2B company (100–5,000 employees). Reports to CEO/Board. Manages a team of 3–15 finance professionals.

**Goals:**
- Real-time visibility into total company spend across all entities and payment types
- Accurate cash flow forecasting to present to board and lenders
- Reduce month-end close from 10 days to under 5
- Identify cost savings and vendor consolidation opportunities
- Ensure policy compliance and fraud prevention without slowing operations

**Frustrations:**
- Can't get a single number for "how much did we spend last month" across all systems
- Forecasting relies on Excel because existing tools don't model forward
- Dashboards from card providers are beautiful but surface-level
- Closed periods and period-locks are missing from most modern tools
- Has to wait for the accounting team to produce a report instead of self-serving

**Quote archetype:** *"Our Ramp dashboard is great for seeing last month, but I need to know next month."*

---

### Secondary Persona: The Finance Manager / Controller

**Profile:** Controller, Senior Finance Manager, or Accounting Manager. Day-to-day operator of the finance stack. Manages reconciliation, close, and reporting workflows.

**Goals:**
- Reduce manual reconciliation effort
- Automate matching of transactions across payment systems and ERP
- Catch policy violations and duplicate payments before they close
- Generate board and department reports without engineering help

**Frustrations:**
- Spends 40%+ of close week on manual data export/import across systems
- Custom reports require data exports to Excel; no self-serve BI
- Multi-entity environments require consolidating multiple accounts manually
- No audit trail visibility for payment approval workflows

---

### Tertiary Persona: The Department Budget Owner

**Profile:** Head of Engineering, Marketing, Sales Ops, or any cost-center owner with a budget. Not a finance professional — occasional user of spend tools.

**Goals:**
- Know how much of their budget remains at any point in the month
- Quickly approve or flag expenses from their team
- Avoid going over budget without knowing it

**Frustrations:**
- Budget vs. actuals visibility requires asking finance for a report
- Notifications arrive too late (after overspend, not before)
- No mobile-friendly view of team spend

---

## 3. Core Platform

### Platform Type: Web-Based SaaS Dashboard with API-First Architecture

**Deployment Model:** Cloud-hosted SaaS, multi-tenant with enterprise single-tenant option.

**Access Model:**
- Web application (primary interface — desktop-first, mobile-responsive)
- Native mobile app (iOS/Android) for approvals, alerts, and budget status
- REST + Webhook API for custom integrations and data export
- Embeddable widget SDK for partners who want to white-label the analytics layer

**Integration Architecture:**
The platform is positioned as an **analytics and intelligence layer**, not a payments processor. It ingests data from:
- Corporate card platforms (Ramp, Brex, Amex, Navan) via API/OAuth
- AP/Payment platforms (Bill.com, Tipalti, Coupa, Airbase)
- Banks and financial institutions (Plaid, direct bank APIs, JPMorgan Access)
- ERPs (NetSuite, QuickBooks, SAP, Workday Financials) via bidirectional sync
- Expense tools (Expensify, Concur, Rippling)

**Business Model:** B2B SaaS subscription
- Starter: $599/month (up to 50 users, 3 integrations)
- Growth: $1,499/month (up to 250 users, unlimited integrations)
- Enterprise: Custom pricing (multi-entity, SSO, dedicated support, SLA)

---

## 4. Feature List

Features are prioritized as:
- **P0** — Must-have for v1 launch. Product does not ship without these.
- **P1** — High priority. Targeted for launch or first post-launch sprint.
- **P2** — Important but deferrable. Roadmap items.

---

### P0 — Core (v1 Launch Requirements)

---

#### F-01: Unified Spend Overview Dashboard
**Priority:** P0
**User Story:** As a CFO, I want a single dashboard showing total company spend across all connected payment systems (cards, AP, reimbursements) so that I always have one authoritative number without pulling from multiple tools.

**Acceptance Criteria:**
- Aggregates spend from all connected sources in real time
- Filterable by: entity, department, cost center, vendor, payment method, date range
- Summary KPIs: Total Spend, Total Transactions, Top Vendors, Top Spend Categories
- Visual breakdown: bar chart (spend over time), pie chart (by category), ranked table (by vendor)
- Exportable to CSV and PDF

---

#### F-02: Budget vs. Actuals Tracking
**Priority:** P0
**User Story:** As a Finance Manager, I want to compare actual spend against approved budgets at the department and cost-center level in real time so I can catch overruns before month-end.

**Acceptance Criteria:**
- Budget can be set manually per cost center or imported from ERP
- Visual traffic-light indicator: green (<80% used), yellow (80–95%), red (>95%)
- Drill-down from department level to individual transaction
- Alert triggers when spend crosses 80% and 100% of budget
- Period support: monthly, quarterly, annual

---

#### F-03: ERP Bidirectional Sync
**Priority:** P0
**User Story:** As a Controller, I want payment data to sync automatically with our ERP (NetSuite/QuickBooks/SAP) so I never have to manually export or import data during month-end close.

**Acceptance Criteria:**
- Bidirectional sync: transactions flow from payment sources into ERP; budget data flows from ERP into the dashboard
- Sync frequency: real-time for card transactions, batch (15 min) for AP
- Field mapping UI allows controller to map vendor/GL codes to ERP chart of accounts
- Sync error log with alerting on failures
- Supports: NetSuite, QuickBooks Online, QuickBooks Desktop, SAP, Workday, Xero (v1)

---

#### F-04: Multi-Source Transaction Feed with Smart Categorization
**Priority:** P0
**User Story:** As a Finance Manager, I want all transactions from cards, AP, and reimbursements in one searchable feed with auto-categorized GL codes so I can stop manually categorizing spend at month-end.

**Acceptance Criteria:**
- Ingests data from at minimum 3 card providers, 2 AP platforms, and 1 bank feed
- ML-based auto-categorization with >90% accuracy on vendor name → GL code mapping
- User can override and the model learns from corrections
- Duplicate detection flagging
- Full-text search and filter across all transactions
- Bulk-edit category assignments

---

#### F-05: Custom Report Builder
**Priority:** P0
**User Story:** As a CFO, I want to build custom reports — like hotel spend by city by quarter or SaaS vendor spend YoY — without needing engineering help or exporting to Excel.

**Acceptance Criteria:**
- Drag-and-drop report builder with: dimensions (vendor, department, category, employee, entity), metrics (spend, transaction count, average amount), date groupings (day, week, month, quarter, year)
- Saved reports with scheduled email delivery (daily, weekly, monthly)
- Period-over-period comparison (MoM, QoQ, YoY)
- Export to PDF, CSV, Google Sheets, Excel
- Shareable report links with role-based access

---

#### F-06: Role-Based Access Control (RBAC)
**Priority:** P0
**User Story:** As a CFO, I want to control who sees which data — by entity, department, or spend type — so that budget owners see only their cost center and finance sees everything.

**Acceptance Criteria:**
- Predefined roles: Admin, Finance Manager, Department Owner, Viewer, Auditor
- Custom roles with granular permission sets (entity, department, feature)
- SSO support: SAML 2.0 and OAuth 2.0 (Google Workspace, Microsoft Entra ID)
- Audit log of all permission changes
- Guest/read-only link sharing for board members

---

#### F-07: Anomaly Detection and Spend Alerts
**Priority:** P0
**User Story:** As a Finance Manager, I want to be automatically alerted when a transaction looks unusual — like a duplicate payment, an amount that's 3x higher than normal with a vendor, or a new wire recipient — so I can catch fraud and errors before they escalate.

**Acceptance Criteria:**
- ML model flags: duplicate transactions, unusual amounts (vs. vendor baseline), off-hours high-value transactions, new vendor with large first payment, policy violations (e.g., spend outside approved category)
- Configurable alert thresholds per rule type
- Alerts delivered via: in-app, email, Slack webhook
- Alert review queue with approve/dismiss/escalate workflow
- False positive feedback loop improves model over time

---

### P1 — High Priority (Target: Launch + Sprint 1)

---

#### F-08: Cash Flow Forecasting
**Priority:** P1
**User Story:** As a CFO, I want a 30/60/90-day cash flow forecast based on historical spend patterns, recurring payment schedules, and outstanding payables so I can proactively manage liquidity without building it in Excel.

**Acceptance Criteria:**
- AI-generated forecast using: historical transaction data, recurring vendor payment cadence, outstanding AP aging, seasonal adjustment factors
- Confidence band visualization (point estimate + range)
- Scenario modeling: "what if we delay $X in vendor payments by 30 days?"
- Exportable forecast as CSV or PDF for board/lender presentations
- Variance tracking: forecast vs. actual, with auto-commentary on drivers

---

#### F-09: Vendor Analytics and Consolidation Insights
**Priority:** P1
**User Story:** As a CFO, I want to see all spending with each vendor across all payment methods — card, ACH, wire, check — in one place, so I can identify consolidation opportunities and negotiate better terms.

**Acceptance Criteria:**
- Vendor profile page: total spend, transaction history, payment method mix, trend over 12 months
- "Duplicate vendor" detection (same vendor, different names/payment accounts)
- Spend concentration analysis: what % of spend is with top 10 vendors?
- Category benchmark: how does our SaaS spend compare to peers? (anonymized benchmarks)
- Contract date tracking and renewal alert integration (manual entry or CSV import in v1)

---

#### F-10: Approval Workflow Engine
**Priority:** P1
**User Story:** As a Finance Manager, I want to configure multi-step approval workflows for payments above certain thresholds so that large or unusual transactions require explicit sign-off before processing.

**Acceptance Criteria:**
- Configurable approval chains by: amount, vendor, category, cost center, payment method
- Supports sequential and parallel approvers
- Mobile-friendly approval actions (approve/reject with comment)
- Escalation rules: auto-escalate if not acted on within X hours
- Full audit trail per transaction

---

#### F-11: Multi-Entity Consolidated View
**Priority:** P1
**User Story:** As a CFO of a multi-entity company, I want to see spend consolidated across all legal entities — with the ability to drill into any single entity — so I don't have to log into 4 different dashboards.

**Acceptance Criteria:**
- Entity hierarchy definition (parent company + subsidiaries)
- Consolidated P&L-style spend view across all entities
- Intercompany transaction identification and exclusion from consolidated totals
- Per-entity segmentation for local reporting
- Currency normalization: all foreign transactions displayed in reporting currency with FX rate shown

---

#### F-12: Integrations Marketplace
**Priority:** P1
**User Story:** As a Finance Manager, I want to connect our dashboard to the tools we already use — Ramp, Brex, Bill.com, NetSuite, Slack — from a central integrations page without needing IT support.

**Acceptance Criteria:**
- Self-service OAuth-based connection for all supported integrations
- Integration health monitoring: last sync time, error count, data freshness
- At least 10 integrations at launch (see Tech section for list)
- Webhook support for real-time event forwarding to custom systems
- API key management for developer-built integrations

---

#### F-13: Mobile App (iOS and Android)
**Priority:** P1
**User Story:** As a Department Budget Owner, I want a mobile app where I can approve expenses, check my team's remaining budget, and get alerted when something is unusual — without having to open a laptop.

**Acceptance Criteria:**
- Transaction approval/rejection with comment
- Budget status widget (% remaining per cost center)
- Push notifications for: approvals needed, budget threshold alerts, anomaly flags
- Receipt capture and upload (for reimbursement workflows)
- Read-only dashboard with key KPIs

---

### P2 — Roadmap (Post-Launch)

---

#### F-14: AI-Powered Narrative Reporting
**Priority:** P2
**User Story:** As a CFO, I want the system to auto-generate a plain-English summary of last month's spend performance — including key variances, anomalies, and trends — that I can paste into my board deck.

**Acceptance Criteria:**
- Monthly "Finance Digest" generated on the 1st of each month
- Covers: top spend drivers, MoM/QoQ variances, anomalies caught, budget over/under by department
- Editable in-browser before exporting to PDF
- Branded with company logo and colors

---

#### F-15: Payment Reconciliation Automation
**Priority:** P2
**User Story:** As a Controller, I want the system to automatically match bank statement transactions to ledger entries so that reconciliation is 90% automated and I only need to review exceptions.

**Acceptance Criteria:**
- Auto-match bank transactions to payment records using: amount, date, vendor name fuzzy match
- Exception queue for unmatched items
- Match confidence score (auto-confirm above 95%, queue below)
- Integration with bank feeds via Plaid or direct bank API

---

#### F-16: Supplier Payment Terms Analytics
**Priority:** P2
**User Story:** As a CFO, I want to see how our payment timing compares to agreed terms — which vendors we're paying early, on time, or late — so I can optimize Days Payable Outstanding and earn early-pay discounts where beneficial.

**Acceptance Criteria:**
- DPO (Days Payable Outstanding) tracking per vendor and in aggregate
- Early-pay discount opportunity identification
- Comparison of agreed terms vs. actual payment dates
- "What-if" simulator: extend payment 15 days → impact on working capital

---

#### F-17: Benchmark Comparisons (Anonymous Peer Data)
**Priority:** P2
**User Story:** As a CFO, I want to see how our spend in categories like SaaS, travel, and benefits compares to peer companies of similar size and industry so I can prioritize where to cut.

**Acceptance Criteria:**
- Anonymized peer benchmarks for major spend categories
- Filter by: company size (headcount), industry, geography
- Displayed as: "Your spend vs. peer median vs. top quartile"
- Data derived from aggregate, anonymized customer base (opt-in)

---

#### F-18: White-Label / Embedded Analytics SDK
**Priority:** P2
**User Story:** As a B2B payments platform (e.g., a card issuer or AP provider) partner, I want to embed these analytics into my own product under my own branding so my customers get rich analytics without us building it ourselves.

**Acceptance Criteria:**
- Embeddable React component library
- Theming API (colors, fonts, logo)
- Scoped API keys limiting data access per embedded session
- Revenue share model for partners

---

## 5. Tech Recommendations

### Frontend

| Layer | Recommendation | Rationale |
|---|---|---|
| Framework | **React 19** with TypeScript | Industry standard for complex dashboards; large talent pool; excellent ecosystem |
| State Management | **Zustand** + React Query (TanStack Query) | Lightweight global state + server state caching; avoids Redux boilerplate |
| UI Component Library | **Radix UI** + **shadcn/ui** | Accessible, unstyled primitives with rapid customization for finance-grade UI |
| Charting | **Recharts** + **D3.js** for custom visualizations | Recharts for standard charts; D3 for custom financial visualizations |
| Table/Grid | **TanStack Table** | Best-in-class for large dataset tables with sorting, filtering, virtualization |
| Report Builder | **React Grid Layout** | Drag-and-drop dashboard composition |
| Mobile | **React Native** (shared logic with web) | Code sharing with web layer; strong iOS/Android parity |

### Backend

| Layer | Recommendation | Rationale |
|---|---|---|
| Primary API | **Node.js** (TypeScript) with **Fastify** | High-throughput, low-latency API layer; TypeScript consistency with frontend |
| Data Pipeline / ETL | **Python** (FastAPI + Celery) | Best ML/data ecosystem; handles ingestion, transformation, and ML inference |
| Real-Time Events | **Apache Kafka** | High-volume transaction streaming; fanout to anomaly detection, alerts, sync |
| Background Jobs | **Temporal** | Durable workflow orchestration for ETL, ERP sync, report generation |
| API Gateway | **Kong** or **AWS API Gateway** | Rate limiting, auth, routing across services |

### Database

| Purpose | Technology | Rationale |
|---|---|---|
| Transactional data (OLTP) | **PostgreSQL** (AWS RDS Aurora) | ACID compliance, JSON support, mature; multi-tenant with row-level security |
| Analytics / OLAP queries | **ClickHouse** | Columnar storage; 100x faster than Postgres for aggregation queries over large transaction datasets |
| Time-series (forecasts, metrics) | **TimescaleDB** (PostgreSQL extension) | Native time-series queries on familiar Postgres stack |
| Caching | **Redis** | Dashboard KPI caching, session management, rate limiting |
| Search | **Elasticsearch** | Full-text search across transaction descriptions, vendor names |
| File Storage | **AWS S3** | PDFs, exports, receipt images |

### Infrastructure

| Layer | Recommendation | Rationale |
|---|---|---|
| Cloud | **AWS** (primary) | Broadest service coverage; FedRAMP options for regulated customers |
| Containers | **Kubernetes** (EKS) | Container orchestration for microservices |
| CI/CD | **GitHub Actions** + **ArgoCD** | Modern GitOps deployment pipeline |
| Monitoring | **Datadog** | APM, infrastructure monitoring, log management |
| Error Tracking | **Sentry** | Real-time error monitoring with source maps |
| Feature Flags | **LaunchDarkly** | Safe progressive rollout; A/B testing for UX experiments |
| Security | **AWS WAF** + **SOC 2 Type II** compliance from day one | Finance data demands it |

### ML/AI Stack

| Purpose | Technology |
|---|---|
| Anomaly detection | **Python** + **scikit-learn** / **PyOD** (isolation forest, DBSCAN) |
| Cash flow forecasting | **Prophet** (Meta) + custom LSTM models for high-volume accounts |
| Auto-categorization | **Fine-tuned LLM** (GPT-4o or Claude via API) for vendor → GL mapping |
| Narrative generation | **Claude API** (Anthropic) for monthly spend digest generation |
| Feature store | **Feast** (open source) |

### Key Integrations (v1 Launch Target)

**Card/Spend Platforms:** Ramp, Brex, American Express (via Amex API), Navan
**AP/Payments:** Bill.com, Tipalti, Coupa
**Banking:** Plaid (bank feeds), JPMorgan Access API
**ERPs:** NetSuite, QuickBooks Online, Xero, SAP (via middleware)
**Communication:** Slack, Microsoft Teams (for alerts)
**SSO:** Google Workspace, Microsoft Entra ID (Azure AD)

---

## 6. Success Metrics

### North Star Metric
**Weekly Active Finance Users (WAFU):** The number of finance team members (CFOs, controllers, finance managers) who open and interact with the dashboard at least once per week. Target: >80% of licensed seats are WAFUs within 90 days of onboarding.

*Rationale:* If the dashboard becomes the place finance teams start their day, everything else follows. Low WAFU signals the product isn't sticky enough to replace existing workflows.

---

### Product Health Metrics

| Metric | Target (6 months post-launch) | Notes |
|---|---|---|
| Time to First Insight | <10 minutes from account creation | Measures onboarding / integration speed |
| Dashboard Load Time | <1.5 seconds (P95) | Finance tools must be fast; slow = Excel |
| Report Generation Time | <3 seconds for custom reports up to 1M rows | ClickHouse OLAP target |
| ERP Sync Success Rate | >99.5% | Critical to trust; failures break month-end close |
| Anomaly Detection Precision | >85% (low false positive rate) | High false positives → users ignore alerts → no value |
| Auto-Categorization Accuracy | >90% after 30 days of usage | Improves with feedback loop |

---

### Business Metrics

| Metric | Target |
|---|---|
| ARR at 12 months | $3M+ |
| Net Revenue Retention (NRR) | >120% (upsell from Starter → Growth → Enterprise) |
| Gross Logo Retention | >90% annually |
| Customer Acquisition Cost (CAC) Payback | <12 months |
| Integration Connections per Customer | >3 (indicates sticky multi-system usage) |
| Time to Close (Month-End) | Reduce customer's close cycle by ≥30% (measured via customer survey at 6 months) |

---

### User Satisfaction Metrics

| Metric | Target |
|---|---|
| Net Promoter Score (NPS) | >50 at 6 months |
| CSAT (post-onboarding survey) | >4.5/5 |
| Support Ticket Rate | <5% of MAU per month (self-serve should resolve most issues) |
| Feature Adoption: Budget vs. Actuals | >70% of customers using within 30 days of activation |
| Feature Adoption: Custom Reports | >50% of customers creating ≥1 saved report within 60 days |

---

## 7. Out of Scope (v1)

The following are explicitly excluded from the v1 product. Inclusion would dilute focus, delay launch, or require regulatory overhead beyond our current capability.

| Item | Reason for Exclusion |
|---|---|
| **Payment Processing / Money Movement** | We are an analytics layer, not a payments processor. Acquiring a money transmitter license adds 12–18 months and significant compliance overhead. We connect to processors; we do not replace them. |
| **Accounts Receivable (AR) / Collections** | v1 focuses on the payables and spend side. AR analytics (DSO, aging, collections workflows) is a v2 expansion with a distinct buyer persona (AR teams vs. AP/CFO). |
| **Procurement / Purchase Order Management** | PO management (Coupa, Zip, Procurify) is an adjacent but distinct category. We ingest procurement data for spend analytics but do not build a sourcing or PO workflow engine. |
| **Corporate Card Issuance** | Issuing virtual or physical corporate cards requires partnership with a card issuer and BIN sponsorship. Out of scope for v1. |
| **Tax Filing or Compliance Automation** | Tax computation, 1099 generation, and tax filing involve regulatory complexity and liability. We surface data needed for tax, but do not file or advise. |
| **International Multi-Currency AP Payments** | Cross-border payment execution is a distinct product with FX, regulatory, and compliance requirements per jurisdiction. FX normalization for reporting is in scope; execution is not. |
| **ERP Full Replacement** | We are a dashboard layer on top of ERPs, not a replacement. General ledger, invoicing, payroll, and order management remain in the ERP. |
| **Consumer or SMB (<10 employees) Tier** | The product is designed for mid-market (100+ employees). Supporting a self-serve SMB tier would require a fundamentally different UX and support model. |
| **Anonymous Peer Benchmarks (v1)** | Requires sufficient customer base data to make benchmarks statistically meaningful. Targeted for v2 once 50+ customers are onboarded. |
| **White-Label Embedded SDK** | Requires mature API, stable data model, and partner program infrastructure. Targeted for v2. |
| **AI Narrative Report Generation** | While the ML infrastructure supports it, the narrative generation feature requires LLM prompt engineering, editorial review workflows, and customer trust-building. Targeted for v2. |

---

## Appendix: Competitive Landscape Summary

| Platform | Strengths | Key Weaknesses (v1 Opportunity) |
|---|---|---|
| **Ramp** | Strong UX, real-time dashboards, AI savings recommendations | No period-close, limited enterprise features, mobile app needs work, custom report flexibility |
| **Brex** | Global card support, strong integrations | Manual data sync to accounting, limited multi-entity support |
| **Navan** | Best-in-class travel + expense | Analytics are "flashy but shallow," AI chatbot support frustrates users |
| **Bill.com** | Dominant in SMB AP automation | Weak analytics layer, limited card integration |
| **Tipalti** | Strong enterprise AP, global payments | Limited self-serve analytics, complex UX |
| **Coupa** | Full procurement suite | Expensive, complex, slow to implement — overkill for mid-market |
| **JP Morgan Access** | Treasury management leader, #1 in digital channels | Bank-grade but rigid; no flexible custom reporting; not accessible to sub-enterprise |
| **Amex Spend IQ** | Unique closed-loop data, powerful benchmarks | Amex-card-only; walled garden; no multi-source aggregation |

**Our differentiation:** Multi-source aggregation (not locked to one card issuer or AP tool), flexible self-serve reporting, AI-powered anomaly detection and forecasting, and a UI designed for finance teams — not accountants filling out expense reports.

---

*Document Owner: Product Management*
*Next Review: April 11, 2026*
*Related Documents: Competitive Analysis, Technical Architecture Diagram, Go-to-Market Plan*
