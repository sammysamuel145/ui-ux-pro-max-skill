-- Typed parents and an optional public price.
--
-- sire_name / dam_name: a parent can be typed in by hand, for example a gecko
-- GeckoDan does not list. sire_id / dam_id still link to a listed gecko when
-- the typed name or ID matches one.
--
-- price_idr: the price in rupiah, shown on the site next to geckos that are
-- not sold, and used to sort the catalogue. It is optional. It follows the
-- existing row policies: public only for published, unarchived geckos, and
-- writable by admins only.

alter table public.geckos
  add column sire_name text check (char_length(sire_name) <= 120),
  add column dam_name text check (char_length(dam_name) <= 120),
  add column price_idr bigint check (price_idr is null or (price_idr > 0 and price_idr <= 100000000000));
