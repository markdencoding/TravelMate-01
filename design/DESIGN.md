---
name: Wanderlust Modern
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4948'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7979'
  outline-variant: '#bec9c8'
  surface-tint: '#016a6a'
  primary: '#005454'
  on-primary: '#ffffff'
  primary-container: '#0d6e6e'
  on-primary-container: '#9dedec'
  inverse-primary: '#84d4d3'
  secondary: '#b4280c'
  on-secondary: '#ffffff'
  secondary-container: '#fe5d3d'
  on-secondary-container: '#5c0b00'
  tertiary: '#00554b'
  on-tertiary: '#ffffff'
  tertiary-container: '#006f64'
  on-tertiary-container: '#6df4e1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a0f0f0'
  primary-fixed-dim: '#84d4d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a4'
  on-secondary-fixed: '#3e0500'
  on-secondary-fixed-variant: '#8d1600'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  title-page:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  title-section:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-item:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-small:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-badge:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-button:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the optimism, clarity, and anticipation of travel. It balances utilitarian planning utility with evocative lifestyle inspiration. The visual character merges clean digital product ergonomics with subtle warm-sun and deep-ocean cues: open breathing room, crisp content boundaries, and tactfully applied vibrant accents.

Key brand attributes:
- **Calm Organization:** Reduces traveler anxiety with clear hierarchies, high-readability schedules, and non-cluttered data density.
- **Warm & Inviting:** Avoids sterile corporate aesthetics through friendly geometric typography, softened card silhouettes, and warm sunset callouts.
- **Tangible Utility:** Provides distinct visual signifiers for diverse travel categories (lodging, flights, culinary stops, excursions) and strict operational touch targets (44px minimum) suitable for desktop planning and handheld on-the-go navigation.

## Colors

The palette pairs ocean depths with warm coastal sunlight. Dark slate neutrals ground the interface, while bright functional tones drive status and itinerary categorization.

### Surface and Structure
- **Light Mode:** Canvas begins on `#F8FAFC` with raised cards on `#FFFFFF`. Subdued element groupings leverage `#F1F5F9`, bordered by soft hairline partitions (`#E2E8F0`). Text layers scale from primary `#0F172A` down to muted guide labels `#64748B`.
- **Dark Mode:** Deep slate nocturnal base (`#090D16`), card layers at `#0F172A` and `#1E293B`, bound by subtle structural borders (`#334155`). Copy switches to `#F8FAFC` for headlines and `#94A3B8` for secondary details.

### Functional & Category Tones
- **Teal / Ocean (`#0D6E6E` / `#14B8A6`):** Primary branding, active navigation indicators, and verified schedule slots.
- **Sunset Coral (`#FA5A3A` / `#FB7185`):** Primary CTA actions, promotional cues, book-now triggers, and key milestones.
- **Budget / Safety (`#10B981`):** Budget surplus, confirmed statuses.
- **Budget Alert / Attention (`#F59E0B`):** Approaching spending caps, pending reservations.
- **Critical / Over Budget (`#F43F5E`):** Cost overruns, canceled itineraries, destructive confirmations.
- **Contextual Categories:** Sky Blue (`#0EA5E9`) for flights and weather alerts; Violet (`#8B5CF6`) for nightlife and cultural programming; Amber/Orange for dining; Emerald for outdoor transit and stays.

## Typography

Typography establishes an intentional contrast between expressive header geometry and functional reading efficiency:

- **Headlines & Labels (Plus Jakarta Sans):** Its open apertures and subtle rounded curves impart a welcoming, optimistic tone across trip destinations, day headers, category tags, and interactive buttons.
- **Body & Data Lists (Inter):** Maximizes scannability across dense travel itineraries, flight durations, itemized pricing tables, and time-stamped schedules.
- **Hierarchy Rules:** 
  - Restrict `display` to hero overview screens and trip title highlights.
  - Apply `title-page` to primary view headers and modal screens.
  - Use uppercase formatting solely with `label-badge` at 11px to maintain clear status identification without overwhelming context.

## Layout & Spacing

The layout is built upon an 8pt base grid for spacing and element sizing, utilizing a responsive 12-column fluid grid system on desktop that gracefully shifts to a single or dual-column configuration on small screens.

### Grid Breakpoints & Behavior
- **Desktop (1024px+):** 12-column layout with max-width containment of 1280px. Gutters set to `1.5rem` (`24px`), outer margins to `2rem` (`32px`). Enables split-screen itinerary schedules alongside live maps or budget analytics.
- **Tablet (768px - 1023px):** 8-column layout. Gutters and canvas margins standard at `1.25rem` (`20px`). Maps collapse to sticky drawer views or switch to toggle tabs.
- **Mobile (< 768px):** 4-column layout. Gutters reduced to `1rem` (`16px`), outer canvas margins set to `1rem` (`16px`). Chronological timelines collapse into full-width vertical stacks.

### Density & Touch Accommodations
- Interactive touch targets adhere to a mandatory 44px vertical envelope minimum for field use during travels.
- Component padding scales dynamically: `space-md` for standard card interiors, `space-sm` for compact category badges, and `space-xl` for spacing between distinct itinerary calendar days.

## Elevation & Depth

Visual depth reinforces temporal order and spatial containment without visual clutter.

### Light Mode Strategy
- **Layer 0 (Canvas):** Pure tint `#F8FAFC`.
- **Layer 1 (Card / Content Blocks):** Pure white `#FFFFFF` paired with an ultra-soft dual ambient shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)`.
- **Layer 2 (Hovered Cards & Modals):** Accentuated lift with focused diffused projection: `0 8px 24px -4px rgba(13, 110, 110, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Floating Overlays (Maps/Filters):** Elevated pill containers with crisp micro-outlines: 1px border of `#E2E8F0` and `0 12px 32px rgba(15, 23, 42, 0.08)`.

### Dark Mode Strategy
- Eliminates heavy dropshadows in favor of surface tonal tiers and crisp boundary rings.
- **Layer 0 (Canvas):** `#090D16`.
- **Layer 1 (Cards):** `#0F172A` paired with a precise 1px stroke of `#1E293B`.
- **Layer 2 (Elevated Sheets / Popovers):** `#1E293B` bounded by a 1px stroke of `#334155`.

## Shapes

The geometric identity balances approachable contours with space-efficient structuring:

- **Cards & Primary Modules:** Fixed at `12px` (0.75rem / custom scale within `rounded-2` family). Soft enough to communicate warmth, structured enough to anchor stacked daily timelines.
- **Interactive Controls (Buttons, Inputs, Selectors):** Normalized to `8px` (0.5rem) to ensure crisp form alignment and compact input density.
- **Pills & Status Indicators:** Fully rounded (`9999px`) reserved strictly for status chips, category pills (Flights, Stays, Activities), and floating map control buttons.

## Components

### Buttons
- **Primary (CTA / Booking):** Sunset Coral background (`#FA5A3A`), white text, 8px corner radius, 44px default height. Hover states transition to `#E04B2C`. Active scales subtly (0.98).
- **Secondary (Itinerary Flow):** Deep Teal outline or filled muted state (`#0D6E6E` / `#E6F4F4`), providing clear visual distinction alongside Coral CTAs.
- **Ghost / Minimal:** Transparent background, slate text (`#64748B`), teal focus rings, hover tone `#F1F5F9`.

### Form Fields & Inputs
- **Base Height:** 44px touch targets.
- **Borders & Corners:** 8px radius with a 1px border (`#CBD5E1` light / `#334155` dark).
- **Focus State:** 2px ring in primary teal (`#14B8A6`) with zero offset to guarantee clarity without shifting surrounding text.
- **Contextual Add-ons:** Dedicated left and right icon slots tailored for location pins, calendars, time pickers, and currency markers.

### Category Chips & Badges
- **Shape & Sizing:** Fully pill-shaped (`9999px`), 28px height, padded with `0.75rem` horizontally.
- **Category Schemes:**
  - *Flights:* Sky light tint (`#E0F2FE`), text `#0369A1`.
  - *Stays:* Emerald light tint (`#D1FAE5`), text `#047857`.
  - *Activities:* Violet light tint (`#EDE9FE`), text `#6D28D9`.
  - *Food & Drinks:* Amber light tint (`#FEF3C7`), text `#B45309`.
  - *Transit:* Slate light tint (`#F1F5F9`), text `#475569`.
- Dark mode utilizes 15% opacity fills with brightened foreground text labels.

### Itinerary Cards
- **Geometry:** 12px corners, standard padding `1rem` to `1.25rem`.
- **Layout:** Vertical drag handles on the left for reordering events; category icon and timestamp centered; right-aligned actions for cost, notes, and sub-items.
- **Status Spine:** Left-edge color-coded border accent (3px) matching the category indicator for rapid peripheral scanning.

### Checkboxes & Radio Elements
- **Dimensions:** 20px x 20px box, centered within a minimum 44px touch padding hitzone.
- **Checked State:** Teal fill (`#0D6E6E`) with white icon check/dot, smooth scale animation.