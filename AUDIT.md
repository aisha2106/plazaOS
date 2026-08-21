# Plaza OS Frontend — Codebase Audit

**Date:** 2026-08-11
**Branch reviewed:** `review/foundation-setup` (== `origin/develop`)
**Scope:** Full `src/` React frontend, build tooling, and alignment with `PRODUCT.md` / `README.md`.

> **Update (2026-08-11, later same day):** `PRODUCT.md` was revised to add `/admin/notifications` to the route map and clarify account setup, lease handling, deployment-safe reminder scheduling, notifications, and architecture wording. See [§8](#8-productmd-revision-follow-up-2026-08-11) for how each clarification checks out against the current code.

## TL;DR

The foundation (auth, routing, shared UI kit) and the **admin** routes are in solid shape — consistent patterns, clear TODOs, and a clean data-access layer ready to be swapped for real API calls. The **tenant** routes work but are noticeably lower quality (raw `any` casts, hardcoded placeholder numbers, cross-role imports, plain unstyled `<input>`/`<select>` elements instead of the shared UI kit). There is **no automated test suite at all** — no test runner is even installed. The project builds and type-checks cleanly (`tsc -b && vite build` succeeds, `oxlint` reports only 1 warning), so there are no compile errors, but there are real functional/data-integrity bugs described below, most notably **API errors being silently swallowed and replaced with fake success data** on the tenant side.

---

## 1. What I verified

| Check | Result |
|---|---|
| `npm install` | ✅ Succeeds (had to work around a corrupted global npm cache — see [Environment issue](#7-environment--tooling-issues)) |
| `npm run build` (`tsc -b && vite build`) | ✅ Passes, no type errors, 135 modules, ~385 KB JS bundle |
| `npm run lint` (`oxlint`) | ✅ Passes — only 1 warning (`AuthContext.tsx`, react-refresh export rule) |
| Automated tests | ❌ **None exist.** No `*.test.*`/`*.spec.*` files, no `vitest`/`jest`/`@testing-library/*` in `package.json`. "Run tests" isn't currently possible beyond build/lint/manual QA. |
| `npm audit` | ⚠️ 1 high-severity transitive advisory (`nanoid` < 3.3.17, via a dependency) — fixable with `npm audit fix` |
| `backend/`, `frontend/` folders | Empty, untracked by git — stray local folders, not part of the actual app (real source lives in root `src/`) |

---

## 2. Architecture overview

```
React (Vite) SPA
  ├─ AuthProvider (context/AuthContext.tsx) — token + user in localStorage, mock login fallback
  ├─ react-router-dom routes, split into /admin/* and /tenant/*, both behind ProtectedRoute
  ├─ Admin routes: mock-data-backed "data.ts" modules per feature, no react-query
  └─ Tenant routes: react-query hooks (src/hooks) → services (src/lib/services) → api.ts → real backend (falls back to mock on any failure)
```

Git history confirms two independent workstreams merged into `develop`: `admin-routes` and `tenant-frontend` (PR #3 and PR #4). This explains why the two halves diverge so much in style and integration approach — this matches what `README.md` describes as the intended parallel build order, but the two contributors clearly did not reconcile data shapes or integration patterns before merging.

---

## 3. Critical issues (fix before shipping)

### 3.1 Tenant services silently swallow *all* API errors and substitute fake data
`src/lib/services/*.ts` (`paymentService`, `maintenanceService`, `announcementService`, `notificationService`, `profileService`) wrap every `api.*` call in `try { ... } catch { return <mock data> }`. This is not a dev-only fallback gated by `import.meta.env.DEV` (unlike the login mock in `AuthContext.tsx`, which *does* check `DEV` correctly) — it runs in production too.

Consequences:
- [paymentService.ts](src/lib/services/paymentService.ts) — `pay()` will report a **successful payment** even if the real gateway call fails (network error, declined card, 500, validation error, anything). A tenant could believe rent was paid when it wasn't.
- [maintenanceService.ts](src/lib/services/maintenanceService.ts) — `create()` reports success even when the POST fails, so a maintenance request can silently vanish.
- Every `list()`/`getProfile()` call will show believable-looking mock data instead of a real error state if the backend is down or returns a 4xx/5xx — a tenant sees "Jane Cooper" and unit "A-101" instead of an outage message.

**Fix:** Only fall back to mock data when `import.meta.env.DEV` is true (same pattern already used correctly in `AuthContext.login`). In production, real errors must propagate so `isError`/`onError` in the calling components can show them — the tenant screens already have working "Failed to load / Retry" UI wired to `isError`, but it can never trigger today because the service layer hides all errors.

### 3.2 Admin side has zero backend integration — entirely static in-memory mock data
Every admin screen (`units`, `tenants`, `payments`, `maintenance`, `reminders`, `calendar`, `announcements`) reads/writes `mockUnits`, `mockTenants`, etc. directly from [src/routes/admin/data/mockData.ts](src/routes/admin/data/mockData.ts) — there is no `api.ts` usage anywhere under `routes/admin`. "Create"/"update" actions (e.g. `addUnit`, `updateTenant`) mutate the in-memory array via `Array.push`/`Object.assign`, so changes are lost on refresh and never reach a server. This is consistently marked with `// TODO: ... once the backend is reachable` comments, so it's clearly intentional as a stopgap, not an oversight — but it means **no admin screen is actually wired to the backend yet**, which is a large chunk of remaining work before this can be considered "done."

### 3.3 Data model mismatches between the admin and tenant halves
The two contributors independently invented incompatible shapes for the same concepts:
- **Maintenance status:** admin (`src/routes/admin/data/types.ts`) uses `'open' | 'in_progress' | 'resolved'`; tenant (`src/lib/services/maintenanceService.ts`) uses `'open' | 'in_progress' | 'closed'`. The tenant `Maintenance.tsx` filter dropdown even offers a `"closed"` option that a real backend modeled on the admin shape would never return.
- **Payment status:** admin uses `'paid' | 'pending' | 'failed'`; tenant uses `'paid' | 'pending' | 'overdue'`. These aren't just naming differences — "failed" (a payment attempt didn't go through) and "overdue" (nothing was paid by the due date) are different concepts that a real API needs to represent consistently.

**Fix:** Agree on one shared set of types (probably lives in a common `src/lib/types` or similar) before backend integration starts, otherwise the two halves will need contract rework later.

### 3.4 Cross-role import boundary violation
[src/routes/tenant/SetPassword.tsx](src/routes/tenant/SetPassword.tsx) imports `updateTenant` directly from `src/routes/admin/tenants/data.ts`. `README.md` is explicit: *"Do not build role-specific screens outside `routes/admin` or `routes/tenant`... if something is needed by both roles, it belongs in `components/`."* Reaching into the other role's folder breaks that boundary and tightly couples the tenant flow to the admin mock data module, which won't exist once real API calls replace it.

**Fix:** Move password-setup logic behind `src/lib/services` (a real `POST /auth/set-password` call, as the file's own TODO already says), not a direct import of the admin data layer.

### 3.5 `PRODUCT.md` route map vs actual routes — several mismatches
- `PRODUCT.md` lists `/tenant/dashboard`; the actual route is bare `/tenant` (index route in `App.tsx`). Handled somewhat gracefully — `SetPassword.tsx` has a comment acknowledging the gap and redirects to `/tenant` — but it's still a spec/implementation drift that should be reconciled (either update `PRODUCT.md` or add the `/tenant/dashboard` path).
- Same drift for `/admin/dashboard` vs bare `/admin` (also commented/acknowledged in `App.tsx`).
- **`/tenant/calendar` is in `PRODUCT.md`'s route map and is a named core feature ("Tenants ... Views a calendar") but does not exist at all** — no route, no component, no nav link. This is a missing feature, not just a naming drift.
- `/admin/units/new` and `/admin/calendar/new` are used in code/nav but aren't listed in `PRODUCT.md`'s route map (minor doc gap, not a bug).
- **`/admin/notifications` was just added to `PRODUCT.md`'s route map but has no corresponding route, component, service, or nav entry in the codebase yet** — same category of gap as `/tenant/calendar`, and it comes with a whole feature attached (see §8.4).

---

## 4. Significant quality gaps (tenant side)

The tenant routes (`src/routes/tenant/*`) work but are visibly less polished than the admin side:

- **Widespread `any` casts** defeat TypeScript's purpose: `data={(recentPayments as any)}`, `getRowKey={(r: any) => r.id}`, `columns={columns as any}`, `(a: any)`, `(n: any)`, etc. across `TenantHome.tsx`, `Maintenance.tsx`, `Payments.tsx`, `Announcements.tsx`, `Notifications.tsx`. This defeats the `TableColumn<T>` generic that the shared `Table` component was designed around, and hides real type errors (e.g. the mismatched status enums in §3.3 would have been caught by the compiler if these weren't cast away).
- **Hardcoded placeholder values presented as real data** in `TenantHome.tsx`: "Next due" always shows `2026-08-01` and "Balance" always shows `$200`, with only a code comment (not a UI affordance) indicating it's fake. A user has no way to know this number isn't real.
- **`Profile.tsx` save button doesn't persist anything** — `onSubmit` just does `console.log('update', values)`; there's no call to `profileService` at all, despite the service module existing. Editing your profile silently does nothing.
- **Raw unstyled HTML controls instead of the shared UI kit**: `Maintenance.tsx`, `Payments.tsx`, and `Announcements.tsx` use plain `<input>`/`<select>` with ad hoc Tailwind classes instead of the shared `Input`/`Select` components used consistently on the admin side. This violates the design-system rule in both `README.md` and `PRODUCT.md` ("Admin and Tenant views share the same components") and there's no `Select` component in `components/` for tenant screens to reuse (the admin side built its own local one in `routes/admin/components/Select.tsx` instead of promoting it to shared `components/`, compounding the duplication risk described in `README.md`).
- **No pagination metadata used** — tenant list screens track `page` locally and increment it unconditionally on "Next" with no `total`/`hasMore` check from the API response (`{ data, total }` is returned by the services but `total` is discarded), so "Next" can be clicked into empty pages indefinitely.
- **MaintenanceNew.tsx encodes images as base64 data URLs held in component state** and sends them straight in the JSON payload (`payload.images`). This works for a couple of small images but will not scale — no size/type validation, no compression, and large payloads as JSON strings are inefficient compared to `multipart/form-data` upload. Worth flagging now since `PRODUCT.md` explicitly calls out maintenance images as one of only two upload types in the whole app, so it's worth getting right.

---

## 5. Smaller / cross-cutting observations

- **Admin `PaymentsList` and `RemindersList` don't follow the admin side's own established pattern.** Every other admin list (`UnitsList`, `TenantsList`, `MaintenanceList`, `AdminCalendar`) goes through a `data.ts` module with `search/status/sort/page` params and URL-synced state. Payments and Reminders instead render `mockPayments`/`mockReminders` directly with no search, filter, or pagination — inconsistent with the pattern the same author built everywhere else, and will need retrofitting.
- **`oxlint` warning** in [AuthContext.tsx](src/context/AuthContext.tsx#L162): the file exports both the `AuthProvider` component and the `useAuth()` hook / `Role` type from the same module, which breaks Fast Refresh. Low priority, but easy to fix by moving `useAuth` (and maybe `Role`)/types to a separate file.
- **`npm audit`**: one high-severity transitive advisory in `nanoid` (`< 3.3.17`, indefinite loop with `size: 0` — GHSA-2v37-7h3g-55p8). Not directly exploitable from this app's own code as far as I can tell, but cheap to fix with `npm audit fix`.
- **DevKit route** (`/dev/kit`) is correctly gated behind `import.meta.env.DEV` and has a `TODO: remove before shipping` comment — fine as-is, just flagging that it needs to actually be removed (or the TODO actioned) before a production PR.
- **`Modal.tsx`** hardcodes `aria-labelledby="modal-title"` — fine today since only one `Modal` is ever open at a time, but would collide if two were ever rendered simultaneously (e.g. nested confirm dialogs). Consider generating the id with `useId()` like `Input`/`Select`/`Textarea` do.
- **Empty `backend/` and `frontend/` folders** at the repo root are untracked by git and contain nothing — harmless, but confusing given `README.md` refers to "this repo" as `plaza-os-frontend` while the actual source sits in root `src/`. Worth deleting locally or clarifying in the README if they're placeholders for a future monorepo layout.
- **`.env.example`** is present and correctly gitignored (`.env` itself is ignored, `.env.example` explicitly un-ignored) — no secrets committed. Good.
- **Accessibility**: the shared `components/` kit (`Input`, `Textarea`, `Select` (admin), `Modal`, `Button`) is genuinely well done — proper `label`/`aria-describedby`/`aria-invalid` wiring, 44px minimum tap targets, focus trapping with restore-on-close in `Modal`, status badges always paired with text labels per the design spec. This is a strong foundation to build on.

---

## 6. What needs to be done (prioritized)

1. **Fix silent error-swallowing in tenant services** (§3.1) — gate all mock fallbacks behind `import.meta.env.DEV`, same as `AuthContext.login`. This is the highest-priority fix; it's a correctness/trust issue for a rent-payment app.
2. **Reconcile the admin/tenant data model mismatches** (§3.3) — one shared enum for maintenance status, one for payment status, ideally moved into a shared types module both sides import.
3. **Add `/tenant/calendar`** — currently missing entirely despite being in `PRODUCT.md`'s core feature list and route map.
4. **Build the Admin notifications feature** — `/admin/notifications` route, a `Notifications` screen, a service (mirroring `notificationService.ts`), and a `Layout.tsx` nav entry, now that `PRODUCT.md` explicitly requires in-app notifications for both roles (§8.4).
5. **Remove the cross-role import** in `SetPassword.tsx` (§3.4); route it through a real/mocked service call instead.
6. **Wire up `Profile.tsx`'s save action** to actually call `profileService` (or a new update endpoint) instead of `console.log`.
7. **Replace `any` casts on the tenant side** with the same `TableColumn<T>` generic typing already used on the admin side, and swap raw `<input>`/`<select>` for the shared `Input`/promoted `Select` components.
8. **Retrofit `PaymentsList`/`RemindersList`** (admin) with the same search/filter/sort/pagination pattern used elsewhere, or intentionally document why they're simpler.
9. **Reconcile route-map drift** in `PRODUCT.md` vs `App.tsx` (`/admin` vs `/admin/dashboard`, `/tenant` vs `/tenant/dashboard`) — pick one and update the other.
10. **Add an actual test suite.** Nothing currently exists — no runner installed, no test files. At minimum, add Vitest + React Testing Library and cover: `ProtectedRoute` role/redirect logic, `AuthContext` login/mock fallback, the `api.ts` 401 handling, and the admin `data.ts` filter/sort/paginate helpers (pure functions, cheap to test and currently the most reused logic in the app).
11. **Housekeeping:** run `npm audit fix` for the `nanoid` advisory, fix the `AuthContext.tsx` fast-refresh lint warning, action or remove the `DevKit` TODO before a production release, and clean up the stray empty `backend/`/`frontend/` folders.

---

## 7. Environment / tooling issue encountered during this audit

`npm install` initially failed with `EPERM`/`ENOTEMPTY` because the global npm cache (`~/.npm`) contains root-owned files from a previous install run. It's not a repo problem, but anyone else hitting it locally can fix it permanently with:
```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
```
(For this audit I worked around it non-destructively with `npm install --cache /tmp/...` rather than changing ownership of your global npm cache.)

---

## 8. `PRODUCT.md` revision follow-up (2026-08-11)

`PRODUCT.md` was revised with six clarifications after this audit was first written. Checking each against the current code:

1. **`/admin/notifications` added to the route map** — ⚠️ **new gap.** Nothing in the codebase implements this yet: no route in `App.tsx`, no `Notifications` component under `routes/admin`, no service, and no nav entry in `Layout.tsx`'s `NAV_ITEMS.admin`. Added to the prioritized list in §6 as item 4.
2. **Account setup clarified** (no public registration; admin creates accounts; temp password or setup link; must change on first access) — ✅ **already matches the implementation.** `TenantNew.tsx`/`generateTempPassword`, the `accountStatus: 'temporary' | 'active'` + `mustChangePassword` fields on `Tenant`, and `ProtectedRoute`'s redirect to `/tenant/set-password` already build exactly this flow. No code change needed — good confirmation the admin contributor anticipated this correctly.
3. **Lease handling clarified** (rent/dates as structured data, no lease document uploads) — ✅ **already matches.** `Unit`/`Tenant` types store `monthlyRent`, `leaseStart`, `leaseEnd` as plain fields; there is no lease-document upload UI anywhere in the app. No code change needed.
4. **Reminder scheduling made deployment-safe** (`node-cron` runs in-process on the backend's persistent Node server) — this is a **backend-only concern**; there's no backend code in this repo to check it against. `PRODUCT.md`'s Architecture section now states outright that the backend is a persistent Node server (not serverless/edge), which is what makes the in-process `node-cron` approach safe — this resolves the serverless-vs-persistent ambiguity raised earlier in the Next.js-vs-Express discussion in this session.
5. **Notifications clarified** (in-app for both roles; email on major events) — ⚠️ **partially a new gap.** The tenant side already has a working in-app notifications screen/hook/service (`Notifications.tsx`, `useNotifications`, `notificationService.ts`), modulo the error-swallowing bug in §3.1. The **admin side has no notifications feature at all** — this is genuinely new scope, not a pre-existing gap this audit had flagged. See item 1 above; both stem from the same missing feature.
6. **Architecture wording clarified** (React/Vite is the only UI; Next.js is API-routes-only; MongoDB is the database) — ✅ doc-only, no frontend impact. Confirms the existing setup: `package.json` has no `next` dependency anywhere in this repo, and there's nothing here to accidentally regress.

**Net effect on §6's action list:** one new concrete workstream — build the Admin notifications feature (route, component, service, nav entry) — everything else in this revision either confirms existing behavior or applies to a backend repo not present in this workspace.
