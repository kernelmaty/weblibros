create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  session_date date not null default current_date,
  start_page integer not null,
  end_page integer not null,
  notes text not null default '',
  pages_read integer generated always as (
    greatest(end_page - start_page, 0)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_sessions_pages_valid check (
    start_page >= 0
    and end_page >= start_page
  )
);

create index if not exists reading_sessions_user_id_idx
on public.reading_sessions(user_id);

create index if not exists reading_sessions_book_id_idx
on public.reading_sessions(book_id);

create index if not exists reading_sessions_user_date_idx
on public.reading_sessions(user_id, session_date desc);

drop trigger if exists reading_sessions_set_updated_at on public.reading_sessions;
create trigger reading_sessions_set_updated_at
before update on public.reading_sessions
for each row
execute function public.set_updated_at();

create or replace function public.ensure_reading_session_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  total integer;
begin
  select books.user_id, books.total_pages
  into owner_id, total
  from public.books
  where books.id = new.book_id;

  if owner_id is null then
    raise exception 'El libro indicado no existe.';
  end if;

  if owner_id <> new.user_id then
    raise exception 'La sesión debe pertenecer al mismo usuario que el libro.';
  end if;

  if total <= 0 then
    raise exception 'El libro debe tener total de páginas para registrar sesiones.';
  end if;

  if total > 0 and new.end_page > total then
    raise exception 'La página final no puede superar el total de páginas del libro.';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_sessions_ensure_owner on public.reading_sessions;
create trigger reading_sessions_ensure_owner
before insert or update on public.reading_sessions
for each row
execute function public.ensure_reading_session_owner();

create or replace function public.apply_reading_session_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_book_id uuid;
  max_page integer;
begin
  affected_book_id = coalesce(new.book_id, old.book_id);

  select coalesce(max(end_page), 0)
  into max_page
  from public.reading_sessions
  where book_id = affected_book_id;

  update public.books
  set
    current_page = least(
      total_pages,
      greatest(current_page, max_page)
    ),
    status = case
      when total_pages > 0 and least(total_pages, greatest(current_page, max_page)) >= total_pages
        then 'terminado'
      when status = 'pendiente' and max_page > 0
        then 'leyendo'
      else status
    end,
    finished_at = case
      when total_pages > 0 and least(total_pages, greatest(current_page, max_page)) >= total_pages
        then coalesce(finished_at, current_date)
      else finished_at
    end
  where id = affected_book_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists reading_sessions_apply_progress on public.reading_sessions;
create trigger reading_sessions_apply_progress
after insert or update or delete on public.reading_sessions
for each row
execute function public.apply_reading_session_progress();

alter table public.reading_sessions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.reading_sessions to authenticated;

drop policy if exists "reading_sessions_select_own" on public.reading_sessions;
create policy "reading_sessions_select_own"
on public.reading_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reading_sessions_insert_own" on public.reading_sessions;
create policy "reading_sessions_insert_own"
on public.reading_sessions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.books
    where books.id = reading_sessions.book_id
      and books.user_id = auth.uid()
  )
);

drop policy if exists "reading_sessions_update_own" on public.reading_sessions;
create policy "reading_sessions_update_own"
on public.reading_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.books
    where books.id = reading_sessions.book_id
      and books.user_id = auth.uid()
  )
);

drop policy if exists "reading_sessions_delete_own" on public.reading_sessions;
create policy "reading_sessions_delete_own"
on public.reading_sessions
for delete
to authenticated
using (user_id = auth.uid());
