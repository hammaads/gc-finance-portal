-- GC-DRV-001: Number of daigs replaces expected headcount for drives
ALTER TABLE causes
ADD COLUMN IF NOT EXISTS number_of_daigs integer;

COMMENT ON COLUMN causes.number_of_daigs IS 'GC-DRV-001: Replaces expected_headcount for drive variable budget.';

-- Optional: backfill from expected_headcount so existing drives keep behavior
-- UPDATE causes SET number_of_daigs = expected_headcount WHERE type = 'drive' AND number_of_daigs IS NULL AND expected_headcount IS NOT NULL;
