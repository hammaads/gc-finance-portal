# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

This is a **Next.js App Router** finance portal (donation/expense management for iftaar drives) built with **React 19**, **TypeScript**, **Supabase**, and **shadcn/ui** (new-york style).

### Page Pattern

Every protected page follows a server/client split:

1. **Server component** (`page.tsx`) — async function that fetches data via server actions, wrapped in `<Suspense>` with skeleton fallbacks
2. **Client component** (`*-client.tsx`) — receives data as props, handles interactivity (forms, dialogs, toasts)

### Data Flow

- **Server Actions** live in `lib/actions/` — each validates with Zod (`lib/schemas/`), creates a fresh Supabase server client, checks auth via `supabase.auth.getClaims()`, performs the operation, and calls `revalidatePath()`
- **Supabase clients**: browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`) — always created fresh per request
- **Forms** use React 19's `useActionState` hook bound to server actions, with `sonner` for toast notifications

### Central Ledger Design

All financial transactions go through a single `ledger_entries` table with a `type` discriminator: `donation_bank`, `donation_cash`, `expense_bank`, `expense_cash`, `cash_transfer`, `cash_deposit`. Zod schemas in `lib/schemas/ledger.ts` use discriminated unions matching these types.

### Key Patterns

- **Soft deletes everywhere** — `.update({ deleted_at: ... })` instead of hard deletes; all queries filter `.is("deleted_at", null)`
- **Multi-currency with PKR base** — amounts stored in original currency with exchange rate; `amount_pkr` is computed. PKR is the base reporting currency
- **Database views** handle computed data: `bank_account_balances`, `budget_vs_actual`, `drive_financial_summary`, `volunteer_cash_balances`
- **Auth**: Supabase password auth with middleware (`proxy.ts`) that refreshes sessions and redirects unauthenticated users. Uses `getClaims()` (not `getUser()`) for fast JWT-based auth checks in server actions

### Path Alias

`@/*` maps to the project root (e.g., `@/lib/actions/donations`, `@/components/ui/button`).

### Key Libraries

- `recharts` for charts, `@react-pdf/renderer` for PDF export, `date-fns` for dates
- `zod` v4 for validation, `lucide-react` for icons, `next-themes` for dark/light mode
- Supabase MCP server connected to project `fjyjekhfdkjdancrxvoo`
