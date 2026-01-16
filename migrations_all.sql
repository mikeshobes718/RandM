-- sql017
create table if not exists reps (
  id uuid primary key default gen_random_uuid(),
  uid text unique references users(uid) on delete cascade,
  name text not null,
  email text unique not null,
  whatsapp text,
  payment_method text,
  payment_id text,
  status text not null default 'trial',
  start_date timestamptz default now(),
  tracking_code text unique not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  type text not null,
  amount numeric not null,
  earned_date timestamptz default now(),
  status text not null default 'pending',
  paid_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  amount numeric not null,
  date_paid timestamptz default now(),
  method text,
  reference text,
  commission_ids uuid[],
  created_at timestamptz default now()
);

create table if not exists admin_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leads add column if not exists assigned_to uuid references reps(id) on delete set null;
alter table leads add column if not exists status text default 'fresh';
alter table leads add column if not exists last_contact timestamptz;

alter table customers add column if not exists closed_by uuid references reps(id) on delete set null;
alter table customers add column if not exists plan text;
alter table customers add column if not exists mrr numeric;
alter table customers add column if not exists signed_up_date timestamptz;
alter table customers add column if not exists status text default 'trial';
alter table customers add column if not exists stripe_customer_id text;
alter table customers add column if not exists notes text;

-- sql018
alter table leads add column if not exists times_called integer default 0;
alter table leads add column if not exists last_called_at timestamptz;
alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null;
alter table leads add column if not exists call_status text default 'fresh';
alter table leads add column if not exists next_followup date;
alter table leads add column if not exists lead_notes text;

create table if not exists call_log (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  timestamp timestamptz default now(),
  outcome text not null,
  notes text,
  followup_date date,
  created_at timestamptz default now()
);

create index if not exists call_log_rep_id_idx on call_log(rep_id);
create index if not exists call_log_lead_id_idx on call_log(lead_id);
create index if not exists call_log_timestamp_idx on call_log(timestamp);
