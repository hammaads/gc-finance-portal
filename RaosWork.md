# Raos Work Log

---

## Searchable Donor Combobox

Replaced the donor dropdown with a searchable combobox plus inline quick-add—search, select, or add donors without leaving the form. New `DonorCombobox` (Popover + Command) filters by name; shows add form when no match. Search is exact substring only; fuzzy search (Fuse.js) could be added for typos and alternate spellings. Files: `donor-combobox.tsx`, `donations-client.tsx`, `lib/actions/donors.ts`.
