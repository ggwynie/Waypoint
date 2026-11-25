# Waypoint

Waypoint helps university students from semester 5 onward find internships, seminars, calls for papers and competitions that fit them, in time to apply. Every listing gets a transparent **Fit** score (0–100) with a breakdown of why, sits on a 3D map of how far it is from you, and saved items send reminders 7, 3 and 1 days before the deadline.

Team **Last Minutes Commit**, STACK 2026.

| Member | Role |
|---|---|
| Chelsea Arlyn | W1 Product & validation (team leader) |
| Gwyneth Eunice Widjaja | W2 Frontend & UX |
| Clay Micholaz Fu | W3 Backend & data pipeline |

## Status

Built so far, and what is still to come. Planned parts are never shown as done.

| Part | Status |
|---|---|
| Web app (`apps/web`): log in, sign up, 4-step setup, Home with 3D map, All opportunities, Saved, Reminders, Radius & location, Profile, dark and light theme | Built, running on demo data |
| Submit a listing, Admin queue, Admin sources screens | Not built yet |
| API (`apps/api`, FastAPI) and shared core (`packages/core`, ranking) and migrations (`supabase/migrations`) | Not built yet |
| Database and auth (Supabase Postgres + Supabase Auth) | Not set up yet |
| Data pipeline (`pipeline/`): crawl, LLM extraction, validation, merge | Not built yet |
| Scheduled jobs (daily crawl, expiry, reminder emails) | Not built yet |

## Simulated parts and known limitations

- **Demo data.** While `NEXT_PUBLIC_API_URL` is empty, the web app talks to an in-browser stand-in for the API (`apps/web/src/lib/api/mock`). The 8 listings, the profile and all saves live in the browser's `localStorage`. The app labels this with "Demo data for UI illustration only".
- **Demo Fit scores.** The stand-in computes Fit with the team's Fit rules so the demo re-ranks when you change the radius. The real ranking will live only in `packages/core/waypoint_core/ranking.py`; the web components only display the `fit` and `fit_parts` they receive.
- **Demo sign-in.** Log in and sign up use a local demo session, not Supabase Auth. Any email works; no confirmation email or password reset yet.
- **Schematic map.** Coastline, river and streets are illustrative; distances and directions are real.
- **No reminder emails yet.** Reminders are listed in the app but nothing is sent.

## Run it locally

Supported environment: Node.js 20 or newer, pnpm 10 (via Corepack), latest Chrome, Edge, Firefox or Safari. Desktop first, usable at 375 px wide.

```bash
corepack pnpm install
corepack pnpm --filter web dev
```

Open http://localhost:3000.

**Demo account:** log in with `rani@example.com` and any password to see the seeded profile (Computer Science, semester 6). Any other email starts a new account and runs setup.

Add `?demo=slow`, `?demo=error` or `?demo=empty` to any app URL to see the waking-server notice, the error state with Retry, or the empty state.

### Checks

```bash
corepack pnpm --filter web lint
corepack pnpm --filter web typecheck
corepack pnpm --filter web test
```

## Repository layout

```
apps/web/        Next.js 15 web app (built)
apps/api/        FastAPI API (planned)
packages/core/   models, enums, ranking.py (planned)
supabase/        SQL migrations (planned)
pipeline/        crawler and extraction (planned)
```


## Dependencies

Web app (`apps/web/package.json`):

| Package | Why |
|---|---|
| Next.js 15, React 19, TypeScript | App framework |
| Tailwind CSS 4 | Utility classes mapped onto the design tokens in `src/styles/tokens.css` |
| TanStack Query 5 | Data fetching, caching, optimistic save and undo |
| Zod 3 | Validates API responses against the agreed data shapes |
| Vitest, Testing Library, jsdom | Unit and component tests |
| ESLint (`eslint-config-next`) | Linting |

Fonts: Inter and Space Grotesk from Google Fonts (SIL Open Font License), loaded with `next/font`.

## Third-party resources

- **Design.** The UI follows the team's Dashboard mockup (`Main.dc.html`, `MainAuth.dc.html`). Icons are simple stroke SVGs drawn for this project.
