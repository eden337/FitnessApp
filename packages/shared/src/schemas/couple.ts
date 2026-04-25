import { z } from 'zod';
import { UuidSchema } from './common.js';
import { UserProfileSchema } from './user.js';

/** Invite codes use an unambiguous alphabet (no I, O, 0, 1) at length 8. */
export const InviteCodeSchema = z
  .string()
  .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/, 'invalid invite code');

export const CoupleMemberSchema = z
  .object({
    userId: UuidSchema,
    role: z.enum(['owner', 'member']),
    joinedAt: z.string().datetime(),
  })
  .strict();
export type CoupleMember = z.infer<typeof CoupleMemberSchema>;

export const CoupleSchema = z
  .object({
    id: UuidSchema,
    inviteCode: InviteCodeSchema,
    createdAt: z.string().datetime(),
    members: z.array(CoupleMemberSchema),
  })
  .strict();
export type Couple = z.infer<typeof CoupleSchema>;

export const CoupleViewSchema = z
  .object({
    couple: CoupleSchema,
    /** Public profile of every member (excluding the caller, when relevant). */
    partners: z.array(UserProfileSchema),
  })
  .strict();
export type CoupleView = z.infer<typeof CoupleViewSchema>;

export const JoinCoupleInputSchema = z.object({ inviteCode: InviteCodeSchema }).strict();
export type JoinCoupleInput = z.infer<typeof JoinCoupleInputSchema>;
