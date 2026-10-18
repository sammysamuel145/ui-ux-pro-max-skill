-- GeckoDan initial schema.
--
-- Security model
--   * Every table has Row Level Security enabled.
--   * Visitors (anon and signed-in non-admins) can only read published content.
--   * Only users listed in public.admin_users can write. There is no public way to
--     become an admin: rows in admin_users are inserted by the owner with SQL or
--     the service role, never by the application.
--   * Prices are intentionally not stored anywhere.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.gecko_status as enum ('available', 'reserved', 'sold');
create type public.gecko_visibility as enum ('for_sale', 'showcase', 'both');
create type public.gecko_sex as enum ('male', 'female', 'unknown');

-- ---------------------------------------------------------------------------
-- Admin membership
-- ---------------------------------------------------------------------------

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Owner-managed allowlist of dashboard users. Insert rows with SQL or the service role only.';

-- security definer so policies can check membership without exposing the table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Signature lines
-- ---------------------------------------------------------------------------

create table public.signature_lines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  tagline text check (char_length(tagline) <= 200),
  description text check (char_length(description) <= 8000),
  cover_photo_path text,
  cover_photo_alt text check (char_length(cover_photo_alt) <= 300),
  sort_order integer not null default 0,
  published boolean not null default false,
  seo_title text check (char_length(seo_title) <= 120),
  seo_description text check (char_length(seo_description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger signature_lines_updated_at
  before update on public.signature_lines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Geckos
-- ---------------------------------------------------------------------------

create table public.geckos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9-]{0,31}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  morph text check (char_length(morph) <= 200),
  line_id uuid references public.signature_lines (id) on delete set null,
  description text check (char_length(description) <= 8000),
  sex public.gecko_sex not null default 'unknown',
  hatch_date date,
  weight_grams numeric(6, 1) check (weight_grams is null or (weight_grams > 0 and weight_grams < 1000)),
  lineage text check (char_length(lineage) <= 4000),
  sire_id uuid references public.geckos (id) on delete set null,
  dam_id uuid references public.geckos (id) on delete set null,
  status public.gecko_status not null default 'available',
  visibility public.gecko_visibility not null default 'for_sale',
  featured boolean not null default false,
  published boolean not null default false,
  archived boolean not null default false,
  seo_title text check (char_length(seo_title) <= 120),
  seo_description text check (char_length(seo_description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sire_id is null or sire_id <> id),
  check (dam_id is null or dam_id <> id)
);

create index geckos_public_idx on public.geckos (published, archived, visibility, status);
create index geckos_line_idx on public.geckos (line_id);

create trigger geckos_updated_at
  before update on public.geckos
  for each row execute function public.set_updated_at();

-- A gecko is public when it is published and not archived.
create or replace function public.gecko_is_public(gecko_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.geckos g
    where g.id = gecko_id and g.published and not g.archived
  );
$$;

revoke all on function public.gecko_is_public(uuid) from public;
grant execute on function public.gecko_is_public(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Gecko photos
-- ---------------------------------------------------------------------------

create table public.gecko_photos (
  id uuid primary key default gen_random_uuid(),
  gecko_id uuid not null references public.geckos (id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^geckos/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|avif)$'),
  alt text not null default '' check (char_length(alt) <= 300),
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now()
);

create index gecko_photos_gecko_idx on public.gecko_photos (gecko_id, sort_order);
create unique index gecko_photos_one_cover on public.gecko_photos (gecko_id) where is_cover;

-- ---------------------------------------------------------------------------
-- Awards
-- ---------------------------------------------------------------------------

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  event_name text check (char_length(event_name) <= 200),
  organizer text check (char_length(organizer) <= 200),
  award_year integer check (award_year between 1990 and 2100),
  placement text check (char_length(placement) <= 120),
  gecko_id uuid references public.geckos (id) on delete set null,
  description text check (char_length(description) <= 4000),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  evidence_path text,
  verified boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An award can only be published once it is verified and has evidence.
  constraint awards_publish_requires_evidence check (
    not published or (verified and (evidence_url is not null or evidence_path is not null))
  )
);

create trigger awards_updated_at
  before update on public.awards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Testimonials (kept separate from Google Reviews)
-- ---------------------------------------------------------------------------

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_location text check (char_length(author_location) <= 120),
  body text not null check (char_length(body) between 1 and 4000),
  source text not null default 'direct' check (source in ('direct', 'whatsapp', 'instagram', 'facebook', 'tiktok', 'tokopedia', 'other')),
  permission_granted boolean not null default false,
  permission_note text check (char_length(permission_note) <= 500),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_publish_requires_permission check (not published or permission_granted)
);

create trigger testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------------

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 4000),
  category text not null default 'general' check (category in ('general', 'purchase', 'shipping', 'care')),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faqs_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Site settings (hero, business info, socials, story, shipping, SEO)
-- ---------------------------------------------------------------------------

create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.signature_lines enable row level security;
alter table public.geckos enable row level security;
alter table public.gecko_photos enable row level security;
alter table public.awards enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;

-- admin_users: a signed-in user may see only their own row. No client writes.
create policy "admin_users: read own row" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

-- signature_lines
create policy "signature_lines: public read published" on public.signature_lines
  for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "signature_lines: admin insert" on public.signature_lines
  for insert to authenticated with check ((select public.is_admin()));
create policy "signature_lines: admin update" on public.signature_lines
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "signature_lines: admin delete" on public.signature_lines
  for delete to authenticated using ((select public.is_admin()));

-- geckos
create policy "geckos: public read published" on public.geckos
  for select to anon, authenticated
  using ((published and not archived) or (select public.is_admin()));
create policy "geckos: admin insert" on public.geckos
  for insert to authenticated with check ((select public.is_admin()));
create policy "geckos: admin update" on public.geckos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "geckos: admin delete" on public.geckos
  for delete to authenticated using ((select public.is_admin()));

-- gecko_photos
create policy "gecko_photos: public read for public geckos" on public.gecko_photos
  for select to anon, authenticated
  using (public.gecko_is_public(gecko_id) or (select public.is_admin()));
create policy "gecko_photos: admin insert" on public.gecko_photos
  for insert to authenticated with check ((select public.is_admin()));
create policy "gecko_photos: admin update" on public.gecko_photos
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "gecko_photos: admin delete" on public.gecko_photos
  for delete to authenticated using ((select public.is_admin()));

-- awards: only verified and published awards are public.
create policy "awards: public read verified" on public.awards
  for select to anon, authenticated
  using ((published and verified) or (select public.is_admin()));
create policy "awards: admin insert" on public.awards
  for insert to authenticated with check ((select public.is_admin()));
create policy "awards: admin update" on public.awards
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "awards: admin delete" on public.awards
  for delete to authenticated using ((select public.is_admin()));

-- testimonials: only published with permission are public.
create policy "testimonials: public read permitted" on public.testimonials
  for select to anon, authenticated
  using ((published and permission_granted) or (select public.is_admin()));
create policy "testimonials: admin insert" on public.testimonials
  for insert to authenticated with check ((select public.is_admin()));
create policy "testimonials: admin update" on public.testimonials
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "testimonials: admin delete" on public.testimonials
  for delete to authenticated using ((select public.is_admin()));

-- faqs
create policy "faqs: public read published" on public.faqs
  for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "faqs: admin insert" on public.faqs
  for insert to authenticated with check ((select public.is_admin()));
create policy "faqs: admin update" on public.faqs
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "faqs: admin delete" on public.faqs
  for delete to authenticated using ((select public.is_admin()));

-- site_settings
create policy "site_settings: public read public keys" on public.site_settings
  for select to anon, authenticated
  using (is_public or (select public.is_admin()));
create policy "site_settings: admin insert" on public.site_settings
  for insert to authenticated with check ((select public.is_admin()));
create policy "site_settings: admin update" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "site_settings: admin delete" on public.site_settings
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still applies on top of these)
-- ---------------------------------------------------------------------------

revoke all on public.admin_users from anon;
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_users from authenticated;

-- ---------------------------------------------------------------------------
-- Storage: one public-read bucket for media, admin-only writes.
-- Object names use random UUIDs, so unpublished photos are not discoverable.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin list" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Starting content: the three signature line names and the business details
-- supplied by the owner. No gecko records, awards, testimonials or FAQs are
-- seeded: those must come from the owner.
-- ---------------------------------------------------------------------------

insert into public.signature_lines (slug, name, sort_order, published) values
  ('mantra', 'MANTRA', 1, true),
  ('kafka', 'KAFKA', 2, true),
  ('valkrie', 'VALKRIE', 3, true);

insert into public.site_settings (key, value) values
  ('business', jsonb_build_object(
    'brand', 'GeckoDan',
    'location', 'Pamulang, South Tangerang, Indonesia',
    'whatsapp_number', '6285174413278',
    'maps_url', 'https://share.google/djs93Utk6ol35s2kV',
    'google_reviews_url', '',
    'google_write_review_url', '',
    'experience_years', 10,
    'experience_text', ''
  )),
  ('socials', jsonb_build_object(
    'facebook', 'https://www.facebook.com/share/1C2cfuuTPd/?mibextid=wwXIfr',
    'instagram', 'https://www.instagram.com/geck_dan?vrfl=M24zYnlqMXZhMDFv',
    'tiktok', 'https://www.tiktok.com/@geckodan_?_r=1&_t=ZS-9AeXmIbtv5Z',
    'youtube', 'https://youtube.com/@joreptile?si=hS67ZZWEuqj8zZTC',
    'tokopedia', 'https://tk.tokopedia.com/ZSg6qxxMf/'
  )),
  ('hero', jsonb_build_object(
    'eyebrow', 'Premium Gecko Breeder',
    'headline', 'A Decade of Passion.',
    'tagline', 'A Legacy in Every Line.',
    'body', 'More than 10 years in the gecko world, bringing quality, character and dedication to every generation.',
    'cta_label', 'Explore Our Geckos',
    'cta_href', '/geckos',
    'image_path', '',
    'image_alt', '',
    'image_is_concept', true
  )),
  ('story', jsonb_build_object(
    'title', 'Our Story',
    'body', '',
    'signature', ''
  )),
  ('shipping', jsonb_build_object(
    'body', ''
  )),
  ('seo', jsonb_build_object(
    'site_title', 'GeckoDan',
    'default_description', 'GeckoDan, a premium leopard gecko breeder in Pamulang, South Tangerang. See the geckos available and ask directly on WhatsApp.',
    'og_image_path', ''
  ));
