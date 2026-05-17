create table if not exists public.reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  target_date date not null,
  total_pending_pages integer not null default 0,
  pages_per_day integer not null default 0,
  status text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_plans_name_not_blank check (length(trim(name)) > 0),
  constraint reading_plans_dates_valid check (target_date >= start_date),
  constraint reading_plans_totals_valid check (
    total_pending_pages >= 0
    and pages_per_day >= 0
  ),
  constraint reading_plans_status_valid check (status in ('activo', 'completado', 'pausado'))
);

create table if not exists public.reading_plan_books (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.reading_plans(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  pending_pages_at_start integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint reading_plan_books_pending_valid check (pending_pages_at_start >= 0),
  constraint reading_plan_books_unique unique (plan_id, book_id)
);

create table if not exists public.reading_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.reading_plans(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day_date date not null,
  target_pages integer not null default 0,
  cumulative_target_pages integer not null default 0,
  created_at timestamptz not null default now(),
  constraint reading_plan_days_pages_valid check (
    target_pages >= 0
    and cumulative_target_pages >= 0
  ),
  constraint reading_plan_days_unique unique (plan_id, day_date)
);

create index if not exists reading_plans_user_id_idx
on public.reading_plans(user_id);

create index if not exists reading_plans_user_status_idx
on public.reading_plans(user_id, status);

create index if not exists reading_plan_books_plan_id_idx
on public.reading_plan_books(plan_id);

create index if not exists reading_plan_books_book_id_idx
on public.reading_plan_books(book_id);

create index if not exists reading_plan_days_plan_date_idx
on public.reading_plan_days(plan_id, day_date);

drop trigger if exists reading_plans_set_updated_at on public.reading_plans;
create trigger reading_plans_set_updated_at
before update on public.reading_plans
for each row
execute function public.set_updated_at();

create or replace function public.ensure_reading_plan_book_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_owner uuid;
  book_owner uuid;
begin
  select user_id into plan_owner
  from public.reading_plans
  where id = new.plan_id;

  select user_id into book_owner
  from public.books
  where id = new.book_id;

  if plan_owner is null then
    raise exception 'El plan indicado no existe.';
  end if;

  if book_owner is null then
    raise exception 'El libro indicado no existe.';
  end if;

  if new.user_id <> plan_owner or new.user_id <> book_owner then
    raise exception 'El plan y sus libros deben pertenecer al mismo usuario.';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_plan_books_ensure_owner on public.reading_plan_books;
create trigger reading_plan_books_ensure_owner
before insert or update on public.reading_plan_books
for each row
execute function public.ensure_reading_plan_book_owner();

create or replace function public.ensure_reading_plan_day_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_owner uuid;
begin
  select user_id into plan_owner
  from public.reading_plans
  where id = new.plan_id;

  if plan_owner is null then
    raise exception 'El plan indicado no existe.';
  end if;

  if new.user_id <> plan_owner then
    raise exception 'El cronograma debe pertenecer al mismo usuario que el plan.';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_plan_days_ensure_owner on public.reading_plan_days;
create trigger reading_plan_days_ensure_owner
before insert or update on public.reading_plan_days
for each row
execute function public.ensure_reading_plan_day_owner();

alter table public.reading_plans enable row level security;
alter table public.reading_plan_books enable row level security;
alter table public.reading_plan_days enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.reading_plans to authenticated;
grant select, insert, update, delete on public.reading_plan_books to authenticated;
grant select, insert, update, delete on public.reading_plan_days to authenticated;

drop policy if exists "reading_plans_select_own" on public.reading_plans;
create policy "reading_plans_select_own"
on public.reading_plans
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_plans_insert_own" on public.reading_plans;
create policy "reading_plans_insert_own"
on public.reading_plans
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reading_plans_update_own" on public.reading_plans;
create policy "reading_plans_update_own"
on public.reading_plans
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reading_plans_delete_own" on public.reading_plans;
create policy "reading_plans_delete_own"
on public.reading_plans
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_plan_books_select_own" on public.reading_plan_books;
create policy "reading_plan_books_select_own"
on public.reading_plan_books
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_plan_books_insert_own" on public.reading_plan_books;
create policy "reading_plan_books_insert_own"
on public.reading_plan_books
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.reading_plans
    where reading_plans.id = reading_plan_books.plan_id
      and reading_plans.user_id = auth.uid()
  )
  and exists (
    select 1 from public.books
    where books.id = reading_plan_books.book_id
      and books.user_id = auth.uid()
  )
);

drop policy if exists "reading_plan_books_update_own" on public.reading_plan_books;
create policy "reading_plan_books_update_own"
on public.reading_plan_books
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reading_plan_books_delete_own" on public.reading_plan_books;
create policy "reading_plan_books_delete_own"
on public.reading_plan_books
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_plan_days_select_own" on public.reading_plan_days;
create policy "reading_plan_days_select_own"
on public.reading_plan_days
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_plan_days_insert_own" on public.reading_plan_days;
create policy "reading_plan_days_insert_own"
on public.reading_plan_days
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.reading_plans
    where reading_plans.id = reading_plan_days.plan_id
      and reading_plans.user_id = auth.uid()
  )
);

drop policy if exists "reading_plan_days_update_own" on public.reading_plan_days;
create policy "reading_plan_days_update_own"
on public.reading_plan_days
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reading_plan_days_delete_own" on public.reading_plan_days;
create policy "reading_plan_days_delete_own"
on public.reading_plan_days
for delete
to authenticated
using (user_id = auth.uid());
