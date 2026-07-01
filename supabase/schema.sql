-- GradnjaPlan initial Supabase schema
-- Run this in Supabase SQL editor.
-- Assumes Supabase Auth is enabled.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_type text not null default 'house_new_build',
  start_date date not null,
  target_end_date date,
  scheduling_mode text not null default 'forward',
  currency text not null default 'EUR',
  contingency_percent numeric not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  share_percent numeric not null default 0,
  email text,
  note text
);

create table if not exists public.funding_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  available_amount numeric not null default 0,
  available_from date not null,
  investor_id uuid references public.investors(id) on delete set null,
  note text
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_code text,
  code text not null,
  name text not null,
  type text not null,
  duration_days integer not null default 0,
  start_date date,
  end_date date,
  dependencies jsonb not null default '[]'::jsonb,
  progress_percent numeric not null default 0,
  status text not null default 'planned',
  default_funding_source_type text,
  sort_order integer not null default 0,
  optional_key text,
  included boolean not null default true,
  unique(project_id, code)
);

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_code text not null,
  name text not null,
  supplier text,
  status text not null default 'estimate',
  estimated_amount numeric not null default 0,
  contracted_amount numeric,
  actual_amount numeric,
  vat_rate numeric,
  amount_includes_vat boolean not null default true,
  default_funding_source_type text,
  payment_rule_code text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  cost_item_id uuid not null references public.cost_items(id) on delete cascade,
  task_code text not null,
  name text not null,
  planned_date date not null,
  planned_amount numeric not null default 0,
  actual_date date,
  actual_amount numeric,
  funding_source_type text,
  status text not null default 'planned'
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.investors enable row level security;
alter table public.funding_sources enable row level security;
alter table public.tasks enable row level security;
alter table public.cost_items enable row level security;
alter table public.payment_events enable row level security;

-- Profiles
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- Projects
create policy "Users can view own projects"
on public.projects for select
using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id
    and pm.user_id = auth.uid()
  )
);

create policy "Users can insert own projects"
on public.projects for insert
with check (owner_user_id = auth.uid());

create policy "Users can update own projects"
on public.projects for update
using (owner_user_id = auth.uid());

create policy "Users can delete own projects"
on public.projects for delete
using (owner_user_id = auth.uid());

-- Helper policies for child tables:
-- User may access child records if they own the parent project or are a member.

create policy "Users can access project_members for own projects"
on public.project_members for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_user_id = auth.uid()
  )
);

create policy "Users can access investors for allowed projects"
on public.investors for all
using (
  exists (
    select 1 from public.projects p
    where p.id = investors.project_id
    and (
      p.owner_user_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
        and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = investors.project_id
    and p.owner_user_id = auth.uid()
  )
);

create policy "Users can access funding sources for allowed projects"
on public.funding_sources for all
using (
  exists (
    select 1 from public.projects p
    where p.id = funding_sources.project_id
    and (
      p.owner_user_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
        and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = funding_sources.project_id
    and p.owner_user_id = auth.uid()
  )
);

create policy "Users can access tasks for allowed projects"
on public.tasks for all
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
    and (
      p.owner_user_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
        and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
    and p.owner_user_id = auth.uid()
  )
);

create policy "Users can access cost items for allowed projects"
on public.cost_items for all
using (
  exists (
    select 1 from public.projects p
    where p.id = cost_items.project_id
    and (
      p.owner_user_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
        and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = cost_items.project_id
    and p.owner_user_id = auth.uid()
  )
);

create policy "Users can access payment events for allowed projects"
on public.payment_events for all
using (
  exists (
    select 1 from public.projects p
    where p.id = payment_events.project_id
    and (
      p.owner_user_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
        and pm.user_id = auth.uid()
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = payment_events.project_id
    and p.owner_user_id = auth.uid()
  )
);
