-- GC-AUDIT-001 / GC-FIN-002: void_reason for soft-deleted ledger entries (donations, expenses, etc.)
-- Run this migration when ready; app code expects this column to exist for void flows.
ALTER TABLE ledger_entries
ADD COLUMN IF NOT EXISTS void_reason text;

COMMENT ON COLUMN ledger_entries.void_reason IS 'Required reason when entry is voided (deleted_at set).';
