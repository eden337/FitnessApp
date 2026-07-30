# FitnessApp design system

> **Status: normative.** This document is the source of truth for every mobile
> interface decision. Reference images are inspiration only. When code and this
> document disagree, update one of them and record the decision.

## Product character

FitnessApp is **playful wellness for two**: warm, optimistic, clear, and
accomplishment-oriented. Everyday screens are calm and easy to scan. Color and
motion intensify around missions, progress, partner encouragement, and
celebrations.

### Principles

1. **Progress feels good.** Show the next achievable action and acknowledge it.
2. **Color has a job.** Coral is action, teal is teamwork, violet is progress,
   gold is reward, blue is hydration, and green is success.
3. **Together, not gender-coded.** Coral and teal can represent either partner.
4. **Bilingual by construction.** Hebrew and English receive equal hierarchy.
5. **Accessible delight.** Motion, color, and illustration never carry meaning alone.

## Themes and color

Components consume semantic tokens through `useTheme()`. Primitive colors must
not be imported into screens. Raw colors are allowed only in the theme
definition and approved artwork.

| Role | Light | Dark |
|---|---:|---:|
| Canvas | `#FFF8EE` | `#0D1730` |
| Surface | `#FFFFFF` | `#172341` |
| Alternate surface | `#FFF1DC` | `#203052` |
| Raised surface | `#FFFFFF` | `#26385B` |
| Main text | `#14213D` | `#FFF8EE` |
| Muted text | `#58657D` | `#B5C1D8` |
| Border | `#E6D7C5` | `#344362` |
| Primary/action | `#FF5A47` | `#FF7463` |
| Teamwork | `#19B7A5` | `#39CCB9` |
| Progress | `#6D4AFF` | `#927BFF` |
| Reward | `#F7B928` | `#FFD05A` |
| Hydration | `#34B7F1` | `#64C9F5` |

Light mode is warm cream, not sterile white. Dark mode is layered deep navy,
not pure black. Accent values may change slightly to preserve contrast, but
their meaning cannot. Text and controls target WCAG 2.2 AA.

Preference is `system`, `light`, or `dark`. First run follows the device. An
explicit choice persists locally, and a live device change updates the app
while preference remains `system`.

## Typography, space, and shape

Rubik is the bundled bilingual family. If native font loading reports an error,
the system sans-serif fallback uses this same scale.

| Style | Size / line | Weight |
|---|---:|---:|
| Display | 36 / 42 | 800 |
| Heading 1 | 30 / 36 | 800 |
| Heading 2 | 22 / 28 | 700 |
| Title | 18 / 24 | 700 |
| Body | 16 / 24 | 400 |
| Label | 14 / 20 | 600 |
| Caption | 12 / 18 | 500 |

Spacing follows an 8-point rhythm with 4-point half steps: 4, 8, 12, 16, 24,
32, and 40. Touch targets are at least 48 × 48 logical pixels (44 is permitted
for compact segmented choices). Radii are 8, 14, 20, 28, and pill.

## Food illustration contract

- Visual tone is **polished cartoon food illustration**: immediately
  recognizable silhouettes, dark organic outlines, saturated natural colors,
  dimensional highlights, and restrained shadows. Do not add a repeated face
  treatment; the food identity itself is the character.
- Artwork identity is item-specific: every displayed food item receives its own
  shared `FoodVisualKey`. Related foods may not share a key merely because they
  belong to one family (for example tomato/cherry tomato,
  broccoli/cauliflower, or peach/apricot).
- The approved source sheets live in
  `apps/mobile/assets/food/reference-sheets/`. They contain no captions,
  numbering, branding, or package text.
- The 102 global foods are extracted as individual transparent 256 × 256 PNGs
  in `apps/mobile/assets/food/catalog/`. Keep the extraction script
  (`scripts/slice-food-icons.py`) reproducible and its key order aligned with
  the seeded lists.
- The three vacation-only concepts without supplied artwork retain
  purpose-built vectors. Do not substitute one global food image for them.
- Never tint, invert, desaturate, fade, or blend artwork for a theme. Only the
  surrounding tile and border adapt.
- Tile color comes from a stable family: vegetable, fruit, protein,
  carbohydrate, fat, limited, or generic. Never infer it from string length.
- Every seeded item resolves either to its approved supplied PNG or to one of
  the three explicit vacation vectors. A seed/content test enforces one unique
  key per item, and the mobile artwork test enforces all 102 supplied mappings.
- Images are decorative when the adjacent localized name is the accessible label.

## Components and states

Reusable components define normal, pressed, focused, disabled, loading, error,
and selected states where applicable.

- **Primary button:** coral, high-contrast ink content, 48-pixel minimum height.
- **Secondary button:** surface fill, semantic border, main text.
- **Text action:** no container, coral text, full touch target.
- **Cards:** surface, semantic border, 20-pixel radius; raised cards use shadow.
- **Inputs:** persistent label, semantic border, localized visible error.
- **Segmented controls:** surface choices and a filled selected choice.
- **Progress:** violet individual, teal shared, gold reward, with a text value.
- **Food rows:** 64-pixel art tile, title, optional portion/notes, row divider.

## Screen patterns

- **Home:** greeting, motivational line, program momentum ring, mission preview,
  partner card, and next actions. It never displays weight, BMI, age, BMR, TDEE,
  calorie targets, appearance controls, or language controls.
- **Profile:** private current weight, BMI, and age. Body information stays out
  of shared and motivational surfaces.
- **Settings:** language, appearance, account actions, and future app-level
  preferences.
- **Today:** week context, mission hero first, rationale second, numbered tactile
  tasks, then references.
- **Food Guide:** colorful choice summary and filters first, then illustrated
  list cards with per-section counts and clear metadata.
- **Celebration:** one result, one reward, partner acknowledgement, one next action.
- **Auth/profile/couple/progress:** share the same primitives and visual language.

Every secondary screen starts with the same 48-pixel Back control. Nested
destinations pop to their actual parent (Food Guide → Today → Home), and Android
hardware Back follows the same route stack.

Weight progress is maintenance-only. It is absent throughout the 13-week
foundation program and appears only after completion.

## Motion

| Tier | Duration | Use |
|---|---:|---|
| Feedback | 120 ms | press, checkbox, compact state change |
| Transition | 220 ms | reveal, progress fill, element entry |
| Celebration | ~420 ms | badge pop, milestone completion |

No decorative loops on task screens. Confetti is brief and non-blocking. With
reduced motion, replace travel, scale, and confetti with opacity or immediate
state updates. Resolve the platform reduced-motion preference before starting
any entrance animation so the first rendered frame cannot animate prematurely.

## RTL, accessibility, and governance

- Use logical alignment and locale-aware icon direction. Do not mirror food
  art, logos, charts, or numerals.
- All visible copy comes from i18n. Validate Hebrew/English wrapping and large text.
- Never communicate status with color alone.
- Controls require roles, sufficient labels, disabled state, and focus order.
- Validate Home, Today, Food Guide, Profile, and Settings in light/dark, HE/EN,
  RTL/LTR, large text, and reduced motion.
- Run browser-level navigation flows in Playwright for release milestones;
  cover nested Back, Profile, Settings, and foundation/maintenance route gating.
- New UI must use semantic tokens, reuse shared components, meet contrast and
  target sizes, cover relevant states, and update this document when the shared
  language changes.
