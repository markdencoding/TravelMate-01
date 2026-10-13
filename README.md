# TravelMate — Curated Trip Architecture & Itinerary Planner

TravelMate is a modern, responsive web application for planning travel itineraries: multi-destination routes, day-by-day schedules, expense budgeting, weather forecasts, and interactive mapping.

The frontend UI/UX was designed in Google Stitch, created in Google AI Studio, and converted into Next.js App Router with Tailwind CSS v4 design tokens. The backend foundation connects this approved and frozen interface directly to Supabase (PostgreSQL, Auth, Row Level Security) using Next.js 15 Server Actions.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`, no `tailwind.config.js`)
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security, cookie sessions via `@supabase/ssr`)
- **Validation**: Zod (schemas in `src/lib/validators/`)
- **Dates**: `date-fns` (ISO dates `YYYY-MM-DD`, range calculations in `src/lib/dates.ts`)
- **Testing**: Vitest for unit validation logic

---

## Getting Started

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A Supabase project (free tier at [supabase.com](https://supabase.com))

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone <repo-url>
cd TravelMate-01
npm install
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase project credentials (found under **Project Settings > API** in your Supabase dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"

# Geocoding & OpenStreetMap Nominatim Policy (Server-side)
NOMINATIM_APP_NAME="TravelMate"
NOMINATIM_CONTACT_EMAIL="contact@travelmate.app"

# Geoapify Address Autocomplete API Configuration (Server-only)
GEOAPIFY_API_KEY="your-geoapify-api-key"
```

> **Security Note**: Never expose the Supabase service-role key or commit `.env.local` to version control. Only public anon keys are exposed to the client. Server-only keys (like Nominatim and Geoapify keys) are kept strictly on the backend.

---

## Applying Database Migrations

All database schemas, constraints, triggers, and Row Level Security policies are organized into modular, numbered migrations in `supabase/migrations/`:

```
supabase/migrations/
├── 20261011000100_helpers.sql          # 1. Extensions & updated_at trigger function
├── 20261011000200_profiles.sql         # 2. Profiles table, is_admin(), auth triggers, RLS
├── 20261011000300_trips.sql            # 3. Trips table, date check, status trigger, RLS
├── 20261011000400_destinations.sql     # 4. Destinations table, lat/long checks, RLS
├── 20261011000500_itinerary_items.sql  # 5. Itinerary activities, composite FK, date boundary triggers, RLS
├── 20261011000600_expenses.sql         # 6. Expenses table, composite FK to activities, RLS
├── 20261011000700_notifications.sql    # 7. Notifications table, type checks, RLS
├── 20261011000800_permissions.sql      # 8. Revoke anon privileges, grant authenticated CRUD
├── 20261012000100_currency_php.sql     # 9. Standardize system-wide default currency to PHP
└── 20261012000200_trip_cover_credits.sql # 10. Add cover_image_credit and cover_image_credit_url to trips
```

### Option A: Using the Supabase Web Dashboard (SQL Editor)

1. Open your project dashboard at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the left navigation, click **SQL Editor** ➔ **New Query**.
3. Execute the migration files **in exact numerical order** (1 through 10):
   - Run `20261011000100_helpers.sql`
   - Run `20261011000200_profiles.sql`
   - Run `20261011000300_trips.sql`
   - Run `20261011000400_destinations.sql`
   - Run `20261011000500_itinerary_items.sql`
   - Run `20261011000600_expenses.sql`
   - Run `20261011000700_notifications.sql`
   - Run `20261011000800_permissions.sql`
   - Run `20261012000100_currency_php.sql`
   - Run `20261012000200_trip_cover_credits.sql`
4. Confirm each query executes successfully with status `Success. No rows returned`.

### Option B: Using the Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
# Push all unapplied migrations in dependency order
supabase db push
```

For local development with Docker:
```bash
supabase start
supabase db reset
```

---

## Verifying Database Security & Integrity

Two verification scripts are provided under `supabase/checks/`:

### 1. Schema & RLS Audit (`supabase/checks/schema_audit.sql`)
A read-only inspection query set that verifies:
- RLS is enabled on every table in the `public` schema.
- Policies are defined per table and operation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- Privileges for `anon` role are completely revoked, and `authenticated` role has only required permissions.
- Triggers, check constraints, foreign keys, and indexes are properly registered.

Run `schema_audit.sql` directly in the Supabase SQL Editor.

### 2. Transactional Isolation Test (`supabase/checks/rls_isolation.sql`)
A self-contained test script wrapped in a `BEGIN ... ROLLBACK` transaction (safe to run on development environments; leaves zero residual data):
- Creates two test auth users.
- Verifies the `handle_new_user()` trigger enforces `role = 'traveler'` and `is_active = true`.
- Verifies that non-admin users cannot promote themselves or modify account activation status.
- Verifies tenant isolation: User B cannot read, update, or inject records into User A's trips, destinations, itinerary items, expenses, or notifications.
- Verifies that cross-trip destination referencing is blocked by composite foreign keys.
- Verifies date constraints, negative expense rejection, and out-of-range activity date boundary triggers.

Run `rls_isolation.sql` in the Supabase SQL Editor and review the notice outputs.

---

## Promoting the First Administrator

Admins cannot be created through public registration. To promote the first administrative account, register a normal user through `/login`, then execute this SQL statement in the Supabase SQL Editor (as a privileged database role):

```sql
-- Promote an existing user to Administrator
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

After promotion, the account will have full access to `/admin` with role verification enforced on the server.

---

## Development Database Seeding

To populate a newly created account with sample trip data (Kyoto Autumn expedition with destinations, itinerary activities, and expenses) for local testing:

1. Obtain your user UUID from the `profiles` or `auth.users` table in Supabase.
2. Open `supabase/seed.sql` and replace `<YOUR_USER_UUID>` with your actual user ID.
3. Run the script in the Supabase SQL Editor:
   ```sql
   -- Copy & paste the contents of supabase/seed.sql into the SQL Editor and click Run
   ```
4. Refresh your TravelMate dashboard to view the populated expedition.

---

## Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type-Check & Lint
```bash
npm run lint
```

### Running Unit Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
npm run start
```

---

## Key Architectural Decisions

1. **Frozen Design System**: All colors, typography (`Plus Jakarta Sans`, `Inter`, `Material Symbols`), spacing, transitions, and dark mode variants are preserved exactly from the approved Google AI Studio design.
2. **Preventing Dark Mode Flash**: An inline synchronous `<script>` in the root `src/app/layout.tsx` reads `localStorage` and device `matchMedia('(prefers-color-scheme: dark)')` before the first DOM paint.
3. **App Router File-Based Navigation**:
   - `(auth)/login`: Isolated authentication screen without the app shell.
   - `(app)/*`: Shared responsive app layout containing the desktop sidebar, mobile bottom navigation, and modal sheets (`/dashboard`, `/trips`, `/trips/[tripId]`, `/explore`, `/expenses`, `/calendar`, `/dossier`, `/settings`, `/admin`).
4. **Data Isolation with Row Level Security (RLS)**:
   - Every trip is strictly scoped to `user_id = auth.uid()`.
   - Users can only read, create, update, or delete their own trips.
   - Admin access to `/admin` is verified on the server using `profiles.role = 'admin'`.
5. **Trip Dates & Validation**:
   - Date inputs in `EditTripModal` use native ISO dates (`YYYY-MM-DD`).
   - Validated both client-side and server-side via Zod (`endDate >= startDate`, requirement TM-3) and enforced at the database level with a SQL check constraint.
6. **Real Explore, Leaflet Maps & Weather Integration**:
   - **Empty-First Initial State**: Explore starts clean with no mock places, mock weather, or simulated pins. Searches are triggered only on explicit user query submission (Enter / button click), never per-keystroke.
   - **OpenStreetMap & Nominatim Usage Policy**:
     - Queried strictly through the server Route Handler (`/api/places?q=...`).
     - Server User-Agent configured via `NOMINATIM_APP_NAME` and `NOMINATIM_CONTACT_EMAIL`.
     - 1 request/second rate-limiting enforced on server.
     - 1-hour in-memory query caching.
     - Mandatory attribution displayed: `"© OpenStreetMap contributors"`.
   - **Leaflet Map Component**:
     - Client-side only rendering (`next/dynamic` with `ssr: false`).
     - Styled HTML markers using Tailwind CSS and Material Symbols icons matching TravelMate category colors (landmark, food, nature, culture, attractions).
     - Dark mode tile filter applied automatically via CSS filter when dark mode is enabled.
   - **Open-Meteo Weather Integration**:
     - Queried through `/api/weather?lat=...&lon=...` with coordinate bounds validation.
     - Fetches current weather and daily forecasts (high/low temps, precipitation probability, WMO code mapping, sunrise/sunset).
     - 30-minute in-memory caching to eliminate redundant upstream calls.
     - UI displays a clear notice that weather and location data come from third parties and may be inaccurate.
7. **Philippine Peso (PHP, ₱) as Single System Currency**:
   - Philippine peso (PHP, ₱) is the single, authoritative currency across the entire system.
   - Formatted system-wide using the shared `formatCurrency(amount, options)` helper (`Intl.NumberFormat`, locale `en-PH`, currency `PHP`, symbol `₱`).
   - All forms (trips, expenses, activities) and displays (dashboards, charts, cards, dossier, calendar) strictly display and input in pesos.
   - Database migration `20261012000100_currency_php.sql` updates `trips.currency`, `profiles.preferred_currency`, and `expenses.currency` defaults to `'PHP'`.
   - The currency converter serves as an informational reference converting FROM Philippine pesos to ~40 world currencies using live exchange rates via `/api/exchange-rates` (cached 1 hour with fallback).
8. **Real Destination Search & Wikidata Country Recommendations**:
   - **Target Destinations**: Starts clean with no demo chips. Users search places on submit (Enter key or Search icon) via `/api/places` (Nominatim).
   - **Combobox Keyboard Accessibility**: Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) and 44px touch targets.
   - **Duplicate Prevention**: Destination chips prevent duplicate additions by name and retain geocoordinates (`latitude`, `longitude`, `country`).
   - **Live Country Recommendations**: When a country is chosen, popular places are fetched via `/api/recommendations?country=...` using Wikidata SPARQL, ranking well-known tourist attractions and cities by Wikipedia language versions (`sitelinks`), cached for 7 days on the server.
   - **Atomic Persistence**: Server Actions (`createTripAction`, `updateTripAction`) validate payloads with Zod and atomically persist trips and their destination records in `public.destinations` with correct order indexes.
9. **Google Maps-Style Destination Autocomplete (Geoapify & Fallback)**:
   - **Real-Time As-You-Type Suggestions**: Combobox (`PlaceSearchInput`) provides live destination predictions opening after 2 characters, debounced at 250ms with inflight request cancellation (`AbortController`) and stale-response guards.
   - **Upstream Service & Plan Safety**: Uses the Geoapify Address Autocomplete API (`/api/places/suggest`) on the server. Free plan includes 3,000 credits/day (1 credit/request). Requests use soft bias toward the Philippines (`bias=countrycode:ph`) without exclusionary filters.
   - **Session Caching**: Client maintains an in-memory session cache ensuring backspacing or retyping cached terms costs 0 requests. A typical 5-character search consumes only ~1–2 API credits.
   - **Post-Filtering**: Server filters out street addresses, individual buildings, postcodes, and commercial sites, mapping only countries, regions, cities, and landmarks with semantic icons.
   - **Attribution**: Legally required "Powered by Geoapify" and "© OpenStreetMap contributors" are prominently displayed in the dropdown footer.
   - **Seamless Fallback**: If the key is missing, rate-limited, or service fails, the dropdown offers an inline fallback row allowing users to press Enter and execute the submit-based Nominatim search (`/api/places`).
   - **Component Reuse**: The unified `PlaceSearchInput` is shared across both the Create/Edit Trip form and the Explore map search bar.
10. **Destination-Specific Wikimedia Cover Photos & Attribution**:
    - **Dynamic Discovery**: Completely replaces static hardcoded sample images. The Create / Edit Trip form dynamically fetches landscape destination photos from English Wikipedia articles via /api/photos?query=...&country=..., falling back to Wikimedia Commons search.
    - **Strict Content & Quality Filtering**:
      - Landscape orientation only: minimum width ~1000px and aspect ratio >= 1.3.
      - JPEG/PNG only (vector SVG excluded).
      - Category & filename filters exclude non-photos: flags, maps, coats of arms, logos, seals, diagrams, icons, and locator charts.
    - **Strict Free Licensing Enforcement**:
      - Accepts only verified free licenses: Public Domain, CC0, CC BY (2.0/2.5/3.0/4.0), and CC BY-SA (2.0/2.5/3.0/4.0).
      - Excludes non-commercial (NC) or non-derivative (ND) licenses.
      - Mandates verifiable creator/author metadata.
    - **Wikimedia API Etiquette**:
      - Identifiable server-side User-Agent header utilizing NOMINATIM_APP_NAME and NOMINATIM_CONTACT_EMAIL.
      - Strict 24-hour in-memory server cache by normalized destination query.
      - Sliding window rate limiting (10 req / 10s per authenticated user session).
      - Displays standardized Wikimedia thumbnail widths (`thumbwidth=640`, `coverwidth=1280`) without hotlink abuse.
    - **Full Attribution Compliance**:
      - Stores cover_image_credit and cover_image_credit_url in public.trips.
      - Displays standardized attribution "Photo: {creator} · {license} · Wikimedia Commons" with clickable link to the Commons file description page on trip cards, dashboard hero, dossier, and cover selection preview.
    - **Optional Cover & Fallback Styling**:
      - Cover photos are completely optional. Trips without a cover default to an elegant teal-to-emerald gradient with a subtle topographical exploration watermark.

11. **Trip Destinations Map, Trip Categories, & Geoapify Nearby Tourist Spots**:
    - **Shared Client-Only Leaflet TripMap (`TripMap`)**:
      - Dynamic client-only Leaflet rendering (`next/dynamic` with `ssr: false`).
      - OpenStreetMap tiles with automated theme-aware dark mode tile filter.
      - Numbered waypoint pins derived from `order_index`.
      - Dashed geodesic route polyline connecting destinations in chronological sequence.
      - Name tooltips, touch support, and interactive popups with "Open Trip" navigation.
      - Auto-bounds fitting for all active coordinates (destinations, search places, and nearby spots).
      - Graceful empty state when an expedition has no destinations: "Add a destination to see the map".
    - **Trip Detail & Multi-Trip List Map View**:
      - Trip detail (`/trips/[tripId]` / Calendar view) features an interactive map tab plotting all waypoints.
      - Trips screen (`/trips`) features a List / Grid / Map toggle with ONE consolidated map rendering all trips' pins colored by status (teal for Planned, sunset coral for Ongoing, slate for Completed).
    - **Explore / Map Trip Categories & Selection**:
      - Status filter chips matching the Trips page: `All Trips`, `Planned`, `Ongoing`, `Completed` derived via `calculateTripStatus`.
      - Expedition picker pills allow selecting any trip within the active category to display its route and inspect tourist spots.
      - Seamless coexistence: Search places (Nominatim) and trip waypoints/spots coexist cleanly on the map and in the left inspector without discarding state unexpectedly.
    - **Nearby Tourist Spots Endpoint (`/api/places/nearby`)**:
      - **Endpoint**: `GET /api/places/nearby?lat={lat}&lon={lon}&radius={meters}&tripId={tripId}`
      - **Authentication**: Signed-in only (enforced via Supabase server session).
      - **Validation**: Zod schema validating coordinate bounds (-90 to 90 lat, -180 to 180 lon), radius (1,000m to 50,000m, default 10,000m), and optional trip ID.
      - **Geoapify Places API v2**:
        - Categories queried: `tourism.attraction`, `tourism.sights`, `entertainment.museum`, `leisure.park`, `heritage`.
        - Filter: `circle:lon,lat,radiusMeters`.
        - Bias: `proximity:lon,lat`.
        - Result limit: 20 places.
      - **Post-Processing & Filtering**:
        - Drops unnamed features.
        - Deduplicates results by normalized name and coordinate proximity.
        - Excludes places matching existing destination names or coordinates of the selected trip.
        - Returns `{ id, name, categoryLabel, category, address, distanceMeters, latitude, longitude }`.
      - **Credit Usage & Caching**:
        - Upstream cost: 1 Geoapify credit per request.
        - Server caching: 24-hour in-memory cache keyed by rounded coordinates (~100m grid) and radius, drastically reducing quota usage.
        - Rate limiting: 10 requests per 10-second window per user.
      - **Graceful Error Handling**:
        - If `GEOAPIFY_API_KEY` is missing or quota is exhausted, returns typed errors (`key_missing`, `quota_exceeded`) and the UI hides the section quietly.
      - **UI Panel & Itinerary Integration**:
        - Displays nearby attractions grouped by destination waypoint (with tabs/chips).
        - Cards display name, category chip, address, and distance (e.g. `2.4 km away`).
        - Clicking a card highlights its pin on the map and auto-pans.
        - "+ Add to itinerary" button opens the prefilled `AddActivityModal` with place name, address, category, and date range.
      - **Attribution**:
        - Displays "Powered by Geoapify" and "OpenStreetMap contributors" credit notes.

