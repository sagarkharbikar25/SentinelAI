# Design Engineering Plan: Workstation UI Polish & Anti-Slop Pass

**Target Surfaces:**
1. `frontend/src/app/audit-logs/page.tsx` (Log & Audit Flight Recorder)
2. `frontend/src/components/PermissionPromptDialog.tsx` (Interactive Permission Prompt Dialog)
3. `frontend/src/components/layout/Sidebar.tsx` & `Navbar.tsx` (Shell Navigation)

---

## 1. Problem Breakdown & Evidence

### Finding 1: Gratuitous Glow and Extreme Heavy Borders on Interactive Modals
- **Location:** `frontend/src/components/PermissionPromptDialog.tsx#L113`
- **Violation:** `shadow-[0_0_50px_rgba(255,84,73,0.25)] border-2 border-[#FF5449]/60` violates Rule 1 (Restrained surface elevation & Anti-Slop).
- **Correction:** Replace arbitrary heavy neon glow with disciplined `ring-1 ring-red-500/30` or `border border-red-500/30 shadow-xl` and subtle card background `bg-[#0E131F]`.

### Finding 2: All-Caps Button Text, Labels, and Missing Sentence Case & Typography Helpers
- **Location:**
  - `frontend/src/app/audit-logs/page.tsx#L144-L160`: `"APPEND-ONLY FLIGHT RECORDER // IMMUTABLE AUDIT TRAIL"`, `"VERIFY CRYPTOGRAPHIC LOG"`
  - `frontend/src/components/PermissionPromptDialog.tsx#L121-L137`: `"HUMAN CONFIRMATION REQUIRED"`, `"30s AUTO-BLOCK"`
- **Violation:** Rule 3 (Typography): "Keep UI labels, navigation links, and buttons in sentence case." Headings lack `text-balance`; body descriptions lack `text-pretty`.
- **Correction:**
  - Update headings to sentence case: "Audit log flight recorder", "Human confirmation required".
  - Add `text-balance` to headings and `text-pretty` to description paragraphs.
  - Convert action buttons to sentence case: "Verify cryptographic log", "Export CSV", "Export JSON".

### Finding 3: Sizing Utilities & Tabular Numbers Across Metrics and Tables
- **Location:**
  - Throughout `audit-logs/page.tsx` and `PermissionPromptDialog.tsx`: `w-4 h-4`, `w-5 h-5`, `w-3.5 h-3.5` on square icons/buttons instead of `size-4`, `size-5`, `size-3.5`.
  - Timestamp and hash columns in audit log table lack `tabular-nums`.
  - Icon-only close button (`<X className="w-4 h-4" />`) lacks `aria-label="Close dialog"`.
- **Violation:** Rule 2 & 4: "Use `size-*` for square elements", "Use `tabular-nums` for timestamps, counts, tables", "Always provide `aria-label` or visually hidden screen reader text on icon-only buttons."
- **Correction:**
  - Replace `w-X h-X` with `size-X`.
  - Add `tabular-nums font-mono` to timestamps, row counts, and hash strings.
  - Add `aria-label="Close dialog"` to icon-only modal close buttons.

---

## 2. Implementation Execution Steps (Self-Contained)

### Step 1: Polish `PermissionPromptDialog.tsx`
- Replace `shadow-[0_0_50px_...]` with `shadow-2xl border border-red-500/30 ring-1 ring-red-500/20`.
- Change `w-5 h-5` / `w-3.5 h-3.5` / `w-4 h-4` to `size-5`, `size-3.5`, `size-4`.
- Add `aria-label="Close dialog"` to the close `<button>`.
- Convert uppercase badges and headings to clean sentence case (`Human confirmation required`, `30s auto-block`).
- Add `tabular-nums` to the countdown timer span.

### Step 2: Polish `AuditLogsPage.tsx`
- Convert header to sentence case with `text-balance` on `<h2>` and `text-pretty` on `<p>`.
- Convert `"VERIFY CRYPTOGRAPHIC LOG"` and export buttons to sentence case (`"Verify cryptographic log"`).
- Replace `w-4 h-4`, `w-6 h-6`, `w-3.5 h-3.5` with `size-4`, `size-6`, `size-3.5`.
- Add `tabular-nums font-mono` to all table timestamp, risk score, and hash cells.
- Refactor hardcoded `#3F4850` / `#93CCFF` borders to Tailwind token references where applicable.

### Step 3: Polish `Sidebar.tsx` and `Navbar.tsx`
- Ensure all navigation links use sentence case ("Home", "Backup vault", "Log & audit", "Test lab", "Settings").
- Use `size-5` on navigation icons.
- Ensure active states use subtle surface contrast rather than bright glow.

---

## 3. Verification Criteria
1. Next.js production build (`npm run build` in `frontend/`) completes with exit code 0.
2. Accessibility check: Icon buttons have accessible screen-reader labels.
3. Visual review: No gratuitous glow, balanced typography, tabular numbers on all live data columns.
