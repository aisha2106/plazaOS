# Plaza OS — Frontend Cleaning & Fixing Plan

**Source:** [AUDIT.md](AUDIT.md)
**Scope:** `src/` React frontend only. Nothing here depends on a backend existing — the goal is to get the frontend itself correct, consistent, and complete on its own terms (mock data included), so it's ready to have real API calls dropped in later.

Out of scope for this plan (tracked in the audit but not actionable frontend-only): wiring admin screens to a real backend ([§3.2](AUDIT.md#32-admin-side-has-zero-backend-integration--entirely-static-in-memory-mock-data)) — already correctly stubbed behind `TODO` comments and requires a backend to exist first.

Work through the phases in order — each one is safe to ship on its own and later phases assume earlier ones are done.

---

## Phase 1 — Data integrity fixes (highest priority)

- [x] **Gate tenant service mock fallbacks behind `import.meta.env.DEV`** ([AUDIT §3.1](AUDIT.md#31-tenant-services-silently-swallow-all-api-errors-and-substitute-fake-data)) — [paymentService.ts](src/lib/services/paymentService.ts), [maintenanceService.ts](src/lib/services/maintenanceService.ts), `announcementService.ts`, `notificationService.ts`, `profileService.ts`. Match the pattern already used correctly in [AuthContext.tsx](src/context/AuthContext.tsx)'s login. Real errors must propagate in production so the existing `isError`/retry UI can actually fire.
- [x] **Unify the maintenance status enum** ([AUDIT §3.3](AUDIT.md#33-data-model-mismatches-between-the-admin-and-tenant-halves)) — pick one of `'resolved'`/`'closed'`, update whichever side is wrong, remove the mismatched filter option.
- [x] **Unify the payment status enum** ([AUDIT §3.3](AUDIT.md#33-data-model-mismatches-between-the-admin-and-tenant-halves)) — decide whether `'failed'` and `'overdue'` are both needed as distinct states, and make both sides agree.
- [x] **Move the unified types into a shared module** (e.g. `src/lib/types.ts`) that both `routes/admin` and `routes/tenant`/`lib/services` import, instead of each side declaring its own.
- [x] **Remove the cross-role import** in [SetPassword.tsx](src/routes/tenant/SetPassword.tsx) ([AUDIT §3.4](AUDIT.md#34-cross-role-import-boundary-violation)) — replace the direct `updateTenant` import from `routes/admin/tenants/data.ts` with a call through `src/lib/services` (mocked for now, matching the file's own TODO).

## Phase 2 — Missing routes & features

- [x] **Add `/tenant/calendar`** ([AUDIT §3.5](AUDIT.md#35-productmd-route-map-vs-actual-routes--several-mismatches)) — route, component, and nav link; can start on mock/read-only data consistent with the rest of the tenant side.
- [x] **Build the Admin notifications feature** ([AUDIT §8.1/§8.4](AUDIT.md#8-productmd-revision-follow-up-2026-08-11)) — `/admin/notifications` route, a `Notifications` screen under `routes/admin`, a service module mirroring `notificationService.ts` (mock-backed for now), and a nav entry in [Layout.tsx](src/components/Layout.tsx)'s `NAV_ITEMS.admin`.
- [x] **Reconcile `PRODUCT.md` vs `App.tsx` route-map drift** ([AUDIT §3.5](AUDIT.md#35-productmd-route-map-vs-actual-routes--several-mismatches)) — `/admin` vs `/admin/dashboard`, `/tenant` vs `/tenant/dashboard`, and add the undocumented `/admin/units/new` / `/admin/calendar/new` to `PRODUCT.md`'s route map. Pick one direction (rename routes or update the doc) and apply it consistently.

## Phase 3 — Tenant-side quality parity with admin

- [x] **Wire up `Profile.tsx`'s save action** to actually call `profileService` instead of `console.log` ([AUDIT §4](AUDIT.md#4-significant-quality-gaps-tenant-side)).
- [x] **Remove hardcoded placeholder values** in [TenantHome.tsx](src/routes/tenant/TenantHome.tsx) ("Next due" / "Balance") — derive from real query data, or show an explicit loading/empty state instead of fake numbers.
- [x] **Replace `any` casts** across `TenantHome.tsx`, `Maintenance.tsx`, `Payments.tsx`, `Announcements.tsx`, `Notifications.tsx` with proper `TableColumn<T>` typing.
- [x] **Promote `Select` to shared `components/`** (currently duplicated locally in [routes/admin/components/Select.tsx](src/routes/admin/components/Select.tsx)) and use it — plus the existing shared `Input` — in `Maintenance.tsx`, `Payments.tsx`, and `Announcements.tsx` instead of raw `<input>`/`<select>`.
- [x] **Use pagination metadata correctly** — read `total`/`hasMore` from service responses on tenant list screens instead of discarding it and incrementing `page` unconditionally.
- [x] **Add basic validation to `MaintenanceNew.tsx`'s image upload** — size/type checks before base64-encoding, since this is one of only two upload paths in the whole app.

## Phase 4 — Admin-side consistency

- [x] **Retrofit `PaymentsList` and `RemindersList`** ([AUDIT §5](AUDIT.md#5-smaller--cross-cutting-observations)) with the same `data.ts` + search/status/sort/page pattern used by `UnitsList`, `TenantsList`, `MaintenanceList`, and `AdminCalendar`.

## Phase 5 — Test suite

- [x] **Install Vitest + React Testing Library** — nothing is installed today, no test files exist.
- [x] **Cover the highest-value logic first**: `ProtectedRoute` role/redirect behavior, `AuthContext` login + mock fallback gating, `api.ts` 401 handling, and the admin `data.ts` filter/sort/paginate helpers (pure functions, cheap to test, most reused logic in the app).

## Phase 6 — Housekeeping

- [x] **`npm audit fix`** for the `nanoid` advisory — investigated: 13 high-severity advisories all trace to `nanoid` inside the `postcss`/`tailwindcss`/`vite`/`vitest` dev-tooling chain, with no fix available upstream. `npm audit fix` run was skipped per explicit user choice; no runtime/production impact.
- [x] **Fix the `oxlint` fast-refresh warning** in `AuthContext.tsx` — split into [AuthContext.ts](src/context/AuthContext.ts) (context object + types), [AuthProvider.tsx](src/context/AuthProvider.tsx) (provider component), and [useAuth.ts](src/context/useAuth.ts) (hook). `oxlint` now reports zero warnings.
- [x] **Action or remove the `DevKit` TODO** ([DevKit.tsx](src/routes/dev/DevKit.tsx)) — route is already gated behind `import.meta.env.DEV` in [App.tsx](src/App.tsx), so it can't reach production builds; replaced the stale TODO comments with factual ones reflecting this.
- [x] **Generate `Modal.tsx`'s `aria-labelledby` with `useId()`** instead of a hardcoded id — done in [Modal.tsx](src/components/Modal.tsx).
- [x] **Delete the empty, untracked `backend/`/`frontend/` folders** at the repo root — confirmed both were empty, untracked, with no git history; removed.

---

## Suggested order of work

Phases 1 → 2 → 3 → 4 → 5 → 6. Phase 1 fixes real correctness bugs and unblocks accurate error states before more UI work sits on top of it; Phase 2 closes feature gaps already promised by `PRODUCT.md`; Phases 3–4 bring both halves to the same quality bar; Phase 5 locks in the fixes with tests; Phase 6 is low-risk cleanup that can be interleaved anytime.
