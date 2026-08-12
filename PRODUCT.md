# Plaza OS — Product Spec (PRODUCT.md)

## What this is

Plaza OS is a plaza management app with two user roles: **Admin** and **Tenant**. The admin manages the plaza — units, tenants, leases, rent, maintenance, announcements, and reminders. Tenants interact with their own unit, payments, and maintenance requests.

Tenant accounts are created by the admin — see Account Setup below. There is no owner-verification step, no manager role, and no multi-property setup — this app is scoped to a single plaza.

## Account Setup

- There is no public registration.
- The admin creates tenant accounts when a tenant moves in.
- New tenants receive a temporary password or a password-setup link.
- Tenants must set/change their password on first access before using the rest of the app.

## Roles

### Admin
- Creates and manages plaza units
- Creates tenant accounts and assigns tenants to units
- Manages lease details and rent
- Tracks and updates maintenance requests
- Posts announcements (to all tenants or a selected group)
- Sets automatic and manual reminders
- Manages a calendar of events (lease renewals, reminders)
- Can manually record offline payments
- Views in-app notifications for admin-relevant events

### Tenant
- Views their assigned unit and current rent status
- Views payment history and downloads receipts
- Pays rent through the payment gateway
- Submits maintenance requests with image uploads
- Views announcements and notifications
- Views a calendar (rent due dates, reminders relevant to them)
- Manages their own profile

## Core Features

| Feature | Details |
|---|---|
| Unit & tenant management | Admin creates/assigns units and tenant accounts |
| Rent & lease tracking | Lease terms (rent amount, start date, end date, due date) stored as structured data — no lease document uploads |
| Payments | Tenant pays via gateway (`/tenant/payments/new`); admin can log offline payments (`/admin/payments/new`) |
| Maintenance requests | Tenant submits with image upload; admin tracks and updates status |
| Announcements | Admin-posted, visible to all or selected tenants |
| Reminders | Automatic processing via `node-cron`, running in-process on the backend's persistent Node server. Admin can also send manual reminders to one tenant, a group, or everyone |
| Notifications | In-app for both Admin and Tenant; major events (payments, rent reminders, maintenance updates, important announcements, scheduled reminders) may also trigger email notifications |
| Receipts | Downloadable, tied to individual payments |
| Calendar | Admin manages events; tenants have a read view of relevant dates |

Detail routes exist for individual tenants, units, payments, maintenance requests, and reminders — each viewable and manageable on its own page, not only in list views.

## Uploads

Only two upload types exist in this app:
- Maintenance request images
- Downloadable payment receipts (generated, not uploaded)

There is no general document upload feature — it was deliberately removed from an earlier, broader version of this project. Lease details (rent amount, start date, end date, due date) are structured database fields, not uploaded documents — lease document uploads are out of scope.

## Architecture

React (Vite) frontend (this repo)
↓ REST calls
Next.js backend (API routes only — no pages)
↓
MongoDB


Next.js is used only for backend API routes in this project — it renders no pages of its own, and must not gain any. React/Vite remains the one and only place UI is rendered; the frontend is never moved into Next.js. The backend runs as a persistent Node server (not a serverless/edge deployment), which is what allows `node-cron` to run reminder processing in-process. MongoDB is the database for all persisted data.

## Route Map

**Shared**
- `/login`

**Admin**
- `/admin/dashboard`
- `/admin/units`
- `/admin/units/new`
- `/admin/units/:unitId`
- `/admin/tenants`
- `/admin/tenants/new`
- `/admin/tenants/:tenantId`
- `/admin/payments`
- `/admin/payments/new`
- `/admin/payments/:paymentId`
- `/admin/maintenance`
- `/admin/maintenance/:requestId`
- `/admin/announcements`
- `/admin/calendar`
- `/admin/calendar/new`
- `/admin/reminders`
- `/admin/reminders/new`
- `/admin/reminders/:reminderId`
- `/admin/notifications`

**Tenant**
- `/tenant/dashboard`
- `/tenant/payments`
- `/tenant/payments/new`
- `/tenant/payments/:paymentId`
- `/tenant/maintenance`
- `/tenant/maintenance/new`
- `/tenant/maintenance/:requestId`
- `/tenant/announcements`
- `/tenant/notifications`
- `/tenant/calendar`
- `/tenant/profile`

## Design System

See the shared design guide for the full color palette, typography scale, spacing rules, and component conventions. In short:

- Primary color `#3730A3`, Inter font, 4px spacing base unit, 12px card radius / 8px button radius
- Status is always paired with a label or icon, never color alone
- Admin and Tenant views share the same components — only the nav and data differ by role

## What's out of scope (intentionally)

These were considered and cut when the project was narrowed to its current scope. Do not add them without an explicit decision to expand scope again:

- Public tenant self-registration
- Owner-verification workflow
- A separate "manager" role distinct from admin
- Multi-property / multi-plaza organization support
- General document uploads (contracts, IDs, etc.)