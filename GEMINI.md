# TravelMate — Agent Rules

You are helping build **TravelMate**, a responsive web app for planning trips: trips, destinations, day-by-day itineraries, expense tracking, map and weather info, reminders. Read `PRD.md` before starting any feature; it is the source of truth for scope, priorities, data model, and current state. `design/DESIGN.md` is the design system reference.

## Project Context

The UI/UX was designed in Google Stitch, built in Google AI Studio, and converted to Next.js. It is **approved and frozen**. The work now is to **connect it to a real backend and real APIs without changing how it looks or behaves visually**. Treat the existing screens, navigation, and styling as fixed unless I explicitly ask.

## Stack (do not swap without asking)

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 (tokens in the global CSS `@theme`; no `tailwind.config.js`)
- Supabase: Postgres, Auth (`@supabase/ssr`, cookie sessions), Row Level Security
- Zod for validation, `date-fns` for dates
- Server Actions for mutations, Route Handlers for external API calls
- Leaflet (`react-leaflet`, client-side only) + OpenStreetMap, Nominatim for place search, Open-Meteo for weather
- Vitest for tests
- Hosting: Vercel + Supabase

No separate Express server, no second database, no extra UI library. If a new dependency seems necessary, explain why and wait for approval. Remove unused dependencies when you find them.

## How to Work

1. **Plan first.** For anything larger than a small fix, write a short plan (files, steps, risks) and wait for approval.
2. **Vertical slices.** Finish one feature end to end (schema, validation, action, UI wiring, test) before the next.
3. **Follow priorities.** P0 first. Do not start P1 or P2 until asked.
4. **Stay in scope.** Never build anything in the PRD's Non-Goals (bookings, payments, GPS, etc.). Do not add booking or purchase buttons or wording.
5. **Small diffs.** Do not refactor unrelated files. When you touch a very large file, extract only what the task needs.
6. **Ask when unsure.** One clear question instead of guessing.
7. **Verify.** After changes run type-check, lint, tests, and `next build`. Report results honestly; say what you did not test.

## Freeze the Design

- Do not change colors, fonts, spacing, radii, layout, copy, animations, or navigation patterns (desktop sidebar, mobile bottom nav, More sheet, bottom sheets).
- In existing presentational components, change only what is technically required (for example `"use client"`, `next/link`, reading the route) and only if the result looks identical.
- Use the existing theme tokens and utility classes; never hardcode hex colors in components.
- Every change must work in light and dark mode and at 375px, 768px, and 1280px widths. Compare against the approved design before calling a task done.
- Handle loading, empty, and error states in every data-driven view, using the existing visual style.

### Exception: explicitly requested UI fixes

When a task explicitly lists UI fixes or changes, only the listed items may change visually. Everything not listed stays identical. For each listed change, keep to the existing design tokens and patterns, verify in light and dark mode at 375px, 768px, and 1280px, and report what changed. Never use this exception to restyle or reorganize anything else.

## Code Standards

- TypeScript strict; no `any` unless justified in a comment.
- Money: every amount in the system is in Philippine pesos (PHP, ₱). Format it only with the shared `formatCurrency` helper (Intl, `en-PH`); never hardcode currency symbols or show USD / JPY values as primary amounts. The currency converter is informational only.
- Existing interactive screens are client components. Read browser-only values (`localStorage`, `window`, touch state) after mount to avoid hydration mismatches. Set the theme class with an inline script in the root layout so there is no flash.
- Load Leaflet only on the client (dynamic import with SSR disabled).
- Real URLs for every screen under the App Router; browser back and forward must work. Navigation components read the route (`usePathname`) and use `next/link`.
- Mutations go through Server Actions that check the authenticated user and validate input with Zod schemas from `lib/validators/`. Reads happen on the server and pass data to the existing client screens.
- Store dates as ISO dates (`YYYY-MM-DD`) or `timestamptz`; format only for display.
- UI-only state (theme, open sheets) may stay in the existing client context; domain data belongs in Supabase.
- Components: small and single-purpose; add shared primitives in `components/ui/` gradually instead of copying long class strings.

## Database and Security

- All schema changes go in `supabase/migrations/` as SQL. Never change the database by hand without a migration.
- Every table has RLS enabled; users read and write only their own rows (directly by `user_id` or through the owning `trip_id`). Admin abilities are enforced by role-based policies and server checks, not by hiding UI.
- Admin accounts are never created through public registration. Admins sign in through `/admin/login` only, and the role is checked on the server for every admin page and action. Users must not be able to change their own `role` or `is_active` values.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public. Never expose a service-role key or prefix secrets with `NEXT_PUBLIC_`. Keep `.env.example` current with names only; never commit `.env*` files.
- Call external APIs (Open-Meteo, Nominatim) from Route Handlers or server code with caching, error handling, and a friendly fallback. Respect Nominatim's usage policy (debounce search, no bulk requests).
- Show a short note in the UI that weather and location data come from third parties and may be inaccurate.

## Git Workflow

- One feature per branch: `feat/<short-name>` or `fix/<short-name>`.
- Commit messages: `type: summary` (feat, fix, refactor, test, docs, chore).
- Never push to `main` directly or force-push.
- Never run destructive commands (dropping tables, deleting directories, resetting history) without explicit approval.

## Testing

- Unit-test pure logic with Vitest: trip validators, date range to days, budget totals.
- Add a few end-to-end checks for core flows only: register / login, create trip, add activity, add expense.
- Before calling a feature done, check it against its acceptance items in `PRD.md`.

## Communication Style

- Be concise: what changed, which files, what was verified.
- Explain non-obvious decisions in one or two sentences; the developer is a student who must explain this code in a defense.
- End each task with known limitations, assumptions, and follow-ups.
- Never claim something works unless you ran it.
