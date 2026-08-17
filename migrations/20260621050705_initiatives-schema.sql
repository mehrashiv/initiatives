-- Tables

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        text not null default 'user' check (role in ('admin','user')),
  created_at  timestamptz not null default now()
);

create table public.initiatives (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) <= 80),
  category    text,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_by  uuid not null references public.profiles(id),
  owner       uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  initiative_id  uuid not null references public.initiatives(id) on delete cascade,
  name           text not null check (char_length(name) <= 80),
  status         text not null default 'active' check (status in ('active','inactive')),
  created_by     uuid not null references public.profiles(id),
  owner          uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  name           text not null,
  status         text not null default 'to_do'
                 check (status in ('to_do','in_progress','blocked','delayed','done')),
  start_date     date,
  end_date       date,
  delivery_date  date,
  progress       int not null default 0 check (progress between 0 and 100),
  blocker_owner  text,
  ai_summary     jsonb,
  created_by     uuid not null references public.profiles(id),
  owner          uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  kind        text not null
              check (kind in ('created','status','owner','progress','completed','flag','note')),
  who         uuid not null references public.profiles(id),
  text        text not null,
  edited      boolean not null default false,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Indexes (FKs and every column referenced by an RLS policy below)

create index idx_initiatives_owner on public.initiatives(owner);
create index idx_initiatives_created_by on public.initiatives(created_by);

create index idx_projects_initiative_id on public.projects(initiative_id);
create index idx_projects_owner on public.projects(owner);
create index idx_projects_created_by on public.projects(created_by);

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_owner on public.tasks(owner);
create index idx_tasks_created_by on public.tasks(created_by);

create index idx_activities_task_id on public.activities(task_id);
create index idx_activities_who on public.activities(who);

-- Admin helper (security definer: called from RLS policies on initiatives/projects/tasks)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select role = 'admin' from public.profiles where id = auth.uid()
$$;

-- RLS: profiles

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;

create policy "profiles select authenticated" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles update own row" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;

-- RLS: initiatives

alter table public.initiatives enable row level security;
revoke all on public.initiatives from anon;

create policy "initiatives select authenticated" on public.initiatives
  for select to authenticated
  using (true);

create policy "initiatives insert own" on public.initiatives
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "initiatives update creator owner or admin" on public.initiatives
  for update to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()))
  with check (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

create policy "initiatives delete creator owner or admin" on public.initiatives
  for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

grant select, insert, update, delete on public.initiatives to authenticated;

-- RLS: projects

alter table public.projects enable row level security;
revoke all on public.projects from anon;

create policy "projects select authenticated" on public.projects
  for select to authenticated
  using (true);

create policy "projects insert own" on public.projects
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "projects update creator owner or admin" on public.projects
  for update to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()))
  with check (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

create policy "projects delete creator owner or admin" on public.projects
  for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

grant select, insert, update, delete on public.projects to authenticated;

-- RLS: tasks

alter table public.tasks enable row level security;
revoke all on public.tasks from anon;

create policy "tasks select authenticated" on public.tasks
  for select to authenticated
  using (true);

create policy "tasks insert own" on public.tasks
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "tasks update creator owner or admin" on public.tasks
  for update to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()))
  with check (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

create policy "tasks delete creator owner or admin" on public.tasks
  for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()) or owner = (select auth.uid()));

grant select, insert, update, delete on public.tasks to authenticated;

-- RLS: activities

alter table public.activities enable row level security;
revoke all on public.activities from anon;

create policy "activities select authenticated" on public.activities
  for select to authenticated
  using (true);

create policy "activities insert own" on public.activities
  for insert to authenticated
  with check (who = (select auth.uid()));

-- Scoped to kind = 'note', not who = auth.uid(): RLS filters rows before the
-- enforce_note_update_columns trigger below ever runs, so any signed-in user
-- must be able to reach a note row to pin it. System kinds get no UPDATE
-- policy at all, so they stay fully immutable regardless of this one.
create policy "activities update notes only" on public.activities
  for update to authenticated
  using (kind = 'note')
  with check (kind = 'note');

create policy "activities delete own notes" on public.activities
  for delete to authenticated
  using (kind = 'note' and who = (select auth.uid()));

grant select, insert, update, delete on public.activities to authenticated;

-- Auto-create a profile row when an InsForge auth user is created
-- (covers both admin-created dashboard accounts and any future signup path)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.profile->>'name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard profiles.role: only an admin may change it through the authenticated
-- app API. auth.uid() IS NULL means this is a trusted raw-SQL/CLI context
-- (e.g. the first-admin bootstrap via `db query`), which is allowed through.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'only an admin can change role';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- Notes: anyone may toggle pinned, only the author may edit text
create or replace function public.enforce_note_update_columns()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if old.who <> auth.uid() then
    if new.text <> old.text or new.edited <> old.edited then
      raise exception 'only the author can edit a note''s text';
    end if;
  end if;
  return new;
end;
$$;

create trigger note_pin_or_author_edit
  before update on public.activities
  for each row execute function public.enforce_note_update_columns();

-- updated_at maintenance

create trigger initiatives_updated_at
  before update on public.initiatives
  for each row execute function system.update_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function system.update_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function system.update_updated_at();
