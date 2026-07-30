# ADR 0010 — Explicit privacy-safe shared activities

## Status

Accepted.

## Context

FitnessApp should make healthy progress social without exposing weight, BMI,
age, body-fat percentage, calories, profile notes, or inferred body changes.
Automatically converting private logs into partner activity would make consent
unclear and could violate the Aba Hatuv no-weighing boundary.

## Decision

The partner feed accepts only actions that a user explicitly chooses to share
from a closed enum:

- hydration;
- colorful vegetables;
- movement;
- a meal together;
- encouragement.

An optional 160-character note may accompany the action. The feed DTO contains
only the activity, its public display name, couple ID, actor ID, and timestamp.
There is no generic metadata object where private fields can leak later.

Every read and write locks and resolves the caller's current couple membership
inside the database transaction. Reconciliation is inclusive at the timestamp
boundary, and clients deduplicate by activity ID.

## Consequences

- Body and weight information stays private by construction.
- New shareable action types require a reviewed schema and migration change.
- The first feed slice is persisted and reconcilable; realtime delivery and
  reactions are separate follow-up work.
