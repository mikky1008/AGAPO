# AGAPO — Senior Citizen Management System

**Barangay San Francisco, Mainit, Surigao del Norte, Philippines**

AGAPO is a web-based management system for barangay health workers to register, track, and prioritize senior citizens for government assistance. It combines a rule-based priority scoring engine with an optional AI agent (via N8N) to help staff identify which seniors need the most urgent support.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Roles](#authentication--roles)
6. [Priority Scoring Engine](#priority-scoring-engine)
7. [AI Agent Integration (N8N)](#ai-agent-integration-n8n)
8. [Notification System](#notification-system)
9. [Audit & Security](#audit--security)
10. [Edge Functions](#edge-functions)
11. [SQL Migrations Guide](#sql-migrations-guide)
12. [Environment Variables](#environment-variables)
13. [Local Development](#local-development)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router v6 |
| UI Components | shadcn/ui (Radix UI primitives) + Tailwind CSS |
| Forms | React Hook Form + Zod |
| State / Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Backend / Database | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| Email | Resend (via Supabase Edge Function) |
| AI Orchestration | N8N (external workflow automation) |
| Deployment | Vercel (frontend) + Supabase Cloud |
| Testing | Vitest + Testing Library |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                  │
│                                                        │
│  AuthContext → Supabase Auth (JWT session)             │
│  TanStack Query → Supabase JS client (REST + Realtime) │
│  ChatAgent → Anthropic Claude API (direct fetch)       │
└───────────────────┬────────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼────────────────────────────────────┐
│                     Supabase Cloud                      │
│                                                        │
│  ┌─────────────┐  ┌────────────────────────────────┐  │
│  │  Auth        │  │  PostgreSQL Database            │  │
│  │  (JWT/Magic  │  │  ┌──────────────────────────┐  │  │
│  │   Link)      │  │  │  Tables (with RLS)        │  │  │
│  └─────────────┘  │  │  seniors                  │  │  │
│                   │  │  assistance_records        │  │  │
│  ┌─────────────┐  │  │  profiles / user_roles     │  │  │
│  │  Edge        │  │  │  notifications             │  │  │
│  │  Functions   │  │  │  ai_agent_logs             │  │  │
│  │  (Deno)      │  │  │  system_logs               │  │  │
│  │              │  │  └──────────────────────────┘  │  │
│  │  send-email  │  │  ┌──────────────────────────┐  │  │
│  │  n8n-webhook │  │  │  Stored Functions (RPC)   │  │  │
│  └─────────────┘  │  │  apply_ai_priority         │  │  │
│                   │  │  set_user_role              │  │  │
│  ┌─────────────┐  │  │  list_all_users            │  │  │
│  │  Realtime    │  │  │  soft_delete_*             │  │  │
│  │  (websocket) │  │  └──────────────────────────┘  │  │
│  └─────────────┘  └────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────┘
                                    │ Webhook (POST)
                    ┌───────────────▼──────────┐
                    │      N8N (AI Workflow)    │
                    │  ┌──────────────────────┐│
                    │  │  Claude / LLM scoring ││
                    │  │  → apply_ai_priority  ││
                    │  └──────────────────────┘│
                    └──────────────────────────┘
```

**Data flow in brief:** The React app authenticates users through Supabase Auth. All database reads/writes go through the Supabase JS client using Row Level Security (RLS) to enforce permissions. An N8N workflow can call the `n8n-ai-webhook` Edge Function, which in turn calls the `apply_ai_priority` RPC to write AI-generated priority scores into the database. A floating `ChatAgent` component talks directly to the Anthropic Claude API for in-app Q&A. Notification emails are sent by the `send-notification-email` Edge Function via Resend.

---

## Project Structure

```
AGAPO-main/
├── src/
│   ├── App.tsx                  # Root component: providers + route definitions
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global styles (Tailwind + CSS variables)
│   ├── App.css
│   │
│   ├── pages/                   # Top-level route pages
│   │   ├── Login.tsx            # Auth page (sign-in, sign-up, password reset link)
│   │   ├── Dashboard.tsx        # Summary stats and charts
│   │   ├── Seniors.tsx          # Senior citizen list: CRUD, search, soft-delete
│   │   ├── Assistance.tsx       # Assistance records: add, filter, soft-delete
│   │   ├── Priority.tsx         # Priority list view + manual AI trigger
│   │   ├── Reports.tsx          # Analytics + PDF export
│   │   ├── AgentLogs.tsx        # AI agent decision history
│   │   ├── Users.tsx            # Admin-only: manage staff accounts
│   │   ├── Profile.tsx          # Per-user profile + notification preferences
│   │   ├── ResetPassword.tsx    # Password reset form (magic-link flow)
│   │   └── NotFound.tsx
│   │
│   ├── components/
│   │   ├── AppLayout.tsx        # Sidebar nav shell wrapping all protected pages
│   │   ├── ChatAgent.tsx        # Floating AI chat bubble (calls Anthropic API)
│   │   ├── NotificationBell.tsx # Real-time unread notification badge
│   │   ├── NavLink.tsx          # Active-aware sidebar link
│   │   ├── SeniorForm.tsx       # Create/edit senior form (React Hook Form + Zod)
│   │   ├── SeniorProfile.tsx    # Read-only senior detail card
│   │   └── ui/                  # shadcn/ui generated components (do not edit manually)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Provides `user`, `session`, `loading`, `signOut`
│   │   └── ThemeContext.tsx     # Light/dark mode toggle
│   │
│   ├── hooks/
│   │   ├── useUserRole.ts       # Returns current user's role ('admin' | 'staff')
│   │   ├── use-toast.ts         # Toast notification hook
│   │   └── use-mobile.tsx       # Responsive breakpoint hook
│   │
│   ├── lib/
│   │   ├── priorityScoring.ts   # Deterministic priority score computation (no API)
│   │   ├── notificationEmail.ts # Helper to invoke send-notification-email function
│   │   └── utils.ts             # Tailwind class merging utility
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts        # Supabase client (reads VITE_SUPABASE_* env vars)
│           └── types.ts         # Auto-generated TypeScript types from DB schema
│
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── send-notification-email/index.ts   # Edge Function: email via Resend
│   │   └── n8n-ai-webhook/                    # Edge Function: N8N → apply_ai_priority
│   └── migrations/              # Ordered SQL migration files (apply in order)
│       ├── 20260309…sql         # Initial schema: profiles, seniors, assistance_records
│       ├── 20260310…sql
│       ├── 20260316…sql
│       ├── 20260317…sql
│       ├── 20260318 (×2)…sql
│       └── 20260319…sql         # AI agent integration: ai_agent_logs, apply_ai_priority
│
├── Agapo_SQL/                   # Supplementary SQL (apply after migrations, see below)
│   ├── Consolidated_RLS.sql     # Final unified RLS policies
│   ├── Admin_profile_access.sql # Admin can view/manage all profiles
│   ├── Fix_Role.sql             # Fixes signup trigger for role assignment
│   ├── Honor_Notification.sql   # DB triggers for in-app notifications
│   ├── Immutable_System_AuditLog.sql  # system_logs table + audit triggers
│   ├── Persist_AI_Priority.sql  # apply_ai_priority RPC + realtime subscription
│   ├── AI_Priority.sql          # n8n-ai-webhook Edge Function source
│   └── Soft_Delete_Enablement.sql    # deleted_at soft-delete pattern
│
├── .env.example                 # Required environment variables
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── vercel.json                  # SPA redirect rule for Vercel
```

---

## Database Schema

All tables live in the `public` schema of a Supabase PostgreSQL instance.

### `profiles`
Extends `auth.users`. Created automatically via the `on_auth_user_created` trigger on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `auth.users` | unique |
| `full_name` | TEXT | |
| `role` | TEXT | legacy column; authoritative role is in `user_roles` |
| `is_active` | BOOLEAN | false = deactivated staff (cannot log in) |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

### `user_roles`
Single-role model. Each user has exactly one row.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `role` | `app_role` enum | `'admin'` or `'staff'` |

### `seniors`
Core entity. Represents a registered senior citizen.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `first_name`, `last_name` | TEXT | |
| `birth_date` | DATE | used to compute age dynamically |
| `gender` | TEXT | `'Male'` / `'Female'` |
| `address` | TEXT | |
| `contact_number`, `emergency_contact` | TEXT | |
| `illnesses` | TEXT[] | list of diagnosed conditions |
| `illness_severity` | TEXT | `'None'` / `'Mild'` / `'Severe'` |
| `income_level` | TEXT | `'Low'` / `'Below Average'` / `'Average'` / `'Above Average'` |
| `living_status` | TEXT | `'Living Alone'` / `'With Family'` / `'With Caregiver'` |
| `priority_level` | TEXT | `'High'` / `'Medium'` / `'Low'` |
| `priority_score` | INTEGER | numeric score (0–15) from scoring engine |
| `priority_updated_at` | TIMESTAMPTZ | stamped by `on_priority_changed` trigger |
| `agent_reasoning` | TEXT | free-text explanation written by AI agent |
| `last_aid_date` | DATE | auto-updated by `on_assistance_inserted` trigger |
| `photo` | TEXT | URL to stored image |
| `deleted_at` | TIMESTAMPTZ | NULL = active; set = soft-deleted |
| `created_by` | UUID FK → `auth.users` | |

### `assistance_records`
One-to-many with `seniors`. Tracks every instance of help given.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `senior_id` | UUID FK → `seniors` | |
| `type` | TEXT | `'Financial'` / `'Medical'` / `'Food'` / `'Other'` |
| `description`, `given_by` | TEXT | |
| `amount` | NUMERIC(12,2) | |
| `date_given` | DATE | triggers `update_last_aid_date` on seniors |
| `status` | TEXT | `'Pending'` / `'Completed'` |
| `deleted_at` | TIMESTAMPTZ | soft-delete |

### `notifications`
Per-user in-app notification feed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID | recipient |
| `type` | TEXT | `'new_senior'` / `'assistance_added'` / `'high_priority'` / `'assistance_completed'` |
| `message` | TEXT | human-readable body |
| `senior_id` | UUID FK → `seniors` | optional context |
| `triggered_by` | TEXT | `'system'` or `'ai_agent'` |
| `read` | BOOLEAN | |

### `notification_preferences`
Per-user opt-in/out for each notification type. Both in-app and email toggles.

### `ai_agent_logs`
Immutable log of every AI priority decision. Written only by the `apply_ai_priority` RPC.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `senior_id` | UUID FK → `seniors` | |
| `action` | TEXT | e.g. `'priority_update'` |
| `old_priority`, `new_priority` | TEXT | before/after level |
| `score` | INTEGER | |
| `reasoning` | TEXT | AI-generated explanation |
| `triggered_by` | TEXT | `'n8n_agent'` / `'manual'` |
| `triggered_at` | TIMESTAMPTZ | |

Subscribed to Supabase Realtime so the frontend receives live updates.

### `system_logs`
Append-only audit trail. No UPDATE or DELETE policies — rows cannot be modified after insertion.

Audit triggers (`audit_seniors`, `audit_assistance_records`, `audit_profiles`, `audit_user_roles`) automatically write a snapshot of every INSERT/UPDATE/DELETE to this table.

---

## Authentication & Roles

Authentication is handled entirely by Supabase Auth (email + password or magic link). On successful login, a JWT is stored in the browser and passed automatically by the Supabase JS client.

**Role system** uses a `user_roles` table with an `app_role` enum (`admin` | `staff`). The helper functions `has_role()` and `get_user_role()` are used inside RLS policies and stored procedures to enforce access.

On signup, the `on_auth_user_created_role` trigger reads the `role` field from `raw_user_meta_data` and inserts the appropriate row into `user_roles` (defaulting to `'staff'` if none is provided or the value is invalid).

The `useUserRole` hook in the frontend fetches the current user's role from Supabase and makes it available to components for conditional rendering (e.g. showing the Users management page only to admins).

**Protected routes** are wrapped in a `ProtectedRoute` component that redirects unauthenticated users to `/` (Login).

---

## Priority Scoring Engine

`src/lib/priorityScoring.ts` contains a deterministic, client-side scoring algorithm. It runs without any API call and produces a score from 0 to 15.

**Factors:**

| Factor | Values | Max risk points |
|---|---|---|
| Income Level | Low = 4, Below Average = 3, Average = 2, Above Average = 1 | 4 |
| Living Status | Living Alone = 2, With Family / With Caregiver = 1 | 2 |
| Age | 80+ = 3, 70–79 = 2, 60–69 = 1 | 3 |
| Illness Count | 3+ = 6, 2 = 4, 1 = 2, 0 = 0 | 6 |

**Thresholds:**

- Score ≥ 10 → **High**
- Score 6–9 → **Medium**
- Score < 6 → **Low**

This scoring runs instantly in the browser when a senior's record is created or updated, before any optional AI re-scoring by N8N.

---

## AI Agent Integration (N8N)

For deeper analysis, the system integrates with an N8N workflow that can call a large language model to reassess priority.

**Flow:**

1. A staff member or automated schedule triggers N8N with a `senior_id`.
2. N8N fetches the senior's data and sends it to an LLM (e.g. Claude) for evaluation.
3. N8N calls the `n8n-ai-webhook` Supabase Edge Function with the result payload.
4. The Edge Function validates a shared secret (`N8N_WEBHOOK_SECRET`) and calls the `apply_ai_priority` RPC.
5. The RPC updates `seniors.priority_level`, `priority_score`, and `agent_reasoning`, and writes an entry to `ai_agent_logs`.
6. The frontend receives the update in real time via Supabase Realtime (the `ai_agent_logs` table is part of the `supabase_realtime` publication).

**N8N webhook payload (POST to Edge Function):**

```json
{
  "senior_id": "<uuid>",
  "score": 11,
  "level": "High",
  "reasoning": "Senior lives alone, low income, and has 3 diagnosed illnesses.",
  "triggered_by": "n8n_agent"
}
```

The Edge Function source is in `Agapo_SQL/AI_Priority.sql` (despite the `.sql` extension, it is TypeScript/Deno code). Deploy it as:

```bash
supabase functions deploy n8n-ai-webhook
```

---

## Notification System

Two delivery channels: **in-app** (database-driven, real-time) and **email** (via Resend).

**In-app notifications** are created by PostgreSQL triggers (defined in `Honor_Notification.sql`):

- `notify_new_senior` — fires on INSERT to `seniors`
- `notify_assistance_added` — fires on INSERT to `assistance_records`
- `notify_high_priority` — fires on UPDATE to `seniors` when `priority_level` changes to `'High'`
- `notify_assistance_completed` — fires on UPDATE to `assistance_records` when `status` changes to `'Completed'`

Each trigger inserts a row into `notifications` for every user who has not opted out of that notification type in their `notification_preferences`.

**Email notifications** are sent by calling the `send-notification-email` Edge Function. It queries `notification_preferences` for users who have the corresponding email toggle enabled, retrieves their email from `auth.users`, and sends via the Resend API.

The `NotificationBell` component in the sidebar subscribes to the `notifications` table via Supabase Realtime and displays an unread count badge.

---

## Audit & Security

### Row Level Security (RLS)

All tables have RLS enabled. Key policy logic:

- **Staff** can read all seniors and assistance records (excluding soft-deleted rows).
- **Admin** can additionally read soft-deleted rows, view all profiles, and view system logs.
- **`system_logs`** has no UPDATE or DELETE policy — rows are immutable once written.
- **`user_roles`** INSERT is restricted to the `handle_new_user_role` trigger (SECURITY DEFINER) and admin-only RPCs.

The consolidated, idempotent version of all RLS policies is in `Agapo_SQL/Consolidated_RLS.sql`.

### Soft Delete

Rather than hard-deleting records, the app sets `deleted_at = now()`. RLS SELECT policies filter out rows where `deleted_at IS NOT NULL` for regular staff. Admins can see deleted rows. The RPCs `soft_delete_senior`, `soft_delete_assistance`, and `restore_senior` are the intended interface.

### System Audit Log

`system_logs` is an append-only table. Triggers attached to `seniors`, `assistance_records`, `profiles`, and `user_roles` write a full JSON snapshot of old and new data on every change. Only admins can query this table.

---

## Edge Functions

Both Edge Functions are Deno-based and run on Supabase's edge runtime.

### `send-notification-email`

Located at `supabase/functions/send-notification-email/index.ts`.

Accepts a JSON body `{ type, message, subject }`. Looks up users with the corresponding email preference enabled, fetches their email via the admin auth API, and sends an HTML-formatted email through Resend.

**Required secret:** `RESEND_API_KEY` (set in Supabase dashboard → Edge Functions → Secrets)

### `n8n-ai-webhook`

Source at `Agapo_SQL/AI_Priority.sql` (deploy this as `n8n-ai-webhook`).

Receives AI scoring results from N8N. Validates the `x-webhook-secret` header, then calls `apply_ai_priority` RPC with service-role credentials so it can bypass RLS.

**Required secrets:** `N8N_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## SQL Migrations Guide

The migrations are split across two sets. Apply them in this order:

**Step 1 — Core migrations** (already in `supabase/migrations/`, applied by `supabase db push`):

| File | What it does |
|---|---|
| `20260309…sql` | Creates `profiles`, `seniors`, `assistance_records`; sets up auth trigger and basic RLS |
| `20260310…sql` | Additional schema additions |
| `20260316…sql` | Notifications table and preferences |
| `20260317…sql` | User roles table and `has_role` / `get_user_role` functions |
| `20260318 (first)…sql` | N8N bridge scaffolding |
| `20260318 (second)…sql` | Further RLS updates |
| `20260319…sql` | AI agent integration: `ai_agent_logs`, columns on `seniors`, `update_last_aid_date` trigger |

**Step 2 — Supplementary SQL** (`Agapo_SQL/`, apply manually in the Supabase SQL editor in this order):

| File | Purpose |
|---|---|
| `Soft_Delete_Enablement.sql` | Adds `deleted_at` columns and soft-delete helper functions |
| `Immutable_System_AuditLog.sql` | Creates `system_logs` and attaches audit triggers |
| `Persist_AI_Priority.sql` | `apply_ai_priority` RPC, `stamp_priority_updated_at` trigger, realtime publication |
| `Honor_Notification.sql` | Notification DB triggers for in-app alerts |
| `Admin_profile_access.sql` | Admin-visible profile/user-role RLS and `list_all_users` / `set_user_role` RPCs |
| `Fix_Role.sql` | Fixes the signup trigger so roles are correctly assigned on user creation |
| `Consolidated_RLS.sql` | Idempotent final consolidation — re-run this last to ensure all policies are consistent |
| `AI_Priority.sql` | N8N webhook Edge Function source (deploy separately, not a SQL file) |

> **Note:** `Consolidated_RLS.sql` is safe to re-run; it uses `DROP POLICY IF EXISTS` and `CREATE OR REPLACE` throughout.

---

## Environment Variables

Create a `.env` file (or set on Vercel) based on `.env.example`:

```env
# Supabase project credentials (public — safe to expose in the browser)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
```

Supabase Edge Function secrets (set in Supabase Dashboard → Settings → Edge Functions):

```
RESEND_API_KEY=re_...
N8N_WEBHOOK_SECRET=<shared-secret-with-n8n>
SUPABASE_URL=<same as above>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key — never expose this in the browser>
```

---

## Local Development

**Prerequisites:** Node.js 18+, Supabase CLI

```bash
# Install dependencies
npm install

# Copy env file and fill in your Supabase project credentials
cp .env.example .env

# Start the dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

To work with Supabase locally:

```bash
supabase start          # starts local Postgres + Auth + Storage
supabase db push        # applies migrations to local DB
supabase functions serve  # runs Edge Functions locally
```

To deploy Edge Functions:

```bash
supabase functions deploy send-notification-email
supabase functions deploy n8n-ai-webhook
```

The frontend is deployed to Vercel. The `vercel.json` contains a catch-all redirect rule to support client-side routing (`/*` → `/index.html`). `_redirects` serves the same purpose for Netlify if used as an alternative.
