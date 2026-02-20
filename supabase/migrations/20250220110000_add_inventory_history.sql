-- GC-INV-003: Inventory history (audit trail per item)
-- Run when ready; app code will use this for History view.
CREATE TABLE IF NOT EXISTS inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_entry_id uuid REFERENCES ledger_entries(id),
  item_name text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('received', 'used', 'adjusted')),
  delta integer NOT NULL,
  source text NOT NULL CHECK (source IN ('donation', 'expense', 'drive_consumption', 'manual')),
  reference_id uuid,
  notes text,
  quantity_after numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_inventory_history_ledger_entry ON inventory_history(ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_item_name ON inventory_history(lower(trim(item_name)));
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);

COMMENT ON TABLE inventory_history IS 'GC-INV-003: Audit trail for inventory quantity changes (source, reference, used for).';
