import { z } from 'zod';
import { UuidSchema } from '../schemas/common.js';
import { CoupleSchema, CoupleViewSchema } from '../schemas/couple.js';
import { UserProfileSchema } from '../schemas/user.js';

/** A new partner joined the couple. Receivers should refresh their view. */
export const CoupleMemberJoinedEventSchema = z
  .object({
    couple: CoupleSchema,
    member: UserProfileSchema,
  })
  .strict();
export type CoupleMemberJoinedEvent = z.infer<typeof CoupleMemberJoinedEventSchema>;

/** A member left (or was removed). When `member` is the caller, clients
 *  should drop the couple from their state. */
export const CoupleMemberLeftEventSchema = z
  .object({
    coupleId: UuidSchema,
    userId: UuidSchema,
  })
  .strict();
export type CoupleMemberLeftEvent = z.infer<typeof CoupleMemberLeftEventSchema>;

/**
 * Reconciliation payload returned by the server when a freshly-connected
 * client sends `hello`. The client uses it to seed its CoupleStore.
 */
export const CoupleReadyEventSchema = z
  .object({
    view: CoupleViewSchema.nullable(),
  })
  .strict();
export type CoupleReadyEvent = z.infer<typeof CoupleReadyEventSchema>;

export const SOCKET_EVENTS = {
  // server → client
  ready: 'couple:ready',
  memberJoined: 'couple:member-joined',
  memberLeft: 'couple:member-left',
  // client → server
  hello: 'hello',
} as const;
