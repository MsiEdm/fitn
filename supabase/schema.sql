-- Run once in the Supabase SQL Editor for project nyaloaqczwgcaoamytml.
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('COURSE', 'STRENGTH', 'CYCLING', 'SWIMMING', 'YOGA', 'OTHER')),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  calories_burned integer not null check (calories_burned between 0 and 10000),
  workout_date date not null,
  notes text not null default '' check (char_length(notes) <= 280),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  start_value numeric(12, 2) not null check (start_value between 0 and 1000000),
  target_value numeric(12, 2) not null check (target_value between 0.1 and 1000000),
  current_value numeric(12, 2) not null check (current_value between 0 and 1000000),
  unit text not null check (char_length(trim(unit)) between 1 and 12),
  deadline date not null,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx on public.workouts (user_id, workout_date desc);
create index if not exists goals_user_deadline_idx on public.goals (user_id, deadline);

alter table public.workouts enable row level security;
alter table public.goals enable row level security;

drop policy if exists "Users manage their own workouts" on public.workouts;
create policy "Users manage their own workouts" on public.workouts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users manage their own goals" on public.goals;
create policy "Users manage their own goals" on public.goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.workouts, public.goals to authenticated;
