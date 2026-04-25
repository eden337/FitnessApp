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

export interface Database {
  users: UsersTable;
  user_metrics: UserMetricsTable;
  refresh_tokens: RefreshTokensTable;
  couples: CouplesTable;
  couple_members: CoupleMembersTable;
}
