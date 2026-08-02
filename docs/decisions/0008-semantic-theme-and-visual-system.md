# ADR 0008: Semantic theme and visual system

## Status

Accepted.

## Context

The mobile client imported one static dark palette directly into every screen.
That prevented a correct light theme, made color difficult to govern, and let
food-tile presentation vary by an arbitrary string calculation.

## Decision

The client uses typed light and dark semantic themes resolved by a provider.
Preference is `system`, `light`, or `dark`, defaults to the device, and persists
locally. Screens consume semantic roles rather than primitive colors.

Food artwork has a fixed, theme-independent palette. Theme changes affect only
its container. Custom SVG art progressively replaces the complete Noto fallback
library without leaving a shared visual key unresolved.

[`docs/design/design.md`](../design/design.md) is the normative visual source of
truth.

## Consequences

- Themes update without restart.
- New components require light, dark, RTL, and accessibility consideration.
- Raw colors are limited to theme and artwork modules.
- Illustration migration is incremental and requires no API/schema change.
