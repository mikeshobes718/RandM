-- sql014
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique not null,
  name text not null,
  address text,
  rating numeric,
  review_count integer default 0,
  business_type text,
  city text,
  state text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists leads_city_type_idx on leads(city, business_type);

-- sql015
alter table leads add column if not exists phone text;
alter table leads add column if not exists google_maps_url text;
alter table leads add column if not exists website text;

-- sql016
alter table businesses add column if not exists website text;

-- sql017
create table if not exists reps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  whatsapp text,
  payment_method text check (payment_method in ('Wise', 'Payoneer')),
  payment_id text,
  status text not null default 'trial' check (status in ('trial', 'active', 'inactive', 'dropped')),
  start_date timestamptz default now(),
  tracking_code text unique not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leads add column if not exists assigned_to uuid references reps(id) on delete set null;
alter table leads add column if not exists status text default 'fresh' check (status in ('fresh', 'called', 'follow-up', 'closed', 'dead'));
alter table leads add column if not exists last_contact timestamptz;

alter table businesses add column if not exists closed_by uuid references reps(id) on delete set null;
alter table businesses add column if not exists notes text;

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  type text not null check (type in ('close', 'month2', 'month3', 'bonus')),
  amount numeric not null,
  earned_date timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid')),
  paid_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  amount numeric not null,
  date_paid timestamptz default now(),
  method text check (method in ('Wise', 'Payoneer')),
  reference text,
  commission_ids uuid[],
  created_at timestamptz default now()
);

create table if not exists admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into admin_settings (key, value) values 
('commission_structure', '{"first_close_percent": 100, "month2_retention_percent": 25, "month3_retention_percent": 25, "bonus_10_closes": 100, "bonus_20_closes": 250}'::jsonb)
on conflict (key) do nothing;

-- sql018
alter table leads add column if not exists times_called integer default 0;
alter table leads add column if not exists last_called_at timestamptz;
alter table leads add column if not exists last_called_by uuid references reps(id) on delete set null;
alter table leads add column if not exists call_status text default 'fresh' 
  check (call_status in ('fresh', 'no answer', 'callback', 'not interested', 'closed'));
alter table leads add column if not exists next_followup date;
alter table leads add column if not exists lead_notes text;

create table if not exists call_log (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references reps(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  timestamp timestamptz default now(),
  outcome text not null check (outcome in ('no answer', 'left vm', 'spoke to dm', 'not interested', 'closed')),
  notes text,
  followup_date date,
  created_at timestamptz default now()
);

create index if not exists call_log_rep_id_idx on call_log(rep_id);
create index if not exists call_log_lead_id_idx on call_log(lead_id);
create index if not exists call_log_timestamp_idx on call_log(timestamp);
