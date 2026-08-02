# ADR 0009: Weight tracking begins after the foundation program

- Status: Accepted
- Date: 2026-07-30

## Context

The Aba Hatuv foundation program explicitly avoids weighing during its full
13-week span. Showing a weight chart or inviting a weigh-in during that period
contradicts the program and shifts attention away from behavior.

An initial weight is still needed during private profile setup for personal
calculations. That value is profile information, not an in-program progress
signal.

## Decision

Weight logging and weight history are available only after the user's
foundation program status is `completed`.

- Before completion, the mobile client does not fetch or expose weight progress.
- The server independently rejects weight history and writes with
  `409 maintenance_only`.
- Current weight, BMI, and age are private Profile information and never appear
  on Home.
- Maintenance weight tracking is a relapse-prevention aid, not a foundation
  program goal or score.

## Consequences

Home and the 13-week journey focus on actions, consistency, missions, and
partner support. Both client and server enforce the rule, so an outdated client
cannot bypass it. Existing weight logs remain private and become visible again
in maintenance.
