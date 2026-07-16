create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.email()), '') in (
    'sedmonebo27@gmail.com',
    'marko.crepulja007@gmail.com'
  );
$$;

create table if not exists public.daily_recaps (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null,
  date date not null,
  title text not null,
  start_location text,
  end_location text,
  sleeping_location text,
  country text,
  latitude double precision,
  longitude double precision,
  distance_km numeric,
  short_text text,
  fatigue_rating integer check (fatigue_rating between 1 and 5),
  marin_fatigue_rating integer check (marin_fatigue_rating between 1 and 5),
  marko_fatigue_rating integer check (marko_fatigue_rating between 1 and 5),
  highlight_of_the_day text,
  problem_of_the_day text,
  is_rest_day boolean not null default false,
  special_milestone_type text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recap_images (
  id uuid primary key default gen_random_uuid(),
  recap_id uuid not null references public.daily_recaps(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.current_locations (
  id uuid primary key default gen_random_uuid(),
  latitude double precision not null,
  longitude double precision not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.map_events (
  id uuid primary key default gen_random_uuid(),
  emoji text not null,
  title text not null,
  description text,
  location_name text,
  country text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.map_event_images (
  id uuid primary key default gen_random_uuid(),
  map_event_id uuid not null references public.map_events(id) on delete cascade,
  image_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  recap_id uuid not null references public.daily_recaps(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 180),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  recap_id uuid not null references public.daily_recaps(id) on delete cascade,
  emoji text not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  unique (recap_id, emoji)
);

create table if not exists public.wall_notes (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 180),
  note_color text,
  x_position numeric,
  y_position numeric,
  rotation numeric,
  drawing_data jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.trip_settings (
  id integer primary key default 1 check (id = 1),
  planned_total_km numeric not null default 1500,
  current_country text,
  countries_visited integer not null default 0,
  border_crossings integer not null default 0,
  donation_goal numeric not null default 1500,
  donation_raised numeric not null default 0,
  donation_url text,
  updated_at timestamptz not null default now()
);

insert into public.trip_settings (id, planned_total_km, donation_goal, donation_raised)
values (1, 1500, 1500, 0)
on conflict (id) do nothing;

create index if not exists daily_recaps_status_date_idx on public.daily_recaps(status, date desc);
create index if not exists daily_recaps_day_number_idx on public.daily_recaps(day_number);
create index if not exists recap_images_recap_sort_idx on public.recap_images(recap_id, sort_order);
create index if not exists current_locations_created_idx on public.current_locations(created_at desc);
create index if not exists map_events_created_idx on public.map_events(created_at desc);
create index if not exists comments_recap_status_idx on public.comments(recap_id, status, created_at desc);
create index if not exists wall_notes_public_idx on public.wall_notes(status, expires_at desc);

drop trigger if exists set_daily_recaps_updated_at on public.daily_recaps;
create trigger set_daily_recaps_updated_at before update on public.daily_recaps
for each row execute function public.set_updated_at();

drop trigger if exists set_map_events_updated_at on public.map_events;
create trigger set_map_events_updated_at before update on public.map_events
for each row execute function public.set_updated_at();

drop trigger if exists set_reactions_updated_at on public.reactions;
create trigger set_reactions_updated_at before update on public.reactions
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_settings_updated_at on public.trip_settings;
create trigger set_trip_settings_updated_at before update on public.trip_settings
for each row execute function public.set_updated_at();

alter table public.daily_recaps enable row level security;
alter table public.recap_images enable row level security;
alter table public.current_locations enable row level security;
alter table public.map_events enable row level security;
alter table public.map_event_images enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.wall_notes enable row level security;
alter table public.trip_settings enable row level security;

create policy "Public can read published recaps"
on public.daily_recaps for select
using (status = 'published' or public.is_admin());

create policy "Admins manage recaps"
on public.daily_recaps for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read published recap images"
on public.recap_images for select
using (
  exists (
    select 1 from public.daily_recaps
    where daily_recaps.id = recap_images.recap_id
      and (daily_recaps.status = 'published' or public.is_admin())
  )
);

create policy "Admins manage recap images"
on public.recap_images for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read latest locations"
on public.current_locations for select
using (true);

create policy "Admins manage current locations"
on public.current_locations for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read map events"
on public.map_events for select
using (true);

create policy "Admins manage map events"
on public.map_events for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read map event images"
on public.map_event_images for select
using (true);

create policy "Admins manage map event images"
on public.map_event_images for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can insert pending comments"
on public.comments for insert
with check (status = 'pending');

create policy "Public can read approved comments"
on public.comments for select
using (status = 'approved' or public.is_admin());

create policy "Admins manage comments"
on public.comments for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read reactions"
on public.reactions for select
using (true);

create policy "Public can insert reaction counters"
on public.reactions for insert
with check (count >= 0);

create policy "Public can update reaction counters"
on public.reactions for update
using (true)
with check (count >= 0);

create policy "Public can insert pending wall notes"
on public.wall_notes for insert
with check (status = 'pending' and expires_at > now());

create policy "Public can read approved live wall notes"
on public.wall_notes for select
using ((status = 'approved' and expires_at > now()) or public.is_admin());

create policy "Admins manage wall notes"
on public.wall_notes for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read trip settings"
on public.trip_settings for select
using (true);

create policy "Admins manage trip settings"
on public.trip_settings for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('recap-images', 'recap-images', true),
  ('map-event-images', 'map-event-images', true),
  ('wall-drawings', 'wall-drawings', true),
  ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "Public can read project storage"
on storage.objects for select
using (bucket_id in ('recap-images', 'map-event-images', 'wall-drawings', 'site-assets'));

create policy "Admins can upload project storage"
on storage.objects for insert
with check (bucket_id in ('recap-images', 'map-event-images', 'wall-drawings', 'site-assets') and public.is_admin());

create policy "Admins can update project storage"
on storage.objects for update
using (bucket_id in ('recap-images', 'map-event-images', 'wall-drawings', 'site-assets') and public.is_admin())
with check (bucket_id in ('recap-images', 'map-event-images', 'wall-drawings', 'site-assets') and public.is_admin());

create policy "Admins can delete project storage"
on storage.objects for delete
using (bucket_id in ('recap-images', 'map-event-images', 'wall-drawings', 'site-assets') and public.is_admin());
