# Modern Mobile & Tablet Navigation & UX Transformation

Modernize the TravelMate navigation architecture and layout for all screens below 1024px (mobile & tablet) into a thumb-optimized, native app-like experience while strictly preserving the desktop sidebar, desktop layout, data models, and brand aesthetics at 1024px and above.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1:
> - **Bottom Navigation Style**: Edge-to-edge docked bar with soft backdrop blur and rounded top corners (`rounded-t-2xl`), respecting device safe areas (`pb-safe`).
> - **Quick Action (+) Trip Routing**: When tapping "Add Activity" or "Add Expense" without an active trip, prompt the user with a sleek Trip Picker bottom sheet to select their destination before proceeding.
> - **Mobile Modality**: All centered modals on mobile/tablet will render as native-feeling bottom sheets with grab handles, backdrop blurs, and swipe/drag down dismissibility.

---

## 1. Overview & Core Concept

- **What It Does**: Completely retires hamburger menus, drawer sidebars, and desktop topbars on screen widths below 1024px. Introduces a persistent 64px docked bottom navigation bar with 5 primary slots (Home, Trips, elevated Coral (+), Explore, and More sheet), an adaptive top app bar with expandable search, thumb-friendly card layouts, swipeable itinerary milestones, snap-scroll dashboard summaries, and an interactive itinerary map bottom sheet.
- **Target Audience / Persona**: Travelers on smartphones (375px–430px) and tablets (768px–1023px) who need single-handed navigation, fast trip logging, and map inspection while on the move.
- **Key Value**: Eliminates reach fatigue, provides instant access to core tools within the natural thumb zone, prevents keyboard overlap, and optimizes tablet screens with dual-column productivity.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Color Palette**: Retains existing TravelMate tokens (`primary` teal, `secondary` coral `#F97316`/`#E0533C`, `surface-container`, dark/light slate tokens).
- **Bottom Navigation Bar**:
  - Docked at viewport bottom (`fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 rounded-t-2xl shadow-lg`).
  - Height: 64px plus safe-area padding (`pb-safe`).
  - Active Tab: Teal icon (`text-teal-600 dark:text-teal-400`), pill indicator backdrop (`bg-teal-500/15 px-3 py-0.5 rounded-full`), 11px label.
  - Inactive Tab: Slate outline icon (`text-slate-500 dark:text-slate-400`), 11px label.
  - Center Quick Action (+): 56px circular coral button with soft shadow, raised -18px above the bar dock, featuring tactile tap bounce.
- **Mobile Top App Bar**:
  - 52px slim header (`sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800`).
  - Left: Contextual title (or back chevron on sub-screens/detail views).
  - Right: Expandable search toggle (opens animated full-width input) and notification bell with badge.
- **Bottom Sheets**:
  - Rounded top corners (`rounded-t-3xl`), grab handle (`w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5`), backdrop overlay (`bg-slate-900/60 backdrop-blur-xs`), smooth slide-up spring transitions (180ms–220ms).

### Key Mobile Flows

```
[ BOTTOM NAVIGATION DOCK & QUICK SHEETS ]

+-------------------------------------------------------------+
| Slim Top Bar:  TravelMate / [Trip Title]    [Search]  [Bell]|
+-------------------------------------------------------------+
|                                                             |
|  [Horizontal Day Selector: Day 1 · Day 2 · Day 3 · Day 4]   |
|                                                             |
|  [=== Activity Card: Arashiyama Bamboo Grove =============] |
|  [ Swipe Right -> Edit ]      [ Swipe Left -> Delete ]      |
|                                                             |
|  [ Itinerary Map: Peek · Half · Full Snap Bottom Sheet ]    |
|                                                             |
+-------------------------------------------------------------+
|                    [ + Coral ]                              |
|  [Home]      [Trips]    (56px)     [Explore]       [More]   |
+-------------------------------------------------------------+
```

1. **Center (+) Quick Action Sheet**:
   - Tapping (+) opens quick options: "New Trip", "Add Activity", "Add Expense".
   - If active trip exists, opens corresponding creation modal/sheet. If not, presents a fast trip picker sheet.
2. **"More" Hub Sheet**:
   - Two-column grid of spacious touch tiles: Expenses, Calendar, Notifications (with unread badge), Settings, Dossier PDF, and Admin.
   - Top banner: User avatar, name, and 3-way Appearance switch (Light / Dark / System).
3. **Trip & Itinerary Experience**:
   - Segmented horizontal control (Itinerary | Expenses | Summary) sticky below the top bar.
   - Day chips scroll horizontally with smooth snapping.
   - Activity cards support touch-drag gestures: swipe right to reveal Edit, swipe left to reveal Delete.
   - Map available as a 3-snap-point bottom sheet (Peek 80px preview, Half 50% viewport, Full 92% screen).
4. **Keyboard & Form Awareness**:
   - Automatically hides the bottom nav bar when virtual keyboard opens or when entering full-screen form flows to prevent viewport occlusion.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Edge-to-edge docked bottom bar over floating pill**
  - *Chosen Approach*: Docked with rounded top corners and `pb-safe`.
  - *Why*: Provides clean ergonomics on rounded smartphone corners (iPhone dynamic island & home indicators, Android gesture bars), prevents accidental background taps through margins, and maximizes available screen height.
- **Decision 2: Strict Breakpoint Guard (`< 1024px`)**
  - *Chosen Approach*: Use `lg:` Tailwind breakpoint (`1024px`) as the strict boundary. At 1024px and wider, desktop sidebar and layout remain 100% identical. Below 1024px, the mobile bottom nav bar, slim top bar, and bottom sheets activate.
  - *Why*: Tablet devices (768px–1023px) gain the ergonomics of bottom navigation while leveraging tablet screen width for 2-column content; desktop users keep the full curated sidebar.
- **Decision 3: Swipeable Card Actions with Touch Fallbacks**
  - *Chosen Approach*: Touch-friendly horizontal swipe handlers with explicit visible action fallback buttons when not dragging, ensuring WCAG accessibility and predictable behavior.
- **Decision 4: Virtual Viewport Keyboard Handling**
  - *Chosen Approach*: Track `window.visualViewport` height changes and focused `<input>`/`<textarea>` elements to hide the bottom bar whenever the software keyboard is active.

---

## 4. Technical Architecture & Component Structure

```
+─────────────────────────────────────────────────────────────+
│                         App.tsx                             │
│  - Breakpoint controller (lg: sidebar vs. <lg: mobile app) │
│  - Virtual keyboard listener                                │
+──────────────────────────────┬──────────────────────────────+
                               │
       ┌───────────────────────┴────────────────────────┐
       ▼                                                ▼
+──────────────────────────────+   +──────────────────────────────+
│   Desktop Layout (>= 1024)   │   │   Mobile/Tablet UX (< 1024)  │
│  - Persistent Sidebar.tsx    │   │  - MobileTopAppBar.tsx       │
│  - Desktop Header.tsx        │   │  - MobileBottomNav.tsx       │
│  - Desktop Modals            │   │  - QuickActionSheet.tsx      │
│                              │   │  - MoreMenuSheet.tsx         │
│                              │   │  - TripPickerSheet.tsx       │
│                              │   │  - MobileBottomSheet wrapper │
+──────────────────────────────+   +──────────────────────────────+
```

### Components to Create & Refactor:
1. `src/components/mobile/MobileBottomNav.tsx`: Docked 5-slot navigation bar with active teal pill indicator, raised 56px coral (+) button, and keyboard suppression.
2. `src/components/mobile/MobileTopAppBar.tsx`: Slim header with collapsible title, expandable search field, notification badge, and back button for sub-views.
3. `src/components/mobile/QuickActionSheet.tsx`: Bottom sheet presenting New Trip, Add Activity, Add Expense, and trip-picker routing.
4. `src/components/mobile/MoreMenuSheet.tsx`: 2-column grid sheet for Expenses, Calendar, Notifications, Settings, Dossier, and theme mode switch.
5. `src/components/mobile/MobileBottomSheet.tsx`: Reusable bottom sheet with drag handle, backdrop blur, swipe-down dismiss, and safe-area padding.
6. `src/components/mobile/TripPickerSheet.tsx`: Lightweight picker for selecting an active trip before adding activities or expenses.
7. Refinements in `App.tsx`: Remove mobile hamburger menu & drawer; integrate `MobileTopAppBar` and `MobileBottomNav` for `< 1024px`.
8. Responsive card & itinerary adaptations in `DashboardScreen.tsx`, `TripsScreen.tsx`, and `ExpensesScreen.tsx` for horizontal snap-scroll, cards over tables, swipe gestures, and tablet 2-column layouts.
