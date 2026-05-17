create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text not null,
  genre text not null default '',
  status text not null default 'pendiente',
  priority text not null default 'media',
  total_pages integer not null default 0,
  current_page integer not null default 0,
  started_at date,
  finished_at date,
  notes text not null default '',
  percentage_read integer generated always as (
    case
      when total_pages > 0 then least(100, greatest(0, round((current_page::numeric / total_pages::numeric) * 100)::integer))
      else 0
    end
  ) stored,
  pages_remaining integer generated always as (
    greatest(total_pages - current_page, 0)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_title_not_blank check (length(trim(title)) > 0),
  constraint books_author_not_blank check (length(trim(author)) > 0),
  constraint books_status_valid check (status in ('pendiente', 'leyendo', 'terminado', 'pausado', 'abandonado')),
  constraint books_priority_valid check (priority in ('baja', 'media', 'alta')),
  constraint books_pages_valid check (total_pages >= 0 and current_page >= 0 and current_page <= total_pages),
  constraint books_finished_after_started check (
    finished_at is null
    or started_at is null
    or finished_at >= started_at
  )
);

create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists books_user_status_idx on public.books(user_id, status);
create index if not exists books_user_genre_idx on public.books(user_id, genre);
create index if not exists books_user_priority_idx on public.books(user_id, priority);
create index if not exists books_user_updated_at_idx on public.books(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

alter table public.books enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.books to authenticated;

drop policy if exists "books_select_own" on public.books;
create policy "books_select_own"
on public.books
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own"
on public.books
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own"
on public.books
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own"
on public.books
for delete
to authenticated
using (user_id = auth.uid());
