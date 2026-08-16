create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  plan            text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id       text,
  stripe_subscription_id   text,
  -- Free plan: lifetime cap, never reset. 3 full Senior UX Reviews, ever,
  -- per account. Performance + Accessibility are unlimited regardless and
  -- don't touch this counter.
  full_audits_used_lifetime  integer not null default 0,
  -- Premium plan only: recurring weekly cap, resets every Monday UTC.
  audits_used_this_period    integer not null default 0,
  period_start                timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists audits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  url          text not null,
  tier         text not null check (tier in ('automated-only', 'full')),
  created_at   timestamptz not null default now()
);

create index if not exists idx_audits_user_id on audits(user_id);
