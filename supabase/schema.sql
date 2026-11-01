-- Crime Diaries accounts. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Collects as little as possible: the account itself (email, sign-in provider, kept by Supabase Auth)
-- and a record of each time the user accepted the terms and privacy policy. Nothing else.

-- 1. Consent records: proof that a user confirmed they are 18+ and accepted given versions of the documents.
create table if not exists public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  terms_version text not null check (length(terms_version) between 1 and 40),
  privacy_version text not null check (length(privacy_version) between 1 and 40),
  age_confirmed boolean not null check (age_confirmed),
  accepted_at timestamptz not null default now()
);
create index if not exists consents_user_idx on public.consents (user_id);

-- the server sets the time and the user: a browser cannot backdate a record or file one for someone else
create or replace function public.consents_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := auth.uid();
  new.accepted_at := now();
  return new;
end $$;
drop trigger if exists consents_stamp on public.consents;
create trigger consents_stamp before insert on public.consents for each row execute function public.consents_stamp();

-- row level security: users read and add only their own records; nobody can edit or delete one
-- (a record disappears only with its account, through "on delete cascade")
alter table public.consents enable row level security;
drop policy if exists "read own consents" on public.consents;
create policy "read own consents" on public.consents for select to authenticated using (user_id = auth.uid());
drop policy if exists "add own consent" on public.consents;
create policy "add own consent" on public.consents for insert to authenticated with check (user_id = auth.uid());
revoke all on public.consents from anon;
grant select, insert on public.consents to authenticated;

-- 2. Delete my account: removes the signed-in user and, by cascade, all their records.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 3. Retention limits, as promised in privacy.html. Needs the pg_cron extension
--    (Database > Extensions > pg_cron > enable), then run this part.
create extension if not exists pg_cron;
-- sign-ups never confirmed by email: deleted after 7 days
select cron.schedule('cd-delete-unconfirmed', '15 3 * * *',
  $$delete from auth.users where email_confirmed_at is null and created_at < now() - interval '7 days'$$);
-- accounts not used for 3 years: deleted (every Sunday)
select cron.schedule('cd-delete-inactive', '30 3 * * 0',
  $$delete from auth.users where coalesce(last_sign_in_at, created_at) < now() - interval '3 years'$$);
