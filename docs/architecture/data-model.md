# Data model (Postgres, MVP)

Canonical reference for the tables backing the MVP. Every table uses
`id uuid PRIMARY KEY DEFAULT gen_random_uuid()` unless otherwise noted, and
every mutable table has `created_at` + `updated_at timestamptz` maintained by
a trigger (see migration `0001_init.sql`, forthcoming in Phase 1).

## Entities

### `users`
One row per member. Owns authentication and immutable profile facts.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| email | text | UNIQUE, lowercased |
| password_hash | text | bcrypt cost 12 |
| display_name | text | |
| locale | text | `'he'` default, `'en'` supported |
| gender | text | `'female' | 'male' | 'other'` |
| birth_date | date | for age-derived calculations |
| height_cm | smallint | positive |
| created_at / updated_at | timestamptz | |

### `user_metrics`
Current mutable metrics (1:1 with `users`). Historical weight lives in
`weight_logs`.

| column | type | notes |
|---|---|---|
| user_id | uuid | PK, FK users(id) |
| current_weight_kg | numeric(5,2) | |
| activity_level | text | `'sedentary' | 'light' | 'moderate' | 'high' | 'athlete'` |
| goal_type | text | `'lose' | 'maintain' | 'gain'` |
| goal_weight_kg | numeric(5,2) NULL | |
| dietary_restrictions | jsonb | e.g. `{"kosher":true,"vegetarian":false,"allergies":["peanut"]}` |
| updated_at | timestamptz | |

### `couples` + `couple_members`
A **couple** is the sync unit. `invite_code` is a short, human-readable token.
Membership is many-to-many so we can extend beyond two people later.

```sql
couples(id, invite_code UNIQUE, created_at)
couple_members(couple_id, user_id, role text CHECK (role IN ('owner','member')),
               joined_at, PRIMARY KEY (couple_id, user_id))
```

### `refresh_tokens`
Rotating refresh tokens, hashed at rest.

```sql
refresh_tokens(id, user_id FK, token_hash text, expires_at, revoked_at NULL)
```

### Aba Hatuv reference data
Seeded from `apps/server/src/db/seeds/aba-hatuv/`. Program-version-aware so
future revisions don't break historical logs.

```sql
food_categories(id, key text UNIQUE, name_he, name_en)
-- keys: protein, carb, veg, fat, fruit, dairy, free

food_items(id, category_id FK, name_he, name_en, portion_grams, portion_desc_he,
           portion_desc_en, kcal, protein_g, carb_g, fat_g)

meal_templates(id, program_version text, gender text, calorie_tier smallint,
               meal_type text CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
               portions jsonb)
-- portions: [{ category_key: 'protein', count: 2 }, { category_key: 'veg', count: 3 }, ...]
```

### Logs + goals

```sql
meal_logs(id, user_id FK, logged_on date, meal_type text, items jsonb,
          kcal_total numeric(6,1), notes text NULL, created_at)
water_logs(id, user_id FK, logged_on date, amount_ml integer)
weight_logs(id, user_id FK, logged_on date, weight_kg numeric(5,2),
            body_fat_pct numeric(4,1) NULL, notes text NULL, created_at)
goals(id, user_id FK, type text, target_value numeric, target_date date,
      created_at, achieved_at NULL)
partner_reactions(id, couple_id FK, from_user_id FK, subject_type text,
                  subject_id uuid, kind text, created_at)
-- subject_type: 'meal_log' | 'weight_log' | 'goal'
-- kind: 'clap' | 'fire' | 'hug' | 'heart'
```

## Indexing

- `users(email)` unique.
- `couples(invite_code)` unique.
- `(user_id, logged_on DESC)` on every `_logs` table — covers the
  "recent activity" and chart queries.
- `(couple_id, created_at DESC)` on `partner_reactions` — feed query.
- `meal_templates(program_version, gender, calorie_tier, meal_type)` — daily
  plan lookup.

All heavy reads are bounded by `logged_on >= $since` with these indexes in
place, keeping per-screen queries at O(log n) lookups + O(k) returned rows.

## Soft deletes

Out of scope for MVP. Users can unpair (`DELETE` their row from
`couple_members`); logs are retained as personal history.
