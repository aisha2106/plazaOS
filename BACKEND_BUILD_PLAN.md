# Plaza OS — Backend Build Plan

**Sources:** [PRODUCT.md](PRODUCT.md), [README.md](README.md), [AUDIT.md](AUDIT.md), and the actual frontend contract already encoded in `src/lib/services/*.ts`, `src/routes/admin/**/data.ts`, and the `// TODO: ... once the backend is reachable` comments scattered through `src/routes/admin`.
**Scope:** A new, separate backend project — Next.js (API routes only, no pages) + MongoDB, run as a persistent Node server. This repo (`plaza-os-frontend`) stays frontend-only; this document plans the backend so it can be built in its own repo/folder and wired in by swapping mock data / dev fallbacks for real `api.*` calls, with no frontend contract changes required.
**Non-goals:** No frontend code changes are part of this plan (the frontend already treats every endpoint below as its target contract — see the `TODO` comments in `src/routes/admin/**/data.ts` and the real `api.*` calls in `src/lib/services/*.ts`). No new roles, routes, or features beyond what `PRODUCT.md` describes.

---

## 0. Why this contract, not a new one

The frontend was built "backend-shaped": every admin `data.ts` module's doc comment states the exact future endpoint it mirrors, and every tenant service already calls a real path via `api.ts` (falling back to mock data only in dev). This plan does not invent a new API design — it fills in the backend that makes those exact calls succeed. Endpoint paths, query params, and response shapes below are taken directly from that existing code, not guessed. Where the frontend hasn't committed to a shape yet (e.g. admin write endpoints only sketched as a comment), this plan proposes the most consistent option and flags it as a decision, not a fact.

---

## Phase 0 — Project setup & foundations

- [x] **Scaffold a new Next.js project** (API routes only — `pages/api` or the `app/api` route handlers, no rendered pages) in its own repo, per `PRODUCT.md`'s architecture section. — done in `backend/` (App Router, `app-api` template, no pages).
- [x] **Configure it to run as a persistent Node server**, not a serverless/edge deployment (`next start` behind a process manager, not Vercel's default serverless functions) — required so `node-cron` reminder processing can run in-process, per `PRODUCT.md`. — `npm run build && npm start` runs `next start -p 4000`; no serverless/edge config used.
- [x] **Add MongoDB connectivity** via `mongoose`, with a cached-connection helper appropriate for Next.js's module reuse across API routes (a single `dbConnect()` used by every handler, connection cached on the global object to avoid reconnect storms). — `backend/src/lib/db.ts`.
- [x] **Set up environment config**: `.env.example` with at least `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN` (the frontend's dev/prod origins), `PAYMENT_GATEWAY_*` keys (provider TBD — see [§7](#7-payments--gateway-integration)), `SMTP_*`/email provider keys (see [§9](#9-notifications--email)), `UPLOAD_DIR` or object-storage keys for maintenance images. — `backend/.env.example` has the core vars; gateway/SMTP/upload keys deferred until those features are built (§7/§8/§9/§6).
- [x] **CORS**: allow only the known frontend origin(s) from `CORS_ORIGIN`, with credentials as needed — do not default to `*`. — `backend/src/lib/cors.ts`.
- [x] **Global middleware**: JSON body parsing, request logging, a consistent error-handling wrapper (see [§10.2](#102-error-response-shape)), and security headers (`helmet`-equivalent for Next.js API routes). — `backend/src/lib/route-handler.ts` (`withErrorHandling` + request logging) and `backend/next.config.ts` (`headers()`).
- [x] **Linting/formatting**: match the frontend's conventions where reasonable (TypeScript strict mode, ESLint) so both repos feel consistent to contributors moving between them. — `backend/eslint.config.mjs`, strict `tsconfig.json`.
- [x] **Seed script**: a `scripts/seed.ts` that populates MongoDB with data shaped like `src/routes/admin/data/mockData.ts` (same units/tenants/payments/maintenance/announcements/reminders/calendar events), so local frontend dev against the real backend looks identical to today's mock-data experience. — `backend/scripts/seed.ts` (run via `npm run seed`).

---

## 1. Data models (MongoDB / Mongoose)

All enums below use the **shared, already-reconciled** types from the frontend's [src/lib/types.ts](src/lib/types.ts) and `src/routes/admin/data/types.ts` — the backend must not reintroduce the `'closed'` vs `'resolved'` or `'failed'` vs `'overdue'` mismatches that [AUDIT §3.3](AUDIT.md#33-data-model-mismatches-between-the-admin-and-tenant-halves) already flagged and the frontend already fixed.

- [ ] **`User`** (backs both admin and tenant accounts — one collection, discriminated by `role`)
  - `_id`, `name`, `email` (unique, lowercased), `passwordHash`, `role: 'admin' | 'tenant'`
  - `phone?`, `unitId?` (ref `Unit`, tenants only), `leaseStart?`, `leaseEnd?`, `monthlyRent?` (tenants only)
  - `rentStatus?: 'paid' | 'due' | 'overdue'` (tenants only), `status: 'active' | 'inactive'` (tenants only)
  - `accountStatus: 'temporary' | 'active'`, `mustChangePassword: boolean` — mirrors `AccountStatus`/`Tenant.mustChangePassword` in [types.ts](src/routes/admin/data/types.ts)
  - `createdAt`, `updatedAt`
  - Index on `email` (unique), `role`, `unitId`
- [ ] **`Unit`**
  - `_id`, `unitNumber` (unique), `floor` (string, per the frontend's own note that floors are strings like `"1"`/`"2"`), `sizeSqft`, `monthlyRent`, `status: 'occupied' | 'vacant' | 'maintenance'`, `tenantId?` (ref `User`)
  - Index on `unitNumber`, `status`, `floor`
- [ ] **`Payment`**
  - `_id`, `tenantId` (ref `User`), `unitId` (ref `Unit`, denormalize `unitNumber` for list display), `amount`, `method: 'cash' | 'bank_transfer' | 'check' | 'gateway'`, `status: 'paid' | 'pending' | 'failed'`, `date`, `note?`, `recordedBy?` (ref `User`, admin who logged an offline payment), `gatewayReference?` (ref/id from the payment gateway, gateway payments only)
  - Index on `tenantId`, `status`, `date`
- [ ] **`MaintenanceRequest`**
  - `_id`, `tenantId` (ref `User`), `unitId` (ref `Unit`), `title`, `description`, `status: 'open' | 'in_progress' | 'resolved'`, `priority: 'low' | 'medium' | 'high'`, `imageUrl?`, `notes?`, `createdAt`, `resolvedAt?`
  - Index on `tenantId`, `status`, `priority`, `createdAt`
- [ ] **`Announcement`**
  - `_id`, `title`, `body`, `audience: 'all' | 'selected'`, `audienceTenantIds: ObjectId[]`, `author` (ref `User`, admin), `createdAt`
  - Index on `createdAt`
- [ ] **`Reminder`**
  - `_id`, `title`, `message`, `type: 'automatic' | 'manual'`, `target: 'tenant' | 'group' | 'everyone'`, `targetTenantIds?: ObjectId[]` (for `group`/`tenant`), `targetLabel` (denormalized display string), `scheduledFor`, `status: 'scheduled' | 'sent' | 'failed'`
  - Index on `status`, `scheduledFor`
- [ ] **`CalendarEvent`**
  - `_id`, `title`, `type: 'lease_renewal' | 'reminder' | 'payment_due' | 'other'`, `date`, `relatedLabel?`, `relatedId?` (loose ref back to a `Reminder`/`Payment`/lease, depending on `type`)
  - Index on `date`, `type`
- [ ] **`Notification`** (one collection, `audience: 'admin' | 'tenant'` field distinguishes the two feeds so `/tenant/notifications` and `/admin/notifications` are simple filtered queries against it)
  - `_id`, `audience: 'admin' | 'tenant'`, `recipientId?` (ref `User`; null/omitted for "all admins" or "all tenants" broadcast notifications), `type` (tenant: `'payment' | 'maintenance' | 'announcement' | 'appointment'`; admin: `'payment' | 'maintenance' | 'announcement' | 'reminder'` — matches `NotificationType`/`AdminNotificationType` already defined in [notificationService.ts](src/lib/services/notificationService.ts) and [adminNotificationService.ts](src/lib/services/adminNotificationService.ts)), `title`, `body?`, `date`, `read: boolean`
  - Index on `audience`, `recipientId`, `read`, `date`

**Decision needed:** whether `Notification` should be a single collection with an `audience` discriminator (proposed above, keeps queries simple) or two collections. Recommend the single-collection approach unless volume/indexing needs diverge later.

---

## 2. Auth & authorization

- [x] **`POST /auth/login`** — body `{ email, password }` → `{ token, user }`. Verify password with `bcrypt`, issue a signed JWT (`role`, `sub`=user id, expiry from `JWT_EXPIRES_IN`). Matches the exact shape `AuthProvider.login()` already expects (`LoginResponse { token, user }` in [AuthProvider.tsx](src/context/AuthProvider.tsx)). — `backend/src/app/api/auth/login/route.ts`.
- [x] **`POST /auth/set-password`** — body `{ newPassword }`, requires a valid (even `mustChangePassword: true`) token → hash and store the new password, set `mustChangePassword: false`, return `{ success: true }`. Matches [authService.ts](src/lib/services/authService.ts). — `backend/src/app/api/auth/set-password/route.ts`.
- [x] **JWT verification middleware** — every non-`/auth/login` route requires a valid `Authorization: Bearer <token>` header; on missing/invalid/expired token, respond `401` with **no body or a short plain-text message** (the frontend's `api.ts` treats any `401` as "log out and redirect to `/login`" regardless of body content — see [api.ts](src/lib/api.ts)). — `requireAuth()` in `backend/src/lib/route-handler.ts`.
- [x] **Role-based route guards** — a `requireRole('admin')`/`requireRole('tenant')` middleware/wrapper for every route below; admin users must never be able to hit `/tenant/*` routes for another tenant's data and vice versa. — `requireRole()` in `backend/src/lib/route-handler.ts`, used by every route handler; single-resource routes also verify row-level ownership (e.g. `payment.tenantId === auth.sub`).
- [ ] **Tenant account creation** (`POST /tenants`, admin-only) generates a temporary password server-side (**not** the client-side `generateTempPassword()` the frontend currently uses only for the mock UI — see the explicit `TODO` in [tenants/data.ts](src/routes/admin/tenants/data.ts)), hashes it before storing, sets `accountStatus: 'temporary'` and `mustChangePassword: true`, and returns the plaintext temp password **once** in the creation response so the admin UI can display/copy it (never store or log the plaintext).
- [ ] **Password hashing**: `bcrypt` with a modern cost factor (12+); never store or log plaintext passwords, including temporary ones, beyond the single creation-response return.
- [ ] **No public registration endpoint** — per `PRODUCT.md`, accounts are admin-created only; do not add a `POST /auth/register`.
- [ ] **Decide & document JWT lifetime + refresh strategy** — a short-lived access token is simplest given the frontend has no refresh-token flow today (401 just logs the user out); recommend a longer-lived single token (e.g. 7–14 days) rather than adding refresh-token complexity the frontend doesn't support yet, and revisit if session length becomes a problem.

---

## 3. API route map

Every path below is prefixed with the base configured in the frontend's `VITE_API_BASE_URL` (e.g. `http://localhost:4000/api`). Query params and response shapes for the "already consumed by the frontend" group are exact — do not deviate. The "admin write/list, not yet wired" group mirrors the `data.ts` doc comments and `TODO`s already in the admin codebase; treat those shapes as strong proposals to keep the eventual frontend swap-in a one-line change per function.

### 3.1 Already consumed by the frontend today (must match exactly)

| Method | Path | Notes | Status |
|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password }` → `{ token, user }` | ✅ done |
| `POST` | `/auth/set-password` | `{ newPassword }` → `{ success }` | ✅ done |
| `GET` | `/tenant/profile` | → `Profile` ([profileService.ts](src/lib/services/profileService.ts)) | ✅ done |
| `PATCH` | `/tenant/profile` | `{ name?, phone? }` → updated `Profile` | ✅ done |
| `GET` | `/tenant/payments?page=&pageSize=` | → `{ data: Payment[], total }` | ✅ done |
| `GET` | `/tenant/payments/:id` | → `Payment` | ✅ done |
| `POST` | `/tenant/payments` | `{ amount }` → `{ success, id }` — triggers the gateway flow, see [§7](#7-payments--gateway-integration) | ⚠️ done as a `pending`-record stub; real gateway call is still §7 |
| `GET` | `/tenant/maintenance?page=&pageSize=` | → `{ data: MaintenanceRequest[], total }` | ✅ done |
| `POST` | `/tenant/maintenance` | multipart or JSON payload incl. image(s) — see [§6](#6-file-uploads--receipts) for the recommended format change | ⚠️ done as JSON (data-URL `images[]`); multipart/object-storage is still §6 |
| `GET` | `/tenant/announcements?page=&pageSize=` | → `{ data: Announcement[], total }` | ✅ done |
| `GET` | `/tenant/calendar` | → tenant-relevant `CalendarEvent[]` (rent due dates + reminders that target them) | ✅ done |
| `GET` | `/tenant/notifications` | → `NotificationItem[]` | ✅ done |
| `POST` | `/tenant/notifications/:id/read` | → `{ success }` | ✅ done |
| `POST` | `/tenant/notifications/mark-all-read` | → `{ success }` | ✅ done |
| `GET` | `/admin/notifications` | → `AdminNotificationItem[]` | ✅ done |
| `POST` | `/admin/notifications/:id/read` | → `{ success }` | ✅ done |
| `POST` | `/admin/notifications/mark-all-read` | → `{ success }` | ✅ done |

All §3.1 routes above are implemented in `backend/src/app/api/**`, backed by Mongoose models in `backend/src/models/`, and verified with `npm run build`/`npm run lint`/`npm run typecheck` (all clean). Seed data for manual testing: `npm run seed` (from `backend/`).

### 3.2 Admin CRUD (not yet called by the frontend — currently mock-data-backed; shapes mirror the `data.ts` doc comments)

| Method | Path | Mirrors |
|---|---|---|
| `GET` | `/units?search=&status=&floor=&sortBy=&sortDir=&page=&pageSize=` | [units/data.ts](src/routes/admin/units/data.ts) `getUnits()` |
| `POST` | `/units` | new unit creation (`UnitNew.tsx`) |
| `GET` | `/units/:unitId` | `getUnit()` |
| `PATCH` | `/units/:unitId` | `updateUnit()` — used both for direct edits and for the tenant-assignment side effect in `TenantNew.tsx` |
| `GET` | `/tenants?search=&rentStatus=&accountStatus=&sortBy=&sortDir=&page=&pageSize=` | [tenants/data.ts](src/routes/admin/tenants/data.ts) `getTenants()` |
| `POST` | `/tenants` | `addTenant()` — see [§2](#2-auth--authorization) for server-side temp-password generation |
| `GET` | `/tenants/:tenantId` | `getTenant()` |
| `PATCH` | `/tenants/:tenantId` | `updateTenant()` |
| `POST` | `/tenants/:tenantId/reset-password` | new — admin-triggered reset, reuses the same server-side temp-password flow as creation; not yet in the frontend but implied by `TempPasswordReveal.tsx` existing as a reusable component |
| `GET` | `/payments?search=&status=&method=&sortBy=&sortDir=&page=&pageSize=` | [payments/data.ts](src/routes/admin/payments/data.ts) `getPayments()` |
| `POST` | `/payments` | `{ tenantId, amount, method, date, note }` — matches the exact TODO in [PaymentNew.tsx](src/routes/admin/payments/PaymentNew.tsx); offline payments only (`method != 'gateway'`) |
| `GET` | `/payments/:paymentId` | admin payment detail |
| `GET` | `/maintenance?search=&status=&priority=&sortBy=&sortDir=&page=&pageSize=` | [maintenance/data.ts](src/routes/admin/maintenance/data.ts) `getMaintenanceRequests()` |
| `PATCH` | `/maintenance/:requestId` | status/notes updates from `MaintenanceDetail.tsx` |
| `GET` | `/announcements` | list for `Announcements.tsx` (see its own `TODO`) |
| `POST` | `/announcements` | `{ title, body, audience, audienceTenantIds }` |
| `GET` | `/reminders?search=&status=&type=&sortBy=&sortDir=&page=&pageSize=` | [reminders/data.ts](src/routes/admin/reminders/data.ts) `getReminders()` |
| `POST` | `/reminders` | `{ title, message, target, tenantId, groupTenantIds, scheduledFor }` — matches the exact TODO in [ReminderNew.tsx](src/routes/admin/reminders/ReminderNew.tsx) |
| `GET` | `/reminders/:reminderId` | admin reminder detail |
| `GET` | `/calendar?search=&type=&dateFrom=&dateTo=&sortDir=&page=&pageSize=` | [calendar/data.ts](src/routes/admin/calendar/data.ts) `getCalendarEvents()` |
| `POST` | `/calendar` | new calendar event (`CalendarNew.tsx`) |

- [ ] Build every route in §3.1 first (Phase 1 of the frontend's own contract) — these unblock replacing tenant-side mock fallbacks.
- [ ] Build §3.2 next — these unblock the admin side's eventual "swap `data.ts` bodies for `api.*` calls" work described in [AUDIT §3.2](AUDIT.md#32-admin-side-has-zero-backend-integration--entirely-static-in-memory-mock-data), which is explicitly out of scope for the frontend-only cleanup plan and depends on this backend existing.

---

## 4. Pagination, filtering & sorting contract

- [ ] Every list endpoint accepts `page` (1-based) and `pageSize` query params and returns `{ data, total, page, pageSize }` (admin endpoints) or `{ data, total }` (tenant endpoints, matching what those services already destructure) — **never** just a bare array for a paginated resource, so the frontend's existing `total`/`hasMore` logic ([Phase 3 of FRONTEND_CLEANUP_PLAN.md](FRONTEND_CLEANUP_PLAN.md)) keeps working unchanged.
- [ ] `search` does a case-insensitive substring match on the same fields the mock `data.ts` filters already use (e.g. unit number for units, name/email for tenants) — implement via a MongoDB text index or a `$regex` filter for small collections; a plaza's data volume doesn't need Atlas Search.
- [ ] `sortBy`/`sortDir` accept exactly the field names already used client-side (e.g. `unitNumber | floor | sizeSqft | monthlyRent | status` for units) — reject unknown `sortBy` values with a `400`, don't silently ignore them.
- [ ] Enum-valued filters (`status`, `priority`, `method`, `type`, `rentStatus`, `accountStatus`) accept `'all'` as "no filter" (matching every `data.ts` default) in addition to the real enum values.

---

## 5. Validation & data integrity

- [ ] **Schema-validate every request body** (recommend `zod`) against the exact shapes in [§3](#3-api-route-map) before touching the database — reject with `400` and a clear message on any mismatch.
- [ ] **Business-rule validation**, not just shape validation:
  - Tenant creation only allows assignment to units with `status: 'vacant'`; assigning marks the unit `occupied` and links `tenantId` in the same transaction (mirrors the two-call pattern already in `TenantNew.tsx`: create tenant, then `updateUnit`).
  - A unit cannot be deleted/reassigned while it has an active tenant without an explicit unassign step.
  - `Payment.amount` must be positive; reject zero/negative amounts.
  - Maintenance request `priority`/`status` transitions are admin-only; tenants can create and read their own requests but never set `status`/`priority`/`notes` directly.
  - `Announcement.audience === 'selected'` requires a non-empty `audienceTenantIds`.
  - `Reminder.target === 'group'` requires `groupTenantIds`; `target === 'tenant'` requires exactly one tenant id.
- [ ] **Use MongoDB transactions** (multi-document, e.g. tenant-create + unit-update, or payment-create + notification-create) where a partial write would leave data inconsistent.

---

## 6. File uploads & receipts

Per `PRODUCT.md`, there are exactly two upload-shaped features — do not add general document uploads.

- [x] **Maintenance request images** (`POST /tenant/maintenance`): switched the wire format from the frontend's base64-JSON approach to `multipart/form-data`. Accepts `image/jpeg|png|webp` only (validated server-side via magic-byte sniffing, not the client-provided MIME string/extension), enforces a server-side 5 MB max size and 5-file max independent of the client check. **Storage decision: local disk** (`backend/uploads/maintenance/`, gitignored) under a non-web-root path, served only through the authenticated `GET /api/uploads/maintenance/:filename` route (ownership-checked — tenant may only fetch images referenced by their own `MaintenanceRequest`, admin unrestricted) — chosen over S3 for this MVP/sandbox environment; revisit if deploying multi-instance. `MaintenanceRequest.images` stores generated filenames; the API maps them to full authenticated URLs in responses. Implemented in `backend/src/lib/uploads.ts` + `backend/src/app/api/tenant/maintenance/route.ts` + `backend/src/app/api/uploads/maintenance/[filename]/route.ts`. Frontend updated to match: `src/lib/api.ts` (FormData body support), `src/lib/services/maintenanceService.ts` (`create()` now builds `FormData`), `src/routes/tenant/MaintenanceNew.tsx` (keeps raw `File[]`, uses `URL.createObjectURL` for previews instead of base64).
- [x] **Payment receipts** (generated, not uploaded, per `PRODUCT.md`): on `Payment.status === 'paid'`, generates a PDF receipt via `pdfkit` (`backend/src/lib/receipt-pdf.ts`) containing tenant name, unit, amount, date, method, and a receipt/reference number. Exposed via authenticated `GET /tenant/payments/:id/receipt` (`backend/src/app/api/tenant/payments/[id]/receipt/route.ts` — accepts either a standard `Authorization: Bearer` header or a short-lived (5 min) purpose-scoped `?token=` query-param JWT, since the frontend's `Payments.tsx` already renders `receiptUrl` as a plain `<a href>` with no custom headers) and `GET /payments/:paymentId/receipt` (admin, any payment, role-checked). PDF generated on demand (no caching needed at this scale). `receiptUrl` is now embedded in `/tenant/payments` list + detail responses when `status === 'paid'`, built via `backend/src/lib/receipt-token.ts`.

---

## 7. Payments & gateway integration

- [ ] **Choose a payment gateway** (Stripe is the pragmatic default for a rent-payment SaaS; document the decision here once made — this plan intentionally does not lock one in since `PRODUCT.md` doesn't name one).
- [ ] **`POST /tenant/payments` flow**: create a `Payment` with `status: 'pending'`, `method: 'gateway'`; create/confirm the gateway's payment intent/checkout session; respond `{ success: true, id }` only once the gateway call itself succeeds (not before) — this directly fixes the trust issue [AUDIT §3.1](AUDIT.md#31-tenant-services-silently-swallow-all-api-errors-and-substitute-fake-data) called out on the frontend side: the frontend no longer fabricates a fake success, so the backend must not either.
- [ ] **Webhook endpoint** (e.g. `POST /webhooks/payment-gateway`) to receive async confirmation/failure from the gateway, updating `Payment.status` to `'paid'`/`'failed'` and the tenant's `rentStatus` accordingly, and creating the matching tenant + admin `Notification` documents.
- [ ] **Verify webhook signatures** using the gateway's SDK-provided verification (never trust an unauthenticated webhook body).
- [ ] **Idempotency**: gateway webhooks can be delivered more than once — key the update on the gateway's event/payment id (`gatewayReference`) and make the handler safe to run twice.
- [ ] **Admin offline payments** (`POST /payments`, `method != 'gateway'`): create the `Payment` directly as `status: 'paid'` (or `'pending'` if the admin is recording a promise-to-pay — decide based on how `PaymentNew.tsx` UI eventually models this), set `recordedBy` to the acting admin, update the tenant's `rentStatus`.

---

## 8. Reminders & scheduled jobs

- [ ] **`node-cron` job(s)** running in-process on the persistent Node server (per `PRODUCT.md`'s explicit architecture note) to:
  - Scan for tenants whose rent is due/overdue and create **automatic** `Reminder` + `Notification` records (and trigger email — see [§9](#9-notifications--email)).
  - Process `Reminder` documents with `status: 'scheduled'` and `scheduledFor <= now`, send them (in-app notification + email), and flip `status` to `'sent'` or `'failed'`.
- [ ] **Manual reminders** (`POST /reminders`, `type: 'manual'`) are created with `status: 'scheduled'` and picked up by the same cron sweep once `scheduledFor` arrives, or sent immediately if `scheduledFor` is now/past — keep one code path for both automatic and manual sends so behavior can't drift between them.
- [ ] **Idempotent cron runs**: guard against double-processing if the process restarts mid-sweep (e.g. claim a batch with an atomic `findOneAndUpdate` status flip before sending).
- [ ] **Failure handling**: if sending a reminder throws (email provider down, etc.), mark `status: 'failed'` rather than leaving it `'scheduled'` forever or crashing the cron process.

---

## 9. Notifications & email

- [ ] **In-app notifications** (`Notification` collection from [§1](#1-data-models-mongodb--mongoose)) are created server-side whenever one of these events happens, per `PRODUCT.md`: a payment is made/fails, a rent reminder fires, a maintenance request status changes, an announcement marked important is posted, a scheduled reminder sends. Both the tenant(s) and relevant admin(s) get their own `Notification` documents where the event concerns both roles (e.g. a payment creates one tenant notification and one admin notification).
- [ ] **Email on major events** (per `PRODUCT.md`: "may also trigger email notifications") — pick an email provider/SMTP (e.g. `nodemailer` + a transactional provider like SES/Postmark/Resend; document the choice here once made) and send for: payment confirmation/failure, rent reminders, maintenance status changes, important announcements, scheduled reminders. Keep email sending decoupled from the request/cron path that creates the notification (e.g. fire-and-forget with logged failures) so an email provider outage never blocks a payment or maintenance update from succeeding.
- [ ] **Respect `mustChangePassword`/temp-password flows**: the temp-password email to a newly created tenant (if the admin chooses "send setup link" over "reveal temp password in UI", per `PRODUCT.md`'s "or a password-setup link" wording) is a separate, security-sensitive email — use a signed, single-use, expiring link if this path is implemented, not a plaintext password by email.

---

## 10. Validation, error handling & security (OWASP-aligned)

### 10.1 Auth & access control
- [ ] Every route (except `/auth/login`) requires a valid JWT; every route enforces the correct role (`admin`/`tenant`) **and** row-level ownership (a tenant can only ever read/write their own `Payment`/`MaintenanceRequest`/`Profile`/`Notification` rows — verify `tenantId`/`recipientId` matches the authenticated user on every single-resource route, not just on list routes).
- [ ] Rate-limit `/auth/login` and `/auth/set-password` to blunt credential-stuffing/brute-force attempts.

### 10.2 Error response shape
- [ ] The frontend's `api.ts` calls `response.text()` on any non-2xx/non-401 response and uses that as the thrown `ApiError`'s message — return a **short, plain, user-safe message string** as the body (not a raw stack trace, not an unformatted JSON blob that would show up verbatim in the UI). A simple convention: respond with `Content-Type: text/plain` and just the message, or a minimal `{ "message": "..." }` JSON body if the team prefers structure — either works with the current frontend, but pick one and use it everywhere consistently.
- [ ] Never leak internal error details (stack traces, DB error messages, library internals) in a response body — log those server-side only.
- [ ] `401` responses should carry no sensitive detail; the frontend already ignores the body entirely and just clears the token and redirects.

### 10.3 Input handling
- [ ] Validate and sanitize all inputs (schema validation from [§5](#5-validation--data-integrity) covers most of this) — reject unexpected fields rather than silently ignoring them, especially on `PATCH` endpoints, so a client can't sneak in `role: 'admin'` or `mustChangePassword: false` on an update it shouldn't control.
- [ ] Use Mongoose's parameterized queries (never string-concatenate user input into a raw query) to avoid NoSQL injection.
- [ ] Enforce request body size limits (protects against DoS via huge payloads, especially relevant once maintenance image uploads move to multipart).

### 10.4 Transport & secrets
- [ ] HTTPS-only in production (terminate TLS at the load balancer/proxy or directly, depending on hosting).
- [ ] All secrets (`JWT_SECRET`, DB URI, gateway keys, SMTP creds) come from environment variables, never committed — mirror the frontend's existing `.env.example` convention.
- [ ] Rotate `JWT_SECRET` capability considered (even if not implemented day one) — don't hardcode it anywhere reachable by a compromised dependency.

### 10.5 Dependency & config hygiene
- [ ] Run `npm audit` as part of CI once the backend project exists; don't let it silently accumulate high-severity advisories the way the frontend's dev-tooling chain currently has (see [FRONTEND_CLEANUP_PLAN.md Phase 6](FRONTEND_CLEANUP_PLAN.md)).
- [ ] Keep `CORS_ORIGIN` an explicit allow-list, not a wildcard, since the API accepts credentials (JWT bearer tokens plus, if cookies are ever introduced, cookie-based CSRF exposure would follow).

---

## 11. Testing

- [ ] **Unit tests** for pure logic: pagination/filter/sort helpers (mirroring the exact behavior of the frontend's `data.ts` functions they replace), password hashing/verification, JWT issuance/verification, reminder-scheduling date logic.
- [ ] **Integration tests** (e.g. `vitest`/`jest` + `mongodb-memory-server` or a Dockerized test Mongo) for each route in [§3](#3-api-route-map): auth flows (login success/failure/wrong role), CRUD happy paths, ownership checks (tenant A cannot read tenant B's payment), pagination edge cases (`page` beyond `total`, empty result sets).
- [ ] **Webhook tests** for the payment gateway integration, including signature-verification failure and idempotent replay of the same event.
- [ ] **Cron job tests** — reminder sweep logic should be testable as a plain function (`processReminders(now: Date)`) independent of the actual `node-cron` scheduler, so tests don't need to wait on real timers.

---

## 12. Deployment & operations

- [ ] Deploy as a long-running Node process (per `PRODUCT.md`) — e.g. a container on a VM/PaaS that supports persistent processes (not a serverless platform), so `node-cron` keeps running between requests.
- [ ] Process manager / restart policy (e.g. PM2, or the hosting platform's own supervisor) so a crashed process (including a failed cron tick) restarts rather than staying down.
- [ ] Structured logging (request id, route, status, latency; separate error log stream) — enough to debug a failed payment or missed reminder after the fact without reproducing locally.
- [ ] Health check endpoint (`GET /health`) for the process manager/load balancer.
- [ ] Database backups for MongoDB (this holds every tenant's payment history — treat backup/restore as a hard requirement, not a nice-to-have).

---

## 13. Open decisions (need an explicit answer before/while building)

- [ ] **Payment gateway provider** — Stripe recommended by default; confirm or pick an alternative.
- [ ] **Email provider** — pick one (SES/Postmark/Resend/etc.) and confirm transactional-email deliverability needs (temp-password/setup-link emails must land reliably).
- [x] **Maintenance image storage** — decided: local disk (`backend/uploads/`, non-web-root, served via authenticated route) for this MVP/sandbox environment; revisit S3-compatible object storage if/when deploying across multiple instances.
- [ ] **Temp password delivery** — admin-UI reveal-once (already partly built on the frontend via `TempPasswordReveal.tsx`) vs. emailed setup link, or support both; affects [§9](#9-notifications--email)'s signed-link work.
- [ ] **Error response body format** — plain text vs. `{ message }` JSON (see [§10.2](#102-error-response-shape)) — either works today, but must be picked once and used consistently everywhere.
- [ ] **JWT lifetime** — confirm the "one longer-lived token, no refresh flow" approach in [§2](#2-auth--authorization) is acceptable, or scope in a refresh-token flow (which would also need frontend changes, out of scope for this plan).

---

## Suggested build order

1. ✅ **Phase 0** (project setup) → **§2** (auth) → the **§3.1** routes already consumed by the frontend, in the order the frontend needs them least-dependency-first: `/auth/login` → `/auth/set-password` → `/tenant/profile` → `/tenant/payments` (read-only first, gateway integration in step 4) → `/tenant/maintenance` → `/tenant/announcements` → `/tenant/calendar` → `/tenant/notifications` → `/admin/notifications`. — **Done**, all implemented in `backend/`, build/lint/typecheck clean.
2. ✅ **§6** (file uploads) alongside `/tenant/maintenance`, since that route needs the multipart upload path from day one. — **Done**: multipart maintenance image uploads (local-disk MVP storage, authenticated serving route) and `pdfkit`-generated payment receipts (tenant + admin authenticated endpoints, token-based URL auth for plain `<a href>` downloads) all implemented and verified; matching frontend changes (`api.ts`, `maintenanceService.ts`, `MaintenanceNew.tsx`) applied; backend build/lint/typecheck and frontend build/lint all clean.
3. **§7** (payment gateway) once `/tenant/payments` exists as a read path — add the write/gateway flow next.
4. **§8/§9** (reminders + notifications + email) once core CRUD exists for tenants/units/payments/maintenance to react to.
5. **§3.2** (admin CRUD routes) — unblocks swapping the admin `data.ts` mock functions for real `api.*` calls, which is explicitly out of scope for the frontend repo's own cleanup plan and depends on this backend existing.
6. **§10/§11/§12** (security hardening, test coverage, deployment) — thread through continuously, not saved for the end, but treat as a final gate before this is considered production-ready.
