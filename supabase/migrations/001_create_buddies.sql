-- Enable pgcrypto for gen_random_uuid and crypt/gen_salt
create extension if not exists pgcrypto;

-- Buddies table
create table public.buddies (
  id uuid primary key default gen_random_uuid(),
  username text unique not null check (
    length(username) between 3 and 20
    and username ~ '^[a-z0-9-]+$'
  ),
  secret_token text not null,
  github_username text,
  github_verified boolean not null default false,
  name text not null,
  personality text not null,
  hatched_at bigint not null,
  species text not null,
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  eye text not null,
  hat text not null,
  shiny boolean not null default false,
  stats jsonb not null,
  total_stats int generated always as (
    (stats->>'DEBUGGING')::int +
    (stats->>'PATIENCE')::int +
    (stats->>'CHAOS')::int +
    (stats->>'WISDOM')::int +
    (stats->>'SNARK')::int
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for leaderboard sorting
create index idx_buddies_total_stats on public.buddies (total_stats desc);
create index idx_buddies_rarity on public.buddies (rarity);
create index idx_buddies_species on public.buddies (species);

-- RLS: enable but allow public reads (excluding secret_token)
alter table public.buddies enable row level security;

-- Public read policy
create policy "Anyone can read buddies"
  on public.buddies for select
  using (true);

-- Block direct inserts/updates — all mutations go through RPC
create policy "No direct inserts"
  on public.buddies for insert
  with check (false);

create policy "No direct updates"
  on public.buddies for update
  using (false);

-- View that excludes secret_token for public queries
create view public.buddies_public as
  select
    id, username, github_username, github_verified,
    name, personality, hatched_at, species, rarity, eye, hat, shiny,
    stats, total_stats, created_at, updated_at
  from public.buddies;

-- RPC function for submit/update
create or replace function public.submit_buddy(
  p_username text,
  p_token text default null,
  p_github_username text default null,
  p_github_verified boolean default false,
  p_name text,
  p_personality text,
  p_hatched_at bigint,
  p_species text,
  p_rarity text,
  p_eye text,
  p_hat text,
  p_shiny boolean default false,
  p_stats jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  raw_token text;
  hashed_token text;
  existing record;
begin
  -- Check if username exists
  select * into existing from public.buddies where username = p_username;

  if existing is null then
    -- New submission: generate token
    raw_token := encode(gen_random_bytes(32), 'hex');
    hashed_token := crypt(raw_token, gen_salt('bf'));

    insert into public.buddies (
      username, secret_token, github_username, github_verified,
      name, personality, hatched_at, species, rarity, eye, hat, shiny, stats
    ) values (
      p_username, hashed_token, p_github_username, p_github_verified,
      p_name, p_personality, p_hatched_at, p_species, p_rarity,
      p_eye, p_hat, p_shiny, p_stats
    );

    return jsonb_build_object('token', raw_token, 'created', true);

  else
    -- Existing: verify token
    if p_token is null or existing.secret_token != crypt(p_token, existing.secret_token) then
      raise exception 'invalid_token: Token does not match';
    end if;

    update public.buddies set
      github_username = p_github_username,
      github_verified = p_github_verified,
      name = p_name,
      personality = p_personality,
      hatched_at = p_hatched_at,
      species = p_species,
      rarity = p_rarity,
      eye = p_eye,
      hat = p_hat,
      shiny = p_shiny,
      stats = p_stats,
      updated_at = now()
    where username = p_username;

    return jsonb_build_object('updated', true);
  end if;
end;
$$;

-- Grant anon access to the RPC
grant execute on function public.submit_buddy to anon;
grant select on public.buddies_public to anon;
