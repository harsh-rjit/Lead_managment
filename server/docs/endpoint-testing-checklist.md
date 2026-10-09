# V1 Backend API Endpoint Testing Checklist

A structured verification checklist for developers and QA engineers to test business behaviors across all backend services in the V1 release.

---

## 1. Authentication & Session Security (`/api/v1/auth`)

| # | Endpoint | Method | Required Auth | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 1.1 | `/api/v1/auth/register` | `POST` | Public | `201 Created` | Creates new organization and admin user. Returns sanitized user (no `passwordHash`) and org details with slug. |
| 1.2 | `/api/v1/auth/register` | `POST` | Public | `409 Conflict` | Attempting to register with an existing email is rejected. |
| 1.3 | `/api/v1/auth/register` | `POST` | Public | `400 Bad Request` | Password lacking letters/numbers, or short names are rejected by Zod. |
| 1.4 | `/api/v1/auth/login` | `POST` | Public | `200 OK` | Valid credentials return a signed JWT token and user profile. |
| 1.5 | `/api/v1/auth/login` | `POST` | Public | `401 Unauthorized` | Invalid password or non-existent email returns generic 401 error. |
| 1.6 | `/api/v1/auth/login` | `POST` | Public | `403 Forbidden` | Inactive/suspended user accounts are blocked from logging in. |
| 1.7 | `/api/v1/auth/me` | `GET` | Bearer Token | `200 OK` | Returns authenticated user info and associated organization context. |
| 1.8 | `/api/v1/auth/me` | `GET` | None | `401 Unauthorized` | Missing token returns 401. |
| 1.9 | `/api/v1/auth/me` | `GET` | Malformed Token | `401 Unauthorized` | Tampered token signature returns 401. |

---

## 2. Organization User Management (`/api/v1/users`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 2.1 | `/api/v1/users` | `GET` | `admin` | `200 OK` | Lists all team members in the authenticated admin's organization. |
| 2.2 | `/api/v1/users` | `GET` | `sales` / `manager` | `403 Forbidden` | Non-admin users cannot access organization team directory. |
| 2.3 | `/api/v1/users` | `POST` | `admin` | `201 Created` | Admin can invite/add new users with roles (`admin`, `manager`, `sales`). |
| 2.4 | `/api/v1/users/:id/role` | `PATCH` | `admin` | `200 OK` | Admin updates role of a user in their organization. |
| 2.5 | `/api/v1/users/:id/status` | `PATCH` | `admin` | `200 OK` | Admin activates or suspends an account (`active` / `inactive`). |
| 2.6 | `/api/v1/users/:id/status` | `PATCH` | `admin` | `404 Not Found` | Admin cannot update status of a user belonging to another organization. |

---

## 3. Lead Management & Audit History (`/api/v1/leads`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 3.1 | `/api/v1/leads` | `POST` | Any Authenticated | `201 Created` | Creates lead bound to `organizationId`. Generates audit activity (`lead_created`). Initial status is `new`. |
| 3.2 | `/api/v1/leads` | `GET` | `admin` / `manager` | `200 OK` | Lists leads with pagination (`page`, `limit`), filter (`status`, `priority`), and search. |
| 3.3 | `/api/v1/leads` | `GET` | `sales` | `200 OK` | Sales users are strictly scoped to only leads assigned to them. |
| 3.4 | `/api/v1/leads/:id` | `GET` | Any Authenticated | `200 OK` | Retrieves lead details with populated assignee info. |
| 3.5 | `/api/v1/leads/:id` | `GET` | Any Authenticated | `404 Not Found` | Requesting a lead belonging to another tenant returns 404 (Isolation). |
| 3.6 | `/api/v1/leads/:id` | `PUT` / `PATCH` | Any Authenticated | `200 OK` | Updates lead details. Status change automatically logs `status_changed` audit activity. |
| 3.7 | `/api/v1/leads/:id` | `DELETE` | `admin` / `manager` | `200 OK` | Deletes lead and its audit logs from database. |
| 3.8 | `/api/v1/leads/:id` | `DELETE` | `sales` | `403 Forbidden` | Sales reps cannot delete leads. |
| 3.9 | `/api/v1/leads/:id/activities` | `GET` | Any Authenticated | `200 OK` | Returns chronological timeline of actions performed on the lead. |

---

## 4. Bulk CSV Lead Import (`/api/v1/leads/import/csv`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 4.1 | `/api/v1/leads/import/csv` | `POST` | Any Authenticated | `200 OK` | Uploads multipart CSV file (`file`). All valid rows imported with `source: 'csv'`. |
| 4.2 | `/api/v1/leads/import/csv` | `POST` | Any Authenticated | `200 OK` (Partial) | Uploads mixed CSV. Valid rows are saved; invalid rows are flagged with line numbers and field errors. |
| 4.3 | `/api/v1/leads/import/csv` | `POST` | Any Authenticated | `400 Bad Request` | Uploading non-CSV files (`.pdf`, `.png`) is rejected. |
| 4.4 | `/api/v1/leads/import/csv` | `POST` | Any Authenticated | `400 Bad Request` | Request without a file payload is rejected with clear error message. |

---

## 5. AI Intelligence Endpoints (`/api/v1/ai`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 5.1 | `/api/v1/ai/analyze/:leadId` | `POST` | Any Authenticated | `200 OK` | Invokes Gemini model. Returns score (0-100), priority (`LOW`/`MEDIUM`/`HIGH`), summary, reasons, and next action. |
| 5.2 | `/api/v1/ai/analyze/:leadId` | `POST` | Any Authenticated | Automation Effect | If AI score >= 80, lead priority is automatically upgraded to `HIGH`. |
| 5.3 | `/api/v1/ai/analyze/:leadId` | `POST` | Cross-Tenant | `404 Not Found` | Cannot analyze a lead belonging to another organization. |
| 5.4 | `/api/v1/ai/lead/:leadId` | `GET` | Any Authenticated | `200 OK` | Retrieves latest persisted AI analysis for the lead. |
| 5.5 | `/api/v1/ai/follow-up/:leadId` | `POST` | Any Authenticated | `200 OK` | Generates personalized follow-up message with selected type (`email`/`short_message`) and tone (`professional`/`friendly`). |
| 5.6 | `/api/v1/ai/follow-up/:leadId` | `POST` | Any Authenticated | `400 Bad Request` | Invalid `type` or `tone` values rejected by Zod validation. |

---

## 6. Analytics Overview (`/api/v1/analytics`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 6.1 | `/api/v1/analytics/overview` | `GET` | Any Authenticated | `200 OK` | Calculates tenant `totalLeads`, `qualifiedLeads`, `wonLeads`, `lostLeads`, `conversionRate`, `closedWinRate`. |
| 6.2 | `/api/v1/analytics/overview` | `GET` | Any Authenticated | `200 OK` | Verifies distribution dictionaries (`leadsByStatus`, `leadsBySource`) and continuous 30-day timeline. |
| 6.3 | `/api/v1/analytics/overview` | `GET` | Multi-Tenant | Strict Partitioning | Leads in Organization B never contribute to Organization A's metrics or conversion calculations. |

---

## 7. Automation Engine (`/api/v1/automations`)

| # | Endpoint | Method | Required Role | Expected Status | Business Verification Criteria |
|---|---|---|---|---|---|
| 7.1 | `/api/v1/automations/rules` | `GET` | Any Authenticated | `200 OK` | Returns active automation rules for the organization. |
| 7.2 | `/api/v1/automations/evaluate-stale` | `POST` | Any Authenticated | `200 OK` | Scans for leads in status `new` with no activity for >24h and generates reminder tasks. |
