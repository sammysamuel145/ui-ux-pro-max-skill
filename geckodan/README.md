# GeckoDan website

Website for GeckoDan, a leopard gecko breeder in Pamulang, Tangerang Selatan.
Public catalog, collection, signature lines, story, achievements, reviews, FAQ,
shipping and contact pages, with every purchase inquiry sent to WhatsApp, and
an owner-only admin dashboard.

- Next.js 16 (App Router, TypeScript), React 19
- Supabase: Postgres with Row Level Security, Auth (email and password), Storage
- No prices are stored or shown anywhere. Buyers ask on WhatsApp.

## Routes

| Public | |
| --- | --- |
| `/` | Hero, available geckos, lines, collection, story, achievements, reviews, FAQ, contact |
| `/geckos` | Searchable, filterable catalog of for-sale geckos |
| `/geckos/[slug]` | Gecko detail, gallery, record, lineage, WhatsApp inquiry |
| `/showcase` | Collection geckos |
| `/lines/mantra`, `/lines/kafka`, `/lines/valkrie` | Signature lines |
| `/our-story`, `/achievements`, `/reviews`, `/faq`, `/shipping`, `/contact` | Content pages |

| Admin (not indexed) | |
| --- | --- |
| `/admin` | Sign in |
| `/admin/dashboard` | Overview, then geckos and photos, lines, awards, testimonials, FAQ, site settings |

## How security works

- There is no sign-up page, and Supabase sign-ups are turned off. The owner's
  account is created by hand and added to the `admin_users` table.
- `src/proxy.ts` refreshes the session and turns away visitors without one.
  Every dashboard page and Server Action then calls `requireAdmin()`, which
  checks the user and the `is_admin()` database function.
- All admin reads, writes and uploads run as the signed-in user with the public
  anon key, so Row Level Security and Storage policies decide what is allowed.
  The service-role key is not used by the app at all.
- The public site uses the anon key and only sees published content: published,
  unarchived geckos and their photos; verified awards with evidence;
  testimonials with customer permission.
- The database itself refuses to publish an award without verification and
  evidence, or a testimonial without permission.
- Uploads are limited to JPG, PNG, WebP and AVIF up to 8 MB. The server checks
  the file's real bytes, and the bucket repeats the type and size limits.
- The `media` bucket is public-read, so anyone with an image URL can open it.
  File names are random UUIDs, so unpublished photos cannot be guessed.

## Local development

Requirements: Node 20+, Docker, and the Supabase CLI (installed as a dev
dependency).

```bash
npm install
npx supabase start          # local Postgres, Auth, Storage, API
npx supabase status -o env  # shows the local API_URL and ANON_KEY
cp .env.example .env.local  # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

`supabase start` applies `supabase/migrations/` automatically. To reset the
local database: `npx supabase db reset`.

Create a local admin (local stack only):

1. Open the local Studio, or use the Auth admin API, to create a user with an
   email and password and a confirmed email.
2. Run in the SQL editor: `insert into public.admin_users (user_id) values ('<the user id>');`

## Tests

```bash
npm run typecheck   # route types + TypeScript
npm test            # unit tests (WhatsApp messages, filters, validation, upload checks)
npm run test:db     # RLS and Storage security tests, local Supabase only
npm run build && npm start
npm run test:e2e    # browser test: login, create gecko, upload photo, publish, WhatsApp link, archive, delete
```

`test:db` and `test:e2e` refuse to run unless Supabase is local. They create
throwaway users and an obviously named test gecko and delete them afterwards.
`test:e2e` needs Playwright; set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` to use
a shared install.

## Going live

1. Create a Supabase project for GeckoDan only. Do not reuse another app's project.
2. Link and push the schema:
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. In the Supabase dashboard:
   - Authentication > Sign In / Providers: turn **off** "Allow new users to sign up".
   - Authentication > URL Configuration: set the Site URL to the live domain.
   - Create the owner's user (Authentication > Users > Add user), then run
     `insert into public.admin_users (user_id) values ('<owner user id>');`
   - Use a long unique password for the owner, and consider enabling MFA.
4. Set the environment variables on the host (Vercel or similar):
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Never add the service-role key.
5. Deploy, sign in at `/admin`, and fill in the content below.

## Content the owner still needs to supply

The site shows labelled placeholders ("Konten menyusul", "Foto menyusul",
"Menunggu tautan") until these exist. Nothing has been invented.

- Real photos of each gecko, and gecko records (ID, morph, sex, hatch date,
  weight, lineage) entered in the dashboard.
- A real hero photo. Until then the hero uses the approved concept image, with
  the caption "Ilustrasi konsep, bukan foto hewan GeckoDan."
- Cover photos and stories for MANTRA, KAFKA and VALKRIE.
- The breeder story (Pengaturan situs > Our Story) and approved wording for the
  "about 10 years" experience.
- Achievements, each with evidence (a link or a certificate photo).
- Testimonials, only with each customer's permission.
- Google Business Profile links to read and to write reviews. The current Maps
  share link opens a Google search, not a place page, so the write-review link
  cannot be derived from it.
- FAQ answers and the shipping policy as actually practised.
- Confirmation that the Facebook link (it opens the profile `rikuo.nura1`) is
  the account GeckoDan wants to show.
