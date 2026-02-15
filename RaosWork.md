# Raos Work Log

---

## Searchable Donor Dropdown

Replaced the donor dropdown with a searchable combobox plus inline quick-add—search, select, or add donors without leaving the form. New `DonorCombobox` (Popover + Command) filters by name; shows add form when no match. Search is exact substring only; fuzzy search (Fuse.js) could be added for typos and alternate spellings. Files: `donor-combobox.tsx`, `donations-client.tsx`, `lib/actions/donors.ts`.

---

## Bank balance via app function (multi-currency fix)

Bank account balances were wrong when donations were in foreign currency (e.g. 100 USD at 300 PKR showed as Rs 100,100 instead of Rs 30,000). The database view `bank_account_balances` summed the raw `amount` column instead of `amount_pkr`, so it treated 100 USD as 100. We fixed this in app code: `getBankAccountBalances()` now fetches bank accounts (with currency and exchange rate) and ledger entries (with `amount_pkr` only), then in JavaScript sums deposits and withdrawals in PKR, adds opening balance (converted to PKR using the account’s currency rate), and converts the result back to the account’s currency for display. All pages that showed bank balances (Bank Accounts, Dashboard, Reports, Projections) now call this function instead of querying the view.

**Why not fix the view?** The view could be changed to use `SUM(amount_pkr)` (and convert opening_balance to/from PKR for non-PKR accounts) and that would fix the bug without app changes. We avoided DB changes because of the project rule (no schema/view edits) and because keeping the logic in the app makes it easier to change and debug later. If the view is ever updated to use `amount_pkr`, the app can switch back to querying it.

---

## Volunteer transaction history and soft delete

**Why:** You couldn’t see which transactions made up a volunteer’s cash balance, and there was no way to remove a wrong transfer or deposit (e.g. duplicate or wrong amount). That made it hard to reconcile and fix mistakes.

**What we did:** On the Cash Management page, each volunteer’s name is now a link. Click it to open a page that lists all that volunteer’s cash activity: donations they received, expenses they paid, transfers to or from other volunteers, and deposits they made to the bank. Each row shows the date, type, PKR value, whether money came in or went out, and who the other party was. Every row has a delete (trash) button. When you delete, we ask for confirmation (same as on Donations and Expenses). The transaction is then hidden from the system—balances and reports recalculate without it—so you can correct errors without breaking the numbers.

**Limitation:** There is no “undo.” If you delete by mistake, you have to add the transaction again. The layout and labels match the Donations view (e.g. “PKR Value” as the third column) so it feels consistent.

**Files:** `app/protected/cash/[volunteerId]/page.tsx`, `app/protected/cash/[volunteerId]/volunteer-transactions-client.tsx`, `app/protected/cash/cash-client.tsx`, `lib/actions/cash.ts`, `lib/actions/ledger.ts`.

---

## Budget Templates

**Why:** Every iftaar drive needs a budget—items like biryani, dates and the amounts often depend on headcount (e.g. 100 people per biryani pot). Setting that up from scratch each time was tedious and error‑prone.

**What we did:** Go to Settings → Templates. You can create reusable budget templates with a name and multiple items. Each item has a description, category (searchable dropdown), price per unit, people per unit and currency. Items can be **variable** (quantity = headcount ÷ people per unit) or **fixed** (always 1 unit, e.g. rent). Example: Biryani pot, Rs 20,000 per pot, 100 people per pot. For 500 people: 500 ÷ 100 = 5 pots → Rs 100,000. Edit and delete templates from the same tab. When you add a drive, you pick a template and it fills the budget for you then you can tweak or add items before saving. Budget updates in real-time as you change the headcount when creating a drive. 

**Limitation:** Templates are only used when creating a new drive. Editing a drive loads its stored budget items; changing headcount there does not recalculate variable items (they stay as saved quantities). The schema restricts us: `budget_items` stores only quantity and unit price, not "people per unit"—so we can't recalculate from a formula when editing.

**Files:** `app/protected/settings/settings-client.tsx`, `lib/actions/budget.ts`, `lib/schemas/templates.ts`, `components/ui/category-combobox.tsx`, `components/ui/radio-group.tsx`.

---

## Drive Planner and Projections enhancements

**Why:** You could see upcoming scheduled drives and their budgets, but had no way to plan beyond that—how many additional drives can we afford with leftover funds? What if we plan for 200 people instead of 150? The Projections page only showed the runway for scheduled drives.

**What we did:** Added a **Drive Planner** section that answers "how far can our funds go?" Pick a budget template and adjust the headcount with a slider (50 to 1,000 people). The planner instantly shows: cost per drive based on that template, how many drives you can afford with remaining funds, and what's left over after those drives. You see a full breakdown table with all items—variable items (like biryani pots) adjust quantity based on headcount, fixed items stay at 1 unit—along with unit prices and totals. A progress bar shows what percentage of your remaining funds would be used. This lets you model different scenarios: "If we do 5 more drives at 300 people each, will we have enough? What if we change to 250 people?" We also added four summary cards at the top of Projections (Current Funds, Upcoming Drives, Committed Funds, Remaining After Drives) so you see the key numbers at a glance—same layout as the Dashboard. Finally, fixed calculation errors in the Drive Runway table so overspent drives don't incorrectly add money back to your balance.

**Limitation:** The planner uses templates, so you need at least one template created in Settings. It shows how many drives you can afford but doesn't schedule them—you still create drives manually.

**Files:** `app/protected/projections/projections-client.tsx`, `app/protected/projections/page.tsx`, `components/ui/slider.tsx`.

---


