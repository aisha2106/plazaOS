# Plaza OS — Product Spec (PRODUCT.md)

## What this is

Plaza OS is a plaza management app with two user roles: **Admin** and **Tenant**. The admin manages the plaza — units, tenants, leases, rent, maintenance, announcements, and reminders. Tenants interact with their own unit, payments, and maintenance requests.

There is no public registration. Tenant accounts are created by the admin when a tenant moves in. There is no owner-verification step, no manager role, and no multi-property setup — this app is scoped to a single plaza.

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
| Rent & lease tracking | Lease terms, rent amounts, due dates |
| Payments | Tenant pays via gateway (`/tenant/payments/new`); admin can log offline payments (`/admin/payments/new`) |
| Maintenance requests | Tenant submits with image upload; admin tracks and updates status |
| Announcements | Admin-posted, visible to all or selected tenants |
| Reminders | Automatic via node-cron on the backend; admin can also send manual reminders to one tenant, a group, or everyone |
| Notifications | In-app and email, for payments, rent reminders, maintenance updates, announcements |
| Receipts | Downloadable, tied to individual payments |
| Calendar | Admin manages events; tenants have a read view of relevant dates |

Detail routes exist for individual tenants, units, payments, maintenance requests, and reminders — each viewable and manageable on its own page, not only in list views.

## Uploads

Only two upload types exist in this app:
- Maintenance request images
- Downloadable payment receipts (generated, not uploaded)

There is no general document upload feature — it was deliberately removed from an earlier, broader version of this project.

## Architecture

React frontend (this repo)
↓ REST calls
Next.js backend (API routes only — no pages)
↓
MongoDB


The frontend does not render any pages itself via Next.js — Next.js here is a backend, not a full-stack framework in this project. All UI lives in this React app.

## Route Map

**Shared**
- `/login`

**Admin**
- `/admin/dashboard`
- `/admin/units`
- `/admin/units/:unitId`
- `/admin/tenants`
- `/admin/tenants/:tenantId`
- `/admin/payments`
- `/admin/payments/new`
- `/admin/payments/:paymentId`
- `/admin/maintenance`
- `/admin/maintenance/:requestId`
- `/admin/announcements`
- `/admin/calendar`
- `/admin/reminders`
- `/admin/reminders/new`
- `/admin/reminders/:reminderId`

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