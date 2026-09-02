-- Moon Training - persistent backend schema (Phase 2)
-- Plain Postgres. Designed to be portable: works on Supabase, Vercel Postgres,
-- or Moon's own infra with no vendor-specific features, so it can be handed
-- off to engineering and re-hosted without a rewrite.
--
-- Replaces the localStorage moonTrainingV1 blob with per-user server state.
-- moon_rock_events is the source of truth for balance (append-only ledger,
-- never update/delete a row) - the current balance is always derivable by
-- summing it, which makes the leaderboard and any future audit trivial.

create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text unique not null,        -- Auth0 subject, e.g. "email|abc123"
  email text unique not null,
  name text,
  franchise text,                        -- which franchise/location (for the 72-franchise rollout)
  created_at timestamptz not null default now()
);

create table moon_rock_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,               -- positive = earned, negative = spent
  reason text not null,                  -- 'daily_login' | 'quiz1' | 'puzzle' | 'trivia' | 'uat_completion' | 'shop_purchase:coffee' | ...
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index moon_rock_events_user_id_idx on moon_rock_events(user_id);

create table achievements (
  user_id uuid not null references users(id) on delete cascade,
  achievement_id text not null,          -- matches the existing data-eid values: 'quiz1','day1','puzzle-2026-08-24', etc.
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table closet_state (
  user_id uuid primary key references users(id) on delete cascade,
  streak integer not null default 1,
  visits integer not null default 1,
  last_visit date not null default current_date,
  updated_at timestamptz not null default now(),
  -- Per-section Layout drag-and-drop state (the "8 Real 3D" closet's
  -- Customize panel): a plain {sectionIndex: layoutId} JSON map, e.g.
  -- {"0": "longHung", "1": "shelvesStack"} - the section-scoped sibling of
  -- the whole-closet equippedLayout, which is derived from shop_purchases
  -- timestamps instead (see api/state.js's equippedSkins()) and has no way
  -- to represent "section 0 got X, section 1 got Y" from a purchase log
  -- alone. Written by api/shop-buy.js when a buy includes a sectionIndex.
  layout_by_section jsonb not null default '{}'
);

create table shop_purchases (
  user_id uuid not null references users(id) on delete cascade,
  item_id text not null,                 -- matches SHOP[].id in index.html
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- One row per Lyssna usability-test completion. lyssna_test_id is whatever
-- custom variable Lyssna's redirect passes back (see the Lyssna integration
-- note) - kept nullable/free-text so it works before that's finalized.
create table uat_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lyssna_test_id text,
  completed_at timestamptz not null default now()
);

create view user_balances as
  select user_id, coalesce(sum(amount), 0) as tokens
  from moon_rock_events
  group by user_id;

-- Flat, pre-joined view for the leaderboard API - avoids relying on
-- PostgREST's relationship embedding across a view (user_balances has no
-- foreign-key metadata for it to detect), so the API can do one plain select.
--
-- lifetime_earned (sum of positive events only) backs the rocks-milestone
-- badges - it's deliberately separate from `tokens` (current spendable
-- balance), since spending in the shop would otherwise make an "earned 100
-- rocks" badge disappear again.
--
-- lifetime_spent (sum of negative events, as a positive number) is what the
-- closet leaderboard actually ranks by - whoever has put the most rocks into
-- their closet ranks first, not whoever is sitting on the biggest unspent
-- balance.
create or replace view leaderboard as
  select u.id as user_id, u.name, u.email,
         coalesce(b.tokens, 0) as tokens,
         coalesce(c.streak, 0) as streak,
         coalesce(c.visits, 1) as visits,
         coalesce(e.lifetime_earned, 0) as lifetime_earned,
         coalesce(s.lifetime_spent, 0) as lifetime_spent
  from users u
  left join user_balances b on b.user_id = u.id
  left join closet_state c on c.user_id = u.id
  left join (
    select user_id, sum(amount) as lifetime_earned
    from moon_rock_events
    where amount > 0
    group by user_id
  ) e on e.user_id = u.id
  left join (
    select user_id, -sum(amount) as lifetime_spent
    from moon_rock_events
    where amount < 0
    group by user_id
  ) s on s.user_id = u.id;

-- Monthly raffle (Phase 3): real, backend-persisted entries shared across
-- every pilot user - replaces the old cosmetic "Shop" tab. `month` is a
-- 'YYYY-MM' period key. Enrolling spends a fixed cost (see
-- api/_lib/raffle.js) via a normal moon_rock_events row
-- (reason 'raffle_enroll:<month>') and inserts one row here - deliberately
-- no unique constraint on (user_id, month), since multiple paid entries per
-- person per month are allowed (each one is one more chance to win).
create table raffle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month text not null,
  created_at timestamptz not null default now()
);
create index raffle_entries_month_idx on raffle_entries(month);

-- One winner per month, drawn once by an admin (see
-- api/admin/raffle-draw.js) from that month's raffle_entries - recorded
-- permanently here rather than re-rolled live every time someone asks who
-- won.
create table raffle_winners (
  month text primary key,
  entry_id uuid not null references raffle_entries(id),
  user_id uuid not null references users(id),
  drawn_at timestamptz not null default now()
);

-- ── Migration: per-section Layout drag-and-drop (run this against the
-- ALREADY-PROVISIONED pilot database - the `create table closet_state`
-- above only takes effect on a brand new project, per this file's own
-- "run once" setup note in SETUP.md). Additive and safe to run twice
-- (`if not exists` guards it) - existing rows just get the column with its
-- default `{}`, no data loss.
alter table closet_state add column if not exists layout_by_section jsonb not null default '{}';
