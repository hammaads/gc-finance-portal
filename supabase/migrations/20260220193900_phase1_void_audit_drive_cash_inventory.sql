-- Phase 1 foundation migration
-- Non-destructive changes only.

-- 1) Reversible void metadata on core soft-deletable tables
alter table public.ledger_entries
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.causes
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.budget_items
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.bank_accounts
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.donors
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.expense_categories
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

alter table public.drive_templates
  add column if not exists void_reason text,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id),
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references public.profiles(id);

-- 2) Global audit log table (app-level writes)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id),
  table_name text not null,
  record_id uuid,
  action text not null check (
    action = any (
      array[
        'create'::text,
        'update'::text,
        'void'::text,
        'restore'::text,
        'consume'::text,
        'transfer'::text,
        'adjust'::text
      ]
    )
  ),
  reason text,
  previous_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_table_record_idx
  on public.audit_events(table_name, record_id, occurred_at desc);

alter table public.audit_events enable row level security;

drop policy if exists "Authenticated users full access to audit_events" on public.audit_events;
create policy "Authenticated users full access to audit_events"
  on public.audit_events
  as permissive
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select, insert, update, delete on table public.audit_events to authenticated, service_role;

-- 3) Inventory history table
create table if not exists public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id),
  item_key text not null,
  item_name text not null,
  change_type text not null check (
    change_type = any (
      array[
        'received'::text,
        'used'::text,
        'adjusted'::text,
        'void_reversal'::text,
        'restored'::text,
        'transfer'::text
      ]
    )
  ),
  source text not null check (
    source = any (
      array[
        'donation'::text,
        'expense'::text,
        'drive_consumption'::text,
        'manual'::text
      ]
    )
  ),
  delta_qty numeric not null,
  reference_table text,
  reference_id uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists inventory_history_item_key_created_idx
  on public.inventory_history(item_key, created_at desc);

alter table public.inventory_history enable row level security;

drop policy if exists "Authenticated users full access to inventory_history" on public.inventory_history;
create policy "Authenticated users full access to inventory_history"
  on public.inventory_history
  as permissive
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select, insert, update, delete on table public.inventory_history to authenticated, service_role;

-- 4) Drive model evolution (backward compatible)
alter table public.causes
  add column if not exists number_of_daigs integer,
  add column if not exists expected_attendees integer,
  add column if not exists actual_attendees integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'causes_number_of_daigs_positive'
      and conrelid = 'public.causes'::regclass
  ) then
    alter table public.causes
      add constraint causes_number_of_daigs_positive
      check (number_of_daigs is null or number_of_daigs > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'causes_expected_attendees_non_negative'
      and conrelid = 'public.causes'::regclass
  ) then
    alter table public.causes
      add constraint causes_expected_attendees_non_negative
      check (expected_attendees is null or expected_attendees >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'causes_actual_attendees_non_negative'
      and conrelid = 'public.causes'::regclass
  ) then
    alter table public.causes
      add constraint causes_actual_attendees_non_negative
      check (actual_attendees is null or actual_attendees >= 0);
  end if;
end $$;

update public.causes
set expected_attendees = expected_headcount
where expected_attendees is null
  and expected_headcount is not null;

-- 5) Cash flow extension: add bank -> volunteer transaction type
alter table public.ledger_entries
  drop constraint if exists ledger_entries_type_check;

alter table public.ledger_entries
  add constraint ledger_entries_type_check
  check (
    type = any (
      array[
        'donation_bank'::text,
        'donation_cash'::text,
        'donation_in_kind'::text,
        'cash_transfer'::text,
        'cash_deposit'::text,
        'cash_withdrawal'::text,
        'expense_bank'::text,
        'expense_cash'::text
      ]
    )
  );

-- 6) Inventory source metadata for consumption logs
alter table public.inventory_consumption
  add column if not exists source_type text,
  add column if not exists notes text;

update public.inventory_consumption ic
set source_type = case
  when le.type = 'donation_in_kind' then 'donated'
  else 'purchased'
end
from public.ledger_entries le
where le.id = ic.ledger_entry_id
  and ic.source_type is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_consumption_source_type_check'
      and conrelid = 'public.inventory_consumption'::regclass
  ) then
    alter table public.inventory_consumption
      add constraint inventory_consumption_source_type_check
      check (source_type = any (array['donated'::text, 'purchased'::text]));
  end if;
end $$;

alter table public.inventory_consumption
  alter column source_type set default 'purchased';

update public.inventory_consumption
set source_type = 'purchased'
where source_type is null;

alter table public.inventory_consumption
  alter column source_type set not null;

-- 7) View updates
create or replace view public.bank_account_balances as
select
  ba.id,
  ba.account_name,
  ba.bank_name,
  ba.currency_id,
  c.code as currency_code,
  c.symbol as currency_symbol,
  ba.opening_balance,
  coalesce(deposits.total_native, 0::numeric) as total_deposits,
  coalesce(withdrawals.total_native, 0::numeric) as total_withdrawals,
  ba.opening_balance + coalesce(deposits.total_native, 0::numeric) - coalesce(withdrawals.total_native, 0::numeric) as balance
from public.bank_accounts ba
join public.currencies c on c.id = ba.currency_id
left join lateral (
  select coalesce(sum(le.amount_pkr), 0::numeric) / nullif(c.exchange_rate_to_pkr, 0::numeric) as total_native
  from public.ledger_entries le
  where le.bank_account_id = ba.id
    and le.type = any (array['donation_bank'::text, 'cash_deposit'::text])
    and le.deleted_at is null
) deposits on true
left join lateral (
  select coalesce(sum(le.amount_pkr), 0::numeric) / nullif(c.exchange_rate_to_pkr, 0::numeric) as total_native
  from public.ledger_entries le
  where le.bank_account_id = ba.id
    and le.type = any (array['expense_bank'::text, 'cash_withdrawal'::text])
    and le.deleted_at is null
) withdrawals on true
where ba.deleted_at is null;

create or replace view public.volunteer_cash_balances as
select
  v.id,
  v.name as display_name,
  coalesce(received.total_pkr, 0::numeric) as total_received_pkr,
  coalesce(sent.total_pkr, 0::numeric) as total_sent_pkr,
  coalesce(deposited.total_pkr, 0::numeric) as total_deposited_pkr,
  coalesce(spent.total_pkr, 0::numeric) as total_spent_pkr,
  coalesce(received.total_pkr, 0::numeric)
    - coalesce(sent.total_pkr, 0::numeric)
    - coalesce(deposited.total_pkr, 0::numeric)
    - coalesce(spent.total_pkr, 0::numeric) as balance_pkr
from public.volunteers v
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.to_user_id = v.id
    and le.type = any (array['donation_cash'::text, 'cash_transfer'::text, 'cash_withdrawal'::text])
    and le.deleted_at is null
) received on true
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.from_user_id = v.id
    and le.type = 'cash_transfer'::text
    and le.deleted_at is null
) sent on true
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.from_user_id = v.id
    and le.type = 'cash_deposit'::text
    and le.deleted_at is null
) deposited on true
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.from_user_id = v.id
    and le.type = 'expense_cash'::text
    and le.deleted_at is null
) spent on true;

create or replace view public.inventory_current as
select
  le.id as ledger_entry_id,
  le.item_name,
  le.quantity as purchased_qty,
  le.unit_price,
  le.currency_id,
  le.exchange_rate_to_pkr,
  le.amount_pkr,
  le.date as purchase_date,
  le.custodian_id as original_custodian_id,
  le.category_id,
  le.quantity - coalesce(consumed.total_consumed, 0::numeric) as available_qty,
  coalesce(consumed.total_consumed, 0::numeric) as consumed_qty,
  regexp_replace(lower(btrim(le.item_name)), '\s+', ' ', 'g') as item_key,
  case
    when le.type = 'donation_in_kind'::text then 'donated'::text
    else 'purchased'::text
  end as source_type
from public.ledger_entries le
left join (
  select inventory_consumption.ledger_entry_id, sum(inventory_consumption.quantity) as total_consumed
  from public.inventory_consumption
  group by inventory_consumption.ledger_entry_id
) consumed on consumed.ledger_entry_id = le.id
where le.type = any (array['expense_bank'::text, 'expense_cash'::text, 'donation_in_kind'::text])
  and (le.cause_id is null or le.type = 'donation_in_kind'::text)
  and le.item_name is not null
  and le.deleted_at is null
  and (le.quantity - coalesce(consumed.total_consumed, 0::numeric)) > 0::numeric;

create or replace view public.drive_financial_summary as
select
  c.id as cause_id,
  c.name as cause_name,
  c.type,
  c.date,
  c.location,
  c.expected_headcount,
  coalesce(budget.total_pkr, 0::numeric) as total_budget_pkr,
  coalesce(spent.total_pkr, 0::numeric) + coalesce(consumed.total_pkr, 0::numeric) as total_spent_pkr,
  coalesce(budget.total_pkr, 0::numeric) - coalesce(spent.total_pkr, 0::numeric) - coalesce(consumed.total_pkr, 0::numeric) as remaining_budget_pkr,
  coalesce(donations.total_pkr, 0::numeric) as total_donations_pkr,
  c.number_of_daigs,
  c.expected_attendees,
  c.actual_attendees
from public.causes c
left join lateral (
  select sum(bi.amount_pkr) as total_pkr
  from public.budget_items bi
  where bi.cause_id = c.id
    and bi.deleted_at is null
) budget on true
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.cause_id = c.id
    and le.type = any (array['expense_bank'::text, 'expense_cash'::text])
    and le.deleted_at is null
) spent on true
left join lateral (
  select sum(ic.total_pkr) as total_pkr
  from public.inventory_consumption ic
  where ic.cause_id = c.id
) consumed on true
left join lateral (
  select sum(le.amount_pkr) as total_pkr
  from public.ledger_entries le
  where le.cause_id = c.id
    and le.type = any (array['donation_bank'::text, 'donation_cash'::text, 'donation_in_kind'::text])
    and le.deleted_at is null
) donations on true
where c.deleted_at is null;

-- Keep grants explicit for API roles
grant select on public.bank_account_balances to authenticated, service_role;
grant select on public.drive_financial_summary to authenticated, service_role;
grant select on public.inventory_current to authenticated, service_role;
grant select on public.volunteer_cash_balances to authenticated, service_role;
