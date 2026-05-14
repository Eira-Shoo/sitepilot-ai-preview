-- SitePilot AI / Eira Web Studio — initial schema
-- Run in Supabase SQL editor or supabase db push

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  business_name text,
  industry text,
  status text not null default 'draft',
  language text not null default 'en',
  package_type text,
  blueprint jsonb,
  published_slug text unique,
  custom_domain text,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_published_slug_idx on public.projects (published_slug);

alter table public.projects enable row level security;

create policy "projects_select_owner_admin"
  on public.projects for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or (status = 'published' and published_slug is not null)
  );

create policy "projects_insert_owner"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_owner_admin"
  on public.projects for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "projects_delete_owner_admin"
  on public.projects for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Project inputs
create table if not exists public.project_inputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  form_data jsonb,
  google_place_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_inputs_project_id_idx on public.project_inputs (project_id);

alter table public.project_inputs enable row level security;

create policy "project_inputs_select"
  on public.project_inputs for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

create policy "project_inputs_insert"
  on public.project_inputs for insert
  with check (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

create policy "project_inputs_update"
  on public.project_inputs for update
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

create policy "project_inputs_delete"
  on public.project_inputs for delete
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  stripe_session_id text unique,
  stripe_customer_id text,
  amount integer not null default 0,
  currency text not null default 'eur',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_project_id_idx on public.payments (project_id);

alter table public.payments enable row level security;

create policy "payments_select_owner_admin"
  on public.payments for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "payments_insert_owner"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "payments_update_admin"
  on public.payments for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Contact submissions
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_project_id_idx on public.contact_submissions (project_id);

alter table public.contact_submissions enable row level security;

create policy "contact_submissions_select_owner_admin"
  on public.contact_submissions for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

-- Inserts handled via service role in API (no public insert policy)

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_name text not null,
  page_path text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_project_id_idx on public.analytics_events (project_id);

alter table public.analytics_events enable row level security;

create policy "analytics_select_owner_admin"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

-- AI recommendations
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recommendation_type text,
  title text not null,
  description text,
  priority text default 'medium',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists ai_recommendations_project_id_idx on public.ai_recommendations (project_id);

alter table public.ai_recommendations enable row level security;

create policy "ai_recommendations_select_owner_admin"
  on public.ai_recommendations for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

create policy "ai_recommendations_write_admin"
  on public.ai_recommendations for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "ai_recommendations_update_owner_admin"
  on public.ai_recommendations for update
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

-- Assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_url text not null,
  file_type text,
  alt_text text,
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "assets_all_owner_admin"
  on public.assets for all
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (
          pr.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    )
  );

-- Auto profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
