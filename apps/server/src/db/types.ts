import type { ColumnType, Generated } from 'kysely';

/**
 * Kysely ColumnType helper for timestamps that are managed by the DB
 * (defaults + triggers): selectable as Date, never written by the app.
 */
type ManagedTimestamp = ColumnType<Date, never, never>;
type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export type Gender = 'female' | 'male' | 'other';
export type Locale = 'he' | 'en';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  display_name: string;
  locale: Locale;
  gender: Gender;
  birth_date: ColumnType<Date, Date | string, Date | string>;
  height_cm: number;
  created_at: ManagedTimestamp;
  updated_at: ManagedTimestamp;
}

export interface UserMetricsTable {
  user_id: string;
  current_weight_kg: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  goal_weight_kg: number | null;
  dietary_restrictions: ColumnType<unknown, unknown, unknown>;
  program_started_on: ColumnType<Date | string | null, Date | string | null | undefined, Date | string | null>;
  updated_at: ManagedTimestamp;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Timestamp;
  revoked_at: Timestamp | null;
  created_at: ManagedTimestamp;
}

export interface CouplesTable {
  id: Generated<string>;
  invite_code: string;
  created_at: ManagedTimestamp;
}

export interface CoupleMembersTable {
  couple_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: ManagedTimestamp;
}

export type ProgramTaskKind = 'required' | 'optional';

export interface ProgramWeeksTable {
  id: Generated<string>;
  program_version: string;
  week_number: number;
  slug: string;
  title_he: string;
  title_en: string;
  mission_he: string;
  mission_en: string;
  rationale_he: string | null;
  rationale_en: string | null;
  notes_he: string | null;
  notes_en: string | null;
}

export interface ProgramTasksTable {
  id: Generated<string>;
  week_id: string;
  ordinal: number;
  kind: ProgramTaskKind;
  title_he: string;
  title_en: string;
  description_he: string | null;
  description_en: string | null;
}

export interface FoodListsTable {
  id: Generated<string>;
  program_version: string;
  slug: string;
  name_he: string;
  name_en: string;
  description_he: string | null;
  description_en: string | null;
  week_id: string | null;
}

export interface FoodItemsTable {
  id: Generated<string>;
  list_id: string;
  ordinal: number;
  visual_key: string;
  name_he: string;
  name_en: string;
  portion_he: string | null;
  portion_en: string | null;
  notes_he: string | null;
  notes_en: string | null;
}

export interface WeightLogsTable {
  id: Generated<string>;
  user_id: string;
  logged_on: ColumnType<Date | string, Date | string, Date | string>;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: ManagedTimestamp;
  updated_at: ManagedTimestamp;
}

export interface Database {
  users: UsersTable;
  user_metrics: UserMetricsTable;
  refresh_tokens: RefreshTokensTable;
  couples: CouplesTable;
  couple_members: CoupleMembersTable;
  program_weeks: ProgramWeeksTable;
  program_tasks: ProgramTasksTable;
  food_lists: FoodListsTable;
  food_items: FoodItemsTable;
  weight_logs: WeightLogsTable;
}
