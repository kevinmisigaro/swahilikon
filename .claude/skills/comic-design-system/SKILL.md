---
name: comic-design-system
description: Use whenever styling, building, or polishing UI in this project (pages, components, CSS) — covers the comic-book visual language (colors, fonts, ink borders, textures, buttons/badges) so new work matches the existing look instead of defaulting to generic Tailwind styles.
---

Swahili KomikCon's site uses a bold, hand-drawn comic-book look: thick black ink outlines, offset drop shadows, halftone dot textures, and a saturated primary palette. Before styling anything new, reuse what's documented here instead of inventing new patterns.

## Colors (defined in `app/globals.css`, exposed as Tailwind utilities)

| Token | Hex | Use |
|---|---|---|
| `comic-red` | `#c0272f` | primary accent, CTAs, dates |
| `sky-blue` | `#29aae0` | secondary accent |
| `hero-green` | `#019245` | success / "available" state |
| `golden-orange` | `#e58622` | highlight, "upcoming" state |
| `action-orange` | `#f35e24` | secondary CTA |
| `comic-black` | `#111111` | ink, text, borders |
| `warm-white` | `#fff9f4` | page background |

Use these via Tailwind classes (`bg-comic-red`, `text-sky-blue`, `border-comic-black`, etc.), not raw hex or arbitrary new colors. If a new state/accent is genuinely needed, add it to `:root` and `@theme inline` in `app/globals.css` first, following the existing naming pattern.

## Typography

- Headings (`h1`–`h3`, or `.font-display`) use the display font (Bangers) automatically — don't override with another font.
- Body text uses the sans font (Poppins) by default via `body`.
- Display headlines on hero/banner sections can add `.text-outline` for a thick ink-stroke effect.

## Core visual utilities (already in `app/globals.css` — reuse, don't recreate)

- `.comic-panel` / `.comic-panel-sm` — thick black border + offset drop-shadow "ink panel" look. Use for cards, buttons, images.
- `.halftone` / `.halftone-red` — dot-pattern texture for decorative or empty-state backgrounds.
- `.speech-bubble` — rounded bubble with a tail, border + white fill. Use for callouts/quotes, not generic cards.
- `.bg-grain` — subtle grain texture overlay.
- `.motion-safe-wiggle` — small hover rotate/scale, respects `prefers-reduced-motion`. Add to interactive/clickable elements, not static content.

## Component patterns (reuse these, don't rebuild)

- **Buttons**: `components/ui/ComicButton.tsx` — `ComicButton` (link) / `ComicButtonAsButton`. Variants: `red | blue | green | orange | black | outline`. Rounded-full, `comic-panel-sm`, display font. Use for every CTA instead of ad-hoc `<button>` styling.
- **Badges**: `components/ui/Badge.tsx` — pill badges with tone-matched background/text/border at 15% opacity fill (`available | used | disabled | upcoming | past | neutral`). Use for status tags.
- **Section headings**: `components/ui/SectionHeading.tsx` — optional black pill "eyebrow" label above a display-font `h2`. Use for page/section titles instead of a bare `<h2>`.
- **Cards**: follow `components/site/EventCard.tsx` as the reference — `comic-panel` + `motion-safe-wiggle`, rounded-2xl, white fill, image with a thick bottom border, badge overlaid top-left, display-font title, red date line, muted description.

## General rules when improving a page's look

1. Check `components/ui/` and `components/site/` first — reuse an existing component/variant before writing new markup.
2. Keep the ink-outline + offset-shadow motif (`comic-panel`/`comic-panel-sm`) for anything card- or button-like; don't introduce soft shadows or borderless "flat" Material/SaaS styling, which clashes with the comic aesthetic.
3. Keep corners either fully rounded (`rounded-full`, buttons/badges) or chunky (`rounded-2xl`, cards) — avoid small/subtle radii like `rounded-md`.
4. Stick to the palette above; avoid grays/blues outside it except `comic-black` at reduced opacity (e.g. `text-comic-black/70`) for muted text.
5. Add `.motion-safe-wiggle` to new clickable cards/buttons for consistency, but skip it on large hero images or long text blocks.
6. Prefer the display font for anything that reads as a "headline" (section titles, card titles, big numbers); keep body copy, labels, and form fields in the sans font.
