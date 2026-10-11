# TravelMate — Product Requirements Document

**Version:** 1.2 (Next.js, existing approved UI preserved) | **Owner:** Mark Den A. Camposano | **Course:** IPT2 (LFCA411E070)
**Platform:** Responsive web app (desktop + mobile browsers)

---

## 1. Overview

TravelMate is a web-based travel and itinerary planner. Travelers create trips, add destinations, build day-by-day itineraries, track estimated expenses, and see map and weather info in one place instead of juggling notes, maps, and spreadsheets.

## 2. Problem Statement

Trip information is scattered across notes apps, documents, map apps, and weather sites. Travelers lose track of schedules, activities, and spending, especially on multi-destination trips.

## 3. Goals and Non-Goals

### Goals
- One place to plan a trip end to end (dates, destinations, activities, budget).
- Fast, drag-friendly itinerary editing.
- Contextual map and weather info without leaving the app.
- Clear view of estimated spend vs. budget.
- Works well on a phone browser.

### Non-Goals (out of scope)
- Booking or reservations (flights, hotels, restaurants, transport)
- Payment processing or travel insurance
- Airline/hotel account integration
- GPS hardware, IoT, travel-agency management, emergency/medical services
- Guaranteed accuracy of third-party API data (show a disclaimer instead)

## 4. Users and Roles

| Role | Description | Key needs |
|---|---|---|
| Traveler | Registered user who plans trips | Create trips, build itineraries, track expenses, view weather/map |
| Admin | Monitors and maintains the system | View/disable users, view basic usage stats |

Roles are stored as a field on the user profile. Admin access is enforced by database policies and server checks, never by hiding UI alone.

Admins are kept completely separate from travelers: they sign in at their own login page (`/admin/login`), have no self-registration (admin accounts are promoted manually in the database), use their own layout and navigation, and never appear in the traveler app's navigation. Travelers cannot reach admin pages, and admin accounts cannot use the traveler app.

## 5. Architecture

The stack follows the proposal: Next.js, PostgreSQL, JWT authentication, and Vercel + Supabase hosting. The UI/UX generated in Google AI Studio is **approved and must not change**; it was converted to Next.js and is kept as the frontend. The backend is added underneath it.

| Layer | Choice | Status |
|---|---|---|
| App framework | Next.js (App Router) + TypeScript | Converted from the Vite build; to be verified |
| UI | Existing screens and components (React client components) | Existing, frozen |
| Styling | Tailwind CSS v4, design tokens in the global CSS (`@theme`), dark mode via `.dark` class with Light / Dark / System | Existing, frozen |
| Icons / fonts | Material Symbols, Plus Jakarta Sans, Inter | Existing |
| Routing | App Router file-based routes (`/dashboard`, `/trips/[tripId]`, ...) | New (currently state-based tab switching) |
| Database | Supabase Postgres | New |
| Auth | Supabase Auth (JWT sessions in cookies via `@supabase/ssr`), route protection through Next.js middleware | New (currently mock) |
| Authorization | Postgres Row Level Security; admin through a `role` field on profiles | New |
| Mutations | Server Actions with Zod validation | New |
| Reads | Server Components / server-side queries passing data to the existing client screens | New |
| Maps | Leaflet (`react-leaflet`, loaded client-side only) + OpenStreetMap tiles; Nominatim for place search | Replaces simulated map |
| Weather | Open-Meteo (forecast + geocoding, no API key) | Replaces mock weather |
| External API calls | Next.js Route Handlers (`/api/weather`, `/api/places`) with caching | New |
| Reminders | In-app, computed from upcoming trips and activities; scheduled job / email is P2 | New |
| Testing | Vitest for logic; Playwright for a few key flows | New |
| Hosting | Vercel + Supabase | As proposal |

Notes:
- No separate Express server. Next.js Server Actions and Route Handlers run on Node.js and cover the proposal's Node.js backend role.
- Unused dependencies (`@google/genai`, `express`, `dotenv`) and the Gemini placeholder in `.env.example` are removed unless a feature needs them.
- The browser only uses the Supabase URL and anon key. A service-role key, if ever needed, stays server-side and is never prefixed `NEXT_PUBLIC_`.
- Existing screens stay client components. Because they used browser-only code (localStorage, touch gestures, `window`), they need hydration-safe handling rather than redesign.

## 6. Data Model (draft)

- **profiles**: id (= auth user id), display_name, role (`traveler` | `admin`), is_active (default true), avatar_url, created_at
- **trips**: id, user_id, title, start_date, end_date, budget_amount, currency (always `PHP`), notes, created_at
- **destinations**: id, trip_id, name, country, lat, lng, order_index, arrival_date, departure_date
- **itinerary_items**: id, trip_id, destination_id (nullable), day_date, title, description, start_time, end_time, location_name, lat, lng, order_index
- **expenses**: id, trip_id, itinerary_item_id (nullable), category, description, amount, currency, expense_date
- **notifications**: id, user_id, trip_id (nullable), type, message, remind_at, read_at, created_at

Rules: every table scoped by `user_id` (directly or through `trip_id`) with RLS enabled. Deleting a trip cascades to its children.

## 7. Functional Requirements

Priority: **P0** = needed for midterm, **P1** = needed for final, **P2** = nice to have.

### 7.1 User Management
| ID | Requirement | Priority |
|---|---|---|
| UM-1 | Register, log in, log out with email and password | P0 |
| UM-2 | Protected routes redirect unauthenticated users to login | P0 |
| UM-3 | View and edit profile (name, avatar) | P1 |
| UM-4 | Password reset by email | P2 |

### 7.2 Trip Management
| ID | Requirement | Priority |
|---|---|---|
| TM-1 | Create a trip with title, dates, budget, currency | P0 |
| TM-2 | List, view, edit, delete own trips | P0 |
| TM-3 | Validate dates (end not before start) | P0 |

### 7.3 Destinations
| ID | Requirement | Priority |
|---|---|---|
| DS-1 | Search places by name and add them to a trip | P0 |
| DS-2 | Reorder and remove destinations | P1 |
| DS-3 | Show destination on a map | P0 |
| DS-4 | Show current weather and daily forecast for the trip dates | P0 |
| DS-5 | Trip form: search destinations (place search) and add several as destinations of the trip | P0 |
| DS-6 | When a country is chosen, show popular places in that country to add with one click | P1 |

### 7.4 Itinerary
| ID | Requirement | Priority |
|---|---|---|
| IT-1 | Day-by-day view generated from trip date range | P0 |
| IT-2 | Add, edit, delete activities with time and location | P0 |
| IT-3 | Drag to reorder activities and move them between days | P1 |
| IT-4 | Show activities as map pins for the selected day | P1 |

### 7.5 Expenses
| ID | Requirement | Priority |
|---|---|---|
| EX-1 | Add, edit, delete estimated expenses with category | P0 |
| EX-2 | Totals by category and remaining budget | P0 |
| EX-3 | Optionally link an expense to an activity | P2 |
| EX-4 | All amounts are in Philippine pesos (PHP, ₱) across the system; the currency converter is informational only (approximate equivalents in other currencies) | P0 |

### 7.6 Dashboard and Summary
| ID | Requirement | Priority |
|---|---|---|
| DB-1 | Dashboard: upcoming trips, next activities, budget status | P0 |
| DB-2 | Trip summary page (itinerary + expense totals), printable | P1 |

### 7.7 Notifications
| ID | Requirement | Priority |
|---|---|---|
| NT-1 | In-app reminders for upcoming trips and activities | P1 |
| NT-2 | Mark notifications as read | P1 |
| NT-3 | Email reminders | P2 |

### 7.8 Admin (separate portal)
| ID | Requirement | Priority |
|---|---|---|
| AD-1 | Separate admin login page; non-admin accounts are rejected with a generic error; no admin registration | P1 |
| AD-2 | Admin layout with its own navigation, separate from the traveler app | P1 |
| AD-3 | Admin overview: counts of users, trips, activities, expenses and recent signups (aggregates only, no trip contents) | P1 |
| AD-4 | User management: list, search, enable / disable accounts; an admin cannot disable themselves | P1 |
| AD-5 | Disabled users are blocked from signing in to the traveler app | P1 |
| AD-6 | Basic system activity view (recent signups, recent admin actions) | P2 |

## 8. Non-Functional Requirements

- **Security:** RLS on all tables; Zod validation in the app plus database constraints (not null, checks, foreign keys) as the real enforcement; middleware route protection; only the Supabase URL and anon key in the browser; secrets only in environment variables.
- **Performance:** Pages usable within about 3 seconds on a typical mobile connection; external API responses cached where practical.
- **Responsive:** Layouts tested at 375px, 768px, and 1280px widths.
- **Accessibility:** Semantic HTML, labeled inputs, keyboard-usable forms, sufficient color contrast.
- **Reliability:** If the map or weather API fails, show a friendly fallback; the rest of the app keeps working.
- **Maintainability:** TypeScript strict mode, consistent folder structure, small focused components.

## 9. Key User Flows

1. **Plan a trip:** Sign up → Create trip → Search and add destination → See map and forecast → Add activities per day → Add expenses → View dashboard.
2. **Adjust a plan:** Open trip → Drag an activity to another day → Totals and map update.
3. **Review:** Open trip summary → Check budget vs. estimated spend → Print or save as PDF.

## 10. Folder Structure

```
src/
  app/
    layout.tsx                  # fonts, global CSS, theme script (no flash)
    (auth)/login/page.tsx       # no app shell
    (app)/
      layout.tsx                # existing Sidebar, Header, BottomNav, sheets
      dashboard/page.tsx
      trips/page.tsx
      trips/[tripId]/page.tsx
      explore/page.tsx
      expenses/page.tsx
      calendar/page.tsx
      dossier/page.tsx
      settings/page.tsx
    (admin)/admin/
      login/page.tsx            # separate admin sign-in, no traveler shell
      (panel)/layout.tsx        # admin shell and navigation
      (panel)/page.tsx          # overview
      (panel)/users/page.tsx    # user management
    api/
      weather/route.ts
      places/route.ts
  components/                   # existing UI components (unchanged look)
    ui/                         # shared primitives added gradually
  screens/                      # existing screen components (client components)
  lib/
    supabase/{client,server,middleware}.ts
    validators/                 # Zod schemas
    data/                       # server-side queries
    actions/                    # Server Actions
    dates.ts
  middleware.ts                 # session refresh + route protection
  types.ts
supabase/
  migrations/                   # SQL schema + RLS policies
tests/
design/
  DESIGN.md                     # design system reference
```

## 11. Current State and Milestones

### Current state
- UI is complete and responsive: 9 screens, desktop sidebar, mobile bottom nav, More sheet, bottom sheets, light / dark / system theme. Approved; do not change.
- The UI was converted from Vite to Next.js in AI Studio. The conversion must be verified (build, hydration, theme, every screen) before backend work.
- All data is mock data in a client store persisted to `localStorage`. There is no backend.
- Authentication is a UI only; there are no protected routes.
- Weather is simulated; the map is a static image with CSS pan and zoom.
- Screens switch through state rather than URL routes.
- Activity edit and expense edit are missing; trip dates are free-text strings with no validation.
- A separate scaffold folder (`TravelM`) holds a Next.js project with a Supabase migration, Zod validators, and auth setup that can be reused.

### Milestones
| Phase | Deliverables |
|---|---|
| **Foundation (now)** | Verify conversion, housekeeping, App Router routes, Supabase clients and schema, auth + protected routes, trips CRUD with date validation |
| Dev Phase 2 | Destinations, itinerary (day view, activity add / edit / delete), expenses (add / edit / delete), dashboard on real data |
| API Integration | Leaflet map, Nominatim place search, Open-Meteo weather through route handlers |
| **Midterm check** | All P0 items working end to end |
| Advanced Development | P1 items: drag and drop, notifications, summary / dossier, admin |
| Testing, Deployment, Docs | Tests, bug fixes, deploy to Vercel + Supabase, documentation |
| Final presentation | Live demo |

## 12. Success Criteria

- All P0 requirements work end to end by the midterm check.
- All P1 requirements work by the final presentation.
- A new user can create a trip with an itinerary and expenses in under 5 minutes.
- No user can read or modify another user's data (verified with at least two test accounts).

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| The Next.js conversion changed the look or broke gestures | Verify first; compare each screen against the approved design in light and dark at 375 / 768 / 1280px; change only what is technically required |
| Hydration mismatches from `localStorage`, `window`, and touch code | Mark interactive screens as client components; read browser-only values after mount; set the theme class with an inline script to avoid a flash |
| Third-party API limits or downtime | Cache in route handlers, graceful fallbacks, free no-key providers |
| Scope creep | Hold to the priority tiers; P2 only if time remains |
| Auth or data leaks | RLS on every table; two-account manual test before each milestone |
| Very large screen files (1,000+ lines) are hard to change | Extract shared primitives and split files only when a feature touches them |
| Mock data and real data mixed during the transition | Migrate one entity at a time; key leftover local data by the real trip id |
| Short timeline | Reuse the approved UI and the existing scaffold; build vertical slices |

## 14. Open Questions

- Is Next.js (Server Actions and Route Handlers) accepted in place of the separate Node.js + Express backend named in the proposal?
- Which currencies must be supported (single default vs. multi-currency)?
- Is email reminder delivery required, or is in-app enough?
- Should the admin see user trip contents, or only account-level info?
