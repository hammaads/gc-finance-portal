# Iftaar Finance Portal

A full-stack finance portal for managing donations, expenses, cash flow, and budgets for iftaar drives — built with Next.js 15, React 19, TypeScript, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Features

### Financial Management
- Central ledger with type-discriminated entries (bank/cash donations, expenses, transfers, deposits)
- Multi-currency support with PKR as the base reporting currency
- Automatic exchange rate conversion and PKR amount computation

### Drive & Budget Planning
- Cause/drive management with type, date, location, and expected headcount
- Per-drive budgets with expense categories, quantity, and unit pricing
- Budget vs. actual tracking via database views
- Reusable drive templates for recurring events

### Cash Operations
- Volunteer cash balance tracking
- Inter-volunteer cash transfers
- Cash-to-bank deposit recording

### Banking
- Bank account management with opening balances
- Per-account transaction statements
- Running balance views across all accounts

### Donor Management
- Donor records with contact information
- Per-donor donation history

### Reporting & Forecasting
- CSV export for donations, expenses, balances, and drive summaries
- Financial projections with drive runway calculator
- Dashboard with summary charts

### Platform
- Dark/light mode toggle
- Responsive sidebar navigation
- Suspense skeleton loading on every page
- Soft deletes throughout (full audit trail)

## Tech Stack

| Technology | Role |
|---|---|
| **Next.js 15** (App Router) | Framework, server components, server actions |
| **React 19** | UI with `useActionState` for form handling |
| **TypeScript 5** | Type safety |
| **Supabase** | Auth (password-based) + PostgreSQL database |
| **Tailwind CSS 3.4** | Utility-first styling |
| **shadcn/ui** (New York) | Component library (Radix UI primitives) |
| **Zod v4** | Schema validation with discriminated unions |
| **React Hook Form** | Form state management |
| **Recharts** | Dashboard and reporting charts |
| **@react-pdf/renderer** | PDF export |
| **date-fns** | Date formatting and manipulation |
| **Sonner** | Toast notifications |
| **Lucide React** | Icons |
| **next-themes** | Dark/light mode |

## Architecture Overview

### Server/Client Split

Every protected page follows a two-component pattern:

- **Server component** (`page.tsx`) — fetches data via server actions, wrapped in `<Suspense>` with skeleton fallbacks
- **Client component** (`*-client.tsx`) — receives data as props, handles forms, dialogs, and toasts

### Central Ledger

All financial transactions flow through a single `ledger_entries` table with a `type` discriminator: `donation_bank`, `donation_cash`, `expense_bank`, `expense_cash`, `cash_transfer`, `cash_deposit`. Zod schemas use discriminated unions matching these types.

### Server Actions

Each action in `lib/actions/` follows a consistent pattern:
1. Validate input with Zod
2. Create a fresh Supabase server client
3. Check auth via `supabase.auth.getClaims()` (JWT-based, no network round-trip)
4. Perform the database operation
5. Call `revalidatePath()` to refresh the page

### Database Views

Four PostgreSQL views provide computed summaries:
- `bank_account_balances` — current balance per bank account
- `volunteer_cash_balances` — cash balance per volunteer
- `budget_vs_actual` — budgeted vs. spent amounts by category and drive
- `drive_financial_summary` — donations, expenses, and remaining budget per drive

### Auth Flow

Supabase password auth with middleware (`proxy.ts`) that refreshes sessions and redirects unauthenticated users to `/auth/login`.

## Project Structure

```
app/
├── auth/                    # Login, sign-up, password reset
│   ├── login/
│   ├── sign-up/
│   ├── forgot-password/
│   └── update-password/
├── protected/               # Authenticated routes
│   ├── page.tsx             # Dashboard
│   ├── bank-accounts/       # Bank account list + [id] detail
│   ├── cash/                # Cash management & transfers
│   ├── donations/           # Donation ledger
│   ├── donors/              # Donor list + [id] history
│   ├── drives/              # Drive/cause list + [id] detail
│   ├── expenses/            # Expense ledger
│   ├── projections/         # Financial forecasting
│   ├── reports/             # CSV exports & summaries
│   └── settings/            # Categories & currencies
lib/
├── actions/                 # Server actions (one file per domain)
├── schemas/                 # Zod validation schemas
├── supabase/                # Supabase client factories
├── types/                   # TypeScript type definitions
├── utils.ts                 # Utility functions
└── format.ts                # Formatting helpers
components/
├── ui/                      # shadcn/ui components
├── app-sidebar.tsx          # Main navigation sidebar
└── theme-switcher.tsx       # Dark/light mode toggle
hooks/
└── use-mobile.ts            # Responsive breakpoint hook
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project with the required schema

### Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd next-finance-portal
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file from the example:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in your Supabase credentials:

   | Variable | Description |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable (or anon) key |

5. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be running at [localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `ledger_entries` | Central ledger — all donations, expenses, transfers, and deposits |
| `bank_accounts` | Bank account records with opening balances |
| `donors` | Donor contact information |
| `causes` | Drives/events with type, date, location, headcount |
| `budget_items` | Per-drive budget line items with categories |
| `drive_templates` | Reusable budget templates for recurring drives |
| `expense_categories` | Configurable expense categories |
| `currencies` | Supported currencies with exchange rates to PKR |
| `profiles` | User/volunteer profiles |
| `expense_drive_allocations` | Expense-to-drive allocation tracking |

### Database Views

| View | Purpose |
|---|---|
| `bank_account_balances` | Computed balance per bank account (opening + deposits - withdrawals) |
| `volunteer_cash_balances` | Computed cash balance per volunteer (received - sent - spent - deposited) |
| `budget_vs_actual` | Budgeted vs. actual spending by category and drive |
| `drive_financial_summary` | Total budget, donations, expenses, and remaining per drive |

## License

Private project. All rights reserved.
