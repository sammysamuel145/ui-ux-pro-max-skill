# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UI UX Pro Max is an AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. It works as a skill/workflow for AI coding assistants (Claude Code, Windsurf, Cursor, etc.).

## Search Command

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

**Domain search:**
- `product` - Product type recommendations (SaaS, e-commerce, portfolio)
- `style` - UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords
- `typography` - Font pairings with Google Fonts imports
- `color` - Color palettes by product type
- `landing` - Page structure and CTA strategies
- `chart` - Chart types and library recommendations
- `ux` - Best practices and anti-patterns
- `icons` - Icon recommendations with import code (Phosphor, Heroicons, Lucide)
- `react` - React/Next.js performance patterns
- `web` - App interface guidelines (iOS/Android/React Native)
- `google-fonts` - Individual Google Fonts lookup
- `gsap` - GSAP animation skeletons by intensity tier (hover, scroll reveal, stagger, page transition, parallax, loading)

**Design dials (optional, only with `--design-system`):**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --design-system --variance <1-10> --motion <1-10> --density <1-10>
```
`--variance` biases style selection (centered/minimal → bold/asymmetric), `--motion` attaches a matching GSAP snippet from `motion.csv`, `--density` overrides the spacing-scale tokens (spacious → dense/dashboard). Any dial left unset behaves exactly as before.

**Stack search:**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`, `javafx`, `wpf`, `winui`, `avalonia`, `uno`, `uwp`

## Architecture

```
src/ui-ux-pro-max/                # Source of Truth
├── data/                         # Canonical CSV databases
│   ├── products.csv, styles.csv, colors.csv, typography.csv, ...
│   └── stacks/                   # Stack-specific guidelines
├── scripts/
│   ├── search.py                 # CLI entry point
│   ├── core.py                   # BM25 + regex hybrid search engine
│   └── design_system.py          # Design system generation
└── templates/
    ├── base/                     # Base templates (skill-content.md, quick-reference.md)
    └── platforms/                # Platform configs (claude.json, cursor.json, ...)

cli/                              # CLI installer (ui-ux-pro-max-cli on npm)
├── src/
│   ├── commands/init.ts          # Install command with template generation
│   └── utils/template.ts         # Template rendering engine
├── scripts/sync-assets.mjs       # Mirrors src/ -> cli/assets/ AND src/ -> .claude/skills/ui-ux-pro-max/
└── assets/                       # Bundled assets (~564KB)
    ├── data/                     # Copy of src/ui-ux-pro-max/data/
    ├── scripts/                  # Copy of src/ui-ux-pro-max/scripts/
    └── templates/                # Copy of src/ui-ux-pro-max/templates/

.claude/skills/ui-ux-pro-max/     # Claude Code skill: hand-authored SKILL.md +
                                   # data/, scripts/ mirrored from src/ (see Sync Rules)
.claude-plugin/                   # Claude Marketplace publishing
```

The search engine uses BM25 ranking combined with regex matching. Domain auto-detection is available when `--domain` is omitted.

## Sync Rules

**Source of Truth:** `src/ui-ux-pro-max/`

There are no symlinks in this repo (git-on-Windows checks them out as plain
text files pointing at a path, which silently breaks the skill) -- every
mirrored copy below is a real, independently-committed file kept in sync by
`cli/scripts/sync-assets.mjs`, enforced by the "Check asset sync" CI workflow.

When modifying files:

1. **Data & Scripts** - Edit in `src/ui-ux-pro-max/`:
   - `data/*.csv` and `data/stacks/*.csv`
   - `scripts/*.py`
   - Then run the sync below -- changes are NOT automatically reflected anywhere else.

2. **Templates** - Edit in `src/ui-ux-pro-max/templates/`:
   - `base/skill-content.md` - Common SKILL.md content
   - `base/quick-reference.md` - Quick reference section (Claude only)
   - `platforms/*.json` - Platform-specific configs

3. **Sync before publishing / committing data or script changes:**
   ```bash
   cd cli
   npm run sync:assets   # mirrors src/ -> cli/assets/ AND src/ -> .claude/skills/ui-ux-pro-max/{data,scripts}
   npm run check:assets  # verify, no npm install required
   ```
   `.claude/skills/ui-ux-pro-max/SKILL.md` itself is hand-authored, not
   mirrored or template-generated -- edit it directly.

4. **Reference Folders** - No manual sync needed. The CLI generates these from templates during `uipro init`.

## Prerequisites

Python 3.x (no external dependencies required)

**Note:** On Windows, use `python` instead of `python3` to run the scripts.

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`

---

## GeckoDan Project Instructions

These instructions apply to all work on the GeckoDan website. They are additional to, and do not change, the UI UX Pro Max instructions above. Work on the UI UX Pro Max toolkit itself still follows the sections above.

### Project Identity

GeckoDan is a premium gecko breeder brand based in Pamulang, Tangerang Selatan, Indonesia.

The website showcases geckos available for sale, collection geckos, signature breeding lines, breeder history, verified achievements, and customer trust information. All purchase inquiries are directed to WhatsApp.

### Core Principles

- Build a functional, production-quality website, not just a visual mockup.
- Inspect existing code before modifying it.
- Reuse the current framework, dependencies, and integrations when appropriate.
- Preserve unrelated working functionality.
- Avoid unnecessary rewrites, dependencies, and architectural complexity.
- Never claim a feature works unless it has been implemented and tested.
- Never fabricate photographs, gecko information, lineage, competition awards, reviews, ratings, or testimonials.
- Use clearly marked placeholders for missing authentic content.
- Do not expose credentials, API keys, service-role keys, or private customer data.

### Design Direction

The approved homepage direction is cinematic wildlife editorial, inspired by the user's reference featuring an orange leopard gecko in a lush tropical environment.

The user has approved a hero concept with:

- A prominent leopard gecko visual.
- Cinematic natural lighting and tropical foliage.
- Editorial typography.
- Minimal navigation.
- The headline concept "A DECADE OF PASSION".
- The supporting line "A Legacy in Every Line".
- An "EXPLORE OUR GECKOS" call to action.

Follow the user's supplied visual reference for colors. Do not invent a new palette.

The overall website should maintain a light editorial premium aesthetic outside the cinematic hero. Prioritize image quality, whitespace, typography, accessibility, mobile usability, and visual consistency.

Use the real GeckoDan logo and photographs when provided. Never present generated imagery as an authentic GeckoDan animal.

### Claude Skills

When relevant and actually available, inspect and follow the installed instructions for:

- UI UX Pro Max: information architecture, usability, responsive design, accessibility.
- Taste: visual direction, composition, typography, and design quality.
- Emil Kowalski: purposeful motion and interaction design.
- Impeccable: interface polish, consistency, and quality assurance.

Do not assume these skills are installed. Verify their locations and follow their actual instructions. Never claim to have used an unavailable skill.

At the time this section was written, the skill folders in this repository were `.claude/skills/ui-ux-pro-max`, `.claude/skills/taste-skill`, `.claude/skills/emil-design-eng`, and `.claude/skills/impeccable`. Check that they still exist before relying on them. These skills can disagree with each other, so choose one lead for design direction and use the others for support.

### Product Requirements

The website should support:

- Homepage and cinematic hero.
- Searchable, filterable gecko catalog.
- Individual gecko detail pages.
- Separate for-sale and showcase visibility.
- MANTRA, KAFKA, and VALKRIE signature lines.
- Gecko photo galleries.
- Pedigree or lineage information when available.
- Breeder story and verified achievements.
- Google Reviews links and genuine testimonials.
- FAQ and shipping information.
- Individual social media and contact links.
- Secure owner-only admin dashboard.
- Admin management of geckos, photos, signature lines, awards, testimonials, FAQs, site settings, and SEO metadata.
- WhatsApp inquiries with prefilled messages.
- SEO-friendly public pages.

Public prices are shown only when the owner enters a price for a gecko, and not for sold geckos (the owner approved showing prices in October 2026). Do not show a price the owner has not entered.

### Business Information

Brand: GeckoDan
Location: Pamulang, Tangerang Selatan, Indonesia
WhatsApp: 085174413278
International WhatsApp URL: https://wa.me/6285174413278

Google Maps:
https://share.google/djs93Utk6ol35s2kV

Facebook:
https://www.facebook.com/share/1CvQh25YDE/

TikTok:
https://www.tiktok.com/@geckodan_?_r=1&_t=ZS-9AeXmIbtv5Z

Instagram:
https://www.instagram.com/geck_dan?vrfl=M24zYnlqMXZhMDFv

YouTube:
https://youtube.com/@joreptile?si=hS67ZZWEuqj8zZTC

Tokopedia:
https://tk.tokopedia.com/ZSg6qxxMf/

Experience: approximately 10 years in the gecko world, subject to owner-approved wording.

### Technical Requirements

- Follow the existing repository's framework and coding conventions.
- Use TypeScript where consistent with the existing stack.
- Keep components modular and maintainable.
- Use a real database and persistent storage for production content.
- If Supabase is used, enforce appropriate Row Level Security and Storage policies.
- Protect admin routes and enforce authorization on the server or database.
- Never permit public admin registration.
- Never expose service-role credentials in client-side code.
- Validate user-controlled inputs and handle errors safely.
- Do not connect to an unrelated application's production database.
- Do not commit secrets or local environment files.

### Content and Data Integrity

- Distinguish available, reserved, and sold geckos.
- Do not assume unknown morphs, sex, age, pedigree, or breeding history.
- Publish awards only when evidence is available.
- Publish testimonials only with appropriate permission.
- Use real Google reviews and verified business profile links.
- Do not invent shipping methods, guarantees, or policies.
- Clearly identify temporary placeholders and remove or replace them before launch.

### WhatsApp and External Links

- Every social platform must have its own clearly labeled link or button.
- Verify external destinations.
- Gecko inquiries should include the gecko name, ID, and detail URL.
- Do not claim an inquiry is a completed purchase.
- No payment gateway or WhatsApp Business API is required for the initial version.

### Development Workflow

1. Inspect the existing implementation before making changes.
2. Identify the smallest appropriate implementation steps.
3. Implement features in logical, testable milestones.
4. Run relevant tests and build checks after meaningful changes.
5. Fix regressions introduced by the implementation.
6. Review responsive behavior, accessibility, performance, and security.
7. Document missing configuration and unresolved issues.
8. Avoid destructive Git operations and preserve unrelated changes.

### Definition of Done

A feature is complete only when it works as intended, has been tested where feasible, and has no unresolved critical security issues.

Before launch, verify the public website, catalog, WhatsApp links, admin authorization, photo uploads, database policies, external links, SEO metadata, mobile layouts, and authentic content.

Do not mark the project production-ready while required security configuration, essential content, or critical tests remain unresolved.
