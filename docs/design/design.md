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

- The target library has one custom outlined vector per shared `FoodVisualKey`.
  Canvas is 96 × 96 with an 8-unit safe area.
- Outlines use `#17213F`, rounded joins, and a four-unit standard stroke.
- Permanent fills are theme-invariant: leaf `#58B947`, dark leaf `#2F8E42`,
  red `#F24F4F`, orange `#F79335`, yellow `#F7C948`, purple `#7D4CB8`, blue
  `#4EA8DE`, cream `#FFF2CF`, and brown `#9A633A`.
- Never tint, invert, desaturate, fade, or blend artwork for a theme. Only the
  surrounding tile and border adapt.
- Tile color comes from a stable family: vegetable, fruit, protein,
  carbohydrate, fat, limited, or generic. Never infer it from string length.
- Existing Noto assets are transitional fallbacks. Every key must resolve while
  custom art rolls out by family.
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
  partner card, colorful health snapshot, and next actions.
- **Today:** week context, mission hero first, rationale second, numbered tactile
  tasks, then references.
- **Food Guide:** colorful choice summary and filters first, then illustrated
  list cards with per-section counts and clear metadata.
- **Celebration:** one result, one reward, partner acknowledgement, one next action.
- **Auth/profile/couple/progress:** share the same primitives and visual language.

Preferences remain grouped below Home actions until a dedicated settings route
is introduced.

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
- Validate Home, Today, and Food Guide in light/dark, HE/EN, RTL/LTR, large
  text, and reduced motion.
- New UI must use semantic tokens, reuse shared components, meet contrast and
  target sizes, cover relevant states, and update this document when the shared
  language changes.
