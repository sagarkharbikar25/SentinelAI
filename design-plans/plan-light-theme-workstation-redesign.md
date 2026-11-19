# Plan: Premium Light Sage & Porcelain Workstation Redesign

**Context & Reference:**
The user requested replacing the generic, overly dense cyberpunk dark dashboard (as shown in the provided screenshot) with a world-class, premium light theme inspired by modern architectural design systems (referencing the Nexora aesthetic: soft sage/mint wash, porcelain white cards, generous whitespace, refined typography, and elegant micro-interactions).

---

## 1. Design Language & Tokens

### Palette (Porcelain & Sage Defense)
- **Canvas / Body:** `#F6F8F6` (serene light sage porcelain wash)
- **Surface / Cards:** `#FFFFFF` (crisp white)
- **Active / Hover:** `#EDF4EF` (soft pale mint)
- **Borders:** `#E2EAE4` (subtle organic hairline border, `border-black/[0.06]`)
- **Primary Text:** `#121C16` (deep forest obsidian)
- **Muted Text:** `#536459` (calm graphite sage)
- **Accent Emerald / Mint:** `#166534` (text) on `#EAF5EE` (background) with `#BBF7D0` (border)
- **Accent Blue / Info:** `#0369A1` (text) on `#F0F9FF` (background) with `#BAE6FD` (border)
- **Warning / Prompt:** `#B45309` (text) on `#FEFCE8` (background) with `#FEF08A` (border)
- **Critical / Intercept:** `#B91C1C` (text) on `#FEF2F2` (background) with `#FECACA` (border)

### Typography & Spacing
- Headings: `font-heading font-bold text-balance text-[#121C16]`
- Body: `font-sans text-pretty text-[#536459]`
- Numbers & Counters: `tabular-nums font-mono`
- Labels & Badges: Sentence case (no screaming ALL-CAPS hacker noise)
- Corner Radii: `rounded-2xl` for cards, `rounded-xl` for interactive elements

---

## 2. Scope of Changes

1. **Tokens & Base Styles**
   - `frontend/src/app/globals.css`: Update root variables to light porcelain/sage palette; remove dark gradients; configure crisp text rendering.
   - `frontend/tailwind.config.js`: Define semantic light tokens (`background`, `surface`, `card`, `border`, `sage`, `forest`).

2. **Shell Navigation & Identity**
   - `frontend/src/components/layout/Sidebar.tsx`: White porcelain sidebar, soft mint active navigation pills, SentinelAI brand emblem.
   - `frontend/src/components/layout/Navbar.tsx`: Crisp top header with live clock, connection status indicator, and notification bell.
   - `frontend/src/components/icons/SvgIcons.tsx`: Refine SVG icons with clean vector strokes optimized for light backgrounds.

3. **Splash Screen & Loading States**
   - `frontend/src/components/ui/SplashScreen.tsx`: Redesign into a premium, calm light-mode splash screen with smooth progress bar and elegant step messages.
   - Add structural loading skeletons for instant, jitter-free rendering.

4. **Workstation Surfaces**
   - `frontend/src/app/page.tsx`: De-clutter the dashboard. Replace the 6 colored noisy test buttons with a clean header toolbar. Clean metric cards with tabular numbers. Elegant threat evaluation and activity feed.
   - `frontend/src/app/audit-logs/page.tsx`: Light table with clean zebra striping, soft status badges, and sentence case.
   - `frontend/src/app/vault/page.tsx`: Clean porcelain file cards with SHA-256 tags and restore actions.
   - `frontend/src/app/lab/page.tsx`: Clean test wizard with soft amber/emerald chaos badges.
   - `frontend/src/app/settings/page.tsx`: Crisp settings toggles and sliders.
   - `frontend/src/components/PermissionPromptDialog.tsx`: Elegant, high-assurance modal dialog with clear action hierarchy.

---

## 3. Verification Criteria
1. Next.js production build (`npm run build`) exits 0 with 0 TypeScript/ESLint errors.
2. Verified light mode rendering across `/`, `/vault`, `/audit-logs`, `/lab`, `/settings`.
3. Splash screen loads gracefully and transitions smoothly to dashboard.
4. Backend test suite (`pytest daemon/tests/`) remains 100% green (44/44 passed).
