---
version: alpha
name: JamJar
description: Playful family music request app with kid-friendly profiles, parent approval, and vibrant gradient aesthetics.
colors:
  primary: "#7C3AED"
  on-primary: "#FFFFFF"
  primary-container: "#EDE9FE"
  on-primary-container: "#5B21B6"
  secondary: "#DB2777"
  on-secondary: "#FFFFFF"
  tertiary-container: "#DBEAFE"
  on-tertiary-container: "#1E40AF"
  surface: "#FFFFFF"
  on-surface: "#1F2937"
  surface-variant: "#F3F4F6"
  on-surface-variant: "#4B5563"
  outline: "#E5E7EB"
  error: "#EF4444"
  on-error: "#FFFFFF"
  success: "#22C55E"
  on-success: "#FFFFFF"
  success-container: "#DCFCE7"
  error-container: "#FEE2E2"
  on-error-container: "#991B1B"
  warning-container: "#FEF3C7"

typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title-lg:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  title-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.5
  body-lg:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.01em"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  "2xl": 24px
  "3xl": 32px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  page-background:
    backgroundColor: "#F9FAFB"
    textColor: "{colors.on-surface}"
  page-background-dark:
    backgroundColor: "#1A1A2E"
    textColor: "#E5E7EB"
  icon-success:
    textColor: "{colors.success}"
    size: "20px"
  icon-error:
    textColor: "{colors.error}"
    size: "20px"
  card-elevated:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    typography: "{typography.body-md}"
  navbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    padding: "16px 24px"
  pin-dot:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: "16px"
  pin-dot-empty:
    backgroundColor: "{colors.outline}"
    rounded: "{rounded.full}"
    size: "16px"
  toast-success:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  toast-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  toast-warning:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  toast-info:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  swipe-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  swipe-overlay-approve:
    backgroundColor: "#15803D"
    textColor: "{colors.on-success}"
    rounded: "{rounded.full}"
    typography: "{typography.label}"
  swipe-overlay-reject:
    backgroundColor: "#B91C1C"
    textColor: "{colors.on-error}"
    rounded: "{rounded.full}"
    typography: "{typography.label}"
  status-badge-pending:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  status-badge-approved:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  status-badge-rejected:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  status-badge-downloading:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  status-badge-completed:
    backgroundColor: "#DCFCE7"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  status-badge-failed:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  tag-purple:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
  tag-blue:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
  tag-red:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
  segmented-control-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    typography: "{typography.label}"
  segmented-control-inactive:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    typography: "{typography.label}"
  search-result-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  search-result-item-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  modal-backdrop:
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  modal-content:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  success-state-card:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "48px"
  profile-card-yoto:
    backgroundColor: "linear-gradient(135deg, #FACC15, #F97316)"
    textColor: "#FFFFFF"
    rounded: "{rounded.3xl}"
    padding: "32px"
  profile-card-ipod:
    backgroundColor: "linear-gradient(135deg, #60A5FA, #A855F7)"
    textColor: "#FFFFFF"
    rounded: "{rounded.3xl}"
    padding: "32px"
  profile-card-parent:
    backgroundColor: "linear-gradient(135deg, #374151, #111827)"
    textColor: "#FFFFFF"
    rounded: "{rounded.3xl}"
    padding: "32px"
---

## Overview

JamJar is a **playful, family-first music request app** where kids search for songs and parents approve them with a swipe. The design language balances **childlike delight** with **parental clarity** — vibrant gradients and bouncy motion for kids, clean dashboards and readable data for parents.

The aesthetic is "Friendly Gradient Pop" — soft purple-pink-blue gradients, oversized rounded corners, and emoji-driven personality. Every interaction feels tactile and rewarding, from the bouncy PIN pad to the satisfying swipe approval cards.

## Colors

The palette is built around a **warm purple primary** with **pink and blue accents**, grounded in neutral grays for readability.

- **Primary (#7C3AED):** Violet — the main action color for buttons, PIN dots, active nav states, and approve actions.
- **Secondary (#DB2777):** Hot pink — used for reject actions, accent highlights, and playful moments.
- **Tertiary (#2563EB):** Blue — used for info states, links, and the iPod profile theme.
- **Surface (#FFFFFF):** Clean white cards and inputs in light mode.
- **Background (#F9FAFB):** Barely off-white page background in light mode.
- **Dark Background (#1A1A2E):** Deep indigo-black for dark mode — softer than pure black, easier on kids' eyes at bedtime.
- **Dark Surface (#1F2937):** Charcoal for cards and elevated surfaces in dark mode.
- **Error (#EF4444):** Red for validation errors and rejection confirmations.
- **Success (#22C55E):** Green for approval confirmations and completed downloads.
- **Warning (#F59E0B):** Amber for pending states and cautionary messages.

### Profile Gradients

Each user profile has a signature gradient that creates instant visual identity:

- **Yoto Kid:** Yellow-to-orange (`#FACC15` → `#F97316`) — warm, sunny, playful.
- **iPod Kid:** Blue-to-purple (`#60A5FA` → `#A855F7`) — cool, modern, creative.
- **Parent:** Gray-to-dark (`#374151` → `#111827`) — mature, authoritative, calm.

## Typography

JamJar uses the **system font stack** for instant familiarity and fast loading. Text is bold and readable at a distance (for kids) and comfortable for extended reading (for parents).

- **Display (2.25rem, bold):** Page titles and hero text. Tight letter-spacing for punch.
- **Headline (1.5rem, bold):** Card titles, section headers.
- **Title Large (1.25rem, semibold):** Sub-sections, list item titles.
- **Body Large (1.125rem, regular):** Primary reading text for descriptions and instructions.
- **Body Medium (1rem, regular):** Default body text, form labels, metadata.
- **Label (0.875rem, medium):** Buttons, tags, badges, navigation links.
- **Caption (0.75rem, regular):** Timestamps, helper text, counts.

## Layout

The layout follows a **single-column centered container** with generous breathing room.

- **Max content width:** 72rem (`max-w-6xl`)
- **Page padding:** 16px on mobile, 24px on tablet, 32px on desktop
- **Section spacing:** 32px between major sections
- **Card grid:** 1 column on mobile, 2 on tablet, 3 on desktop
- **Touch targets:** Minimum 48px for all interactive elements (PIN pad buttons, swipe cards, nav items)

## Elevation & Depth

Elevation is expressed through **shadows** rather than borders, creating a soft, floating aesthetic.

- **Navbar:** `shadow-md` — subtle separation from content.
- **Standard Cards:** `shadow-xl` — prominent lift for content containers (search form, request lists).
- **Elevated Cards / Swipe Cards / Modals:** `shadow-2xl` — highest elevation for draggable cards and overlay modals.
- **Toasts:** `shadow-lg` — mid-level elevation for notifications.
- **Buttons:** No shadow at rest, `scale(1.02)` on hover for tactile feedback. Primary action uses `hover:shadow-lg`.
- **PIN pad keys:** `bg-gray-50` with subtle hover shift — flat but tactile.

Dark mode uses **surface color shifts** rather than shadows for depth, since shadows are less visible on dark backgrounds.

## Shapes

JamJar is aggressively rounded — every corner is softened to feel approachable and safe for kids.

- **Small elements (tags, badges):** 8px (`rounded-lg`)
- **Buttons, inputs, toasts:** 16px (`rounded-xl`)
- **Cards, modals:** 24px (`rounded-2xl`)
- **Profile cards, login buttons:** 32px (`rounded-3xl`)
- **Avatar frames, PIN dots, status indicators:** Fully circular (`rounded-full`)

## Components

### Buttons

- **Primary:** Violet background, white text, 16px radius, 12px 24px padding. Hover: violet-100 background, violet-900 text.
- **Secondary:** Pink background, white text. Used for destructive or alternative actions.
- **Profile Cards:** Full gradient backgrounds (yellow-orange, blue-purple, or gray-black), white text, 32px radius, large emoji + name stacked vertically. Hover: `scale(1.05)` with Framer Motion spring.

### Cards

- **Standard Card:** White surface, 24px radius, 24px padding, `shadow-xl`. Dark mode: charcoal surface.
- **Swipe Card (Approval):** Full-width card with thumbnail, title, artist, and swipe hints. Drag-enabled with Framer Motion, rotates based on drag direction.

### Inputs

- **Text Input:** White/dark gray background, 16px radius, 12px 16px padding. `border-2 border-gray-200` at rest; focus state changes border color to `purple-500` with `outline-none`.
- **PIN Dots:** 16px circles, filled violet when entered, gray outline when empty. Spring animation on fill.
- **Textarea:** Same treatment as text input, used for custom rejection reasons in the reject modal.

### Navigation

- **Navbar:** White surface, `shadow-md`, 16px vertical padding. Links: gray-700 inactive, violet-600 active. Dark mode: gray-800 surface.
- **Mobile:** Hamburger or bottom sheet (if implemented). Touch targets minimum 48px.

### Toast Notifications

- **Success:** Light green background (`success-container`) with green border, gray text, 16px radius, `shadow-lg`, slides in from top-right with Framer Motion.
- **Error:** Light red background (`error-container`) with red border, gray text.
- **Warning:** Light amber background (`warning-container`) with amber border, gray text.
- **Info:** Light blue background (`tertiary-container`) with blue border, gray text.
- **Auto-dismiss:** 3 seconds with exit animation.

### Status Badges

- **Pending:** Amber pill badge.
- **Approved:** Green pill badge.
- **Rejected:** Red pill badge.
- **Downloading:** Blue pill badge with subtle pulse animation.
- **Completed:** Green pill badge with checkmark icon.

## Do's and Don'ts

### Do

- **Use gradients for profile selection** — they create instant emotional connection for kids.
- **Keep touch targets large** — every button, card, and PIN key must be easy for small fingers.
- **Use Framer Motion for transitions** — spring physics feel playful and responsive.
- **Maintain high contrast in both modes** — WCAG AA minimum for all text.
- **Use emojis liberally** — they reduce reading load for young users and add personality.
- **Show clear feedback** — toast notifications, loading spinners, and status badges for every action.

### Don't

- **Don't use sharp corners** — avoid `rounded-none` or small radii; they feel harsh and uninviting.
- **Don't use pure black in dark mode** — stick to `#1A1A2E` to reduce eye strain.
- **Don't clutter the kid UI** — keep their screens focused on search → select → request.
- **Don't use red for approve actions** — red is strictly for reject, delete, and error states.
- **Don't use small text for critical info** — PINs, status, and actions must be readable at a glance.
- **Don't forget dark mode** — parents (and kids at night) will appreciate the switch.
