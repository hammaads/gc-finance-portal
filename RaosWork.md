# Raos Work Log

---

## Searchable Donor Dropdown

Replaced the donor dropdown with a searchable combobox plus inline quick-add—search, select, or add donors without leaving the form. New `DonorCombobox` (Popover + Command) filters by name; shows add form when no match. Search is exact substring only; fuzzy search (Fuse.js) could be added for typos and alternate spellings. Files: `donor-combobox.tsx`, `donations-client.tsx`, `lib/actions/donors.ts`.

---

## Bank balance via app function (multi-currency fix)

Bank account balances were wrong when donations were in foreign currency (e.g. 100 USD at 300 PKR showed as Rs 100,100 instead of Rs 130,000). The database view `bank_account_balances` summed the raw `amount` column instead of `amount_pkr`, so it treated 100 USD as 100. We fixed this in app code: `getBankAccountBalances()` now fetches bank accounts (with currency and exchange rate) and ledger entries (with `amount_pkr` only), then in JavaScript sums deposits and withdrawals in PKR, adds opening balance (converted to PKR using the account’s currency rate), and converts the result back to the account’s currency for display. All pages that showed bank balances (Bank Accounts, Dashboard, Reports, Projections) now call this function instead of querying the view.

**Why not fix the view?** The view could be changed to use `SUM(amount_pkr)` (and convert opening_balance to/from PKR for non-PKR accounts) and that would fix the bug without app changes. We avoided DB changes because of the project rule (no schema/view edits) and because keeping the logic in the app makes it easier to change and debug later. If the view is ever updated to use `amount_pkr`, the app can switch back to querying it. A small hydration fix was also added for the Bank Accounts page: Radix Dialog is only rendered after the component mounts so server and client HTML match (no `aria-controls` ID mismatch). Files: `lib/actions/bank-accounts.ts`, `app/protected/page.tsx`, `app/protected/reports/page.tsx`, `app/protected/projections/page.tsx`, `app/protected/dashboard-content.tsx`, `app/protected/reports/reports-client.tsx`, `app/protected/projections/projections-client.tsx`, `app/protected/bank-accounts/bank-accounts-client.tsx`.
