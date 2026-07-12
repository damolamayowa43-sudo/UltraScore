create table if not exists public.matches (
  id bigint primary key,
  league text not null,
  home_team text not null,
  away_team text not null,
  home_score int not null default 0,
  away_score int not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming','live','finished')),
  display_time text not null default 'TBD',
  kickoff timestamptz default now(),
  source text not null default 'manual',
  updated_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "Public can read matches" on public.matches for select using (true);
create policy "Authenticated admins can insert" on public.matches for insert to authenticated with check (true);
create policy "Authenticated admins can update" on public.matches for update to authenticated using (true) with check (true);
create policy "Authenticated admins can delete" on public.matches for delete to authenticated using (true);
alter publication supabase_realtime add table public.matches;
