import type { Couple, CoupleView, UserProfile } from '@fitnessapp/shared';
import { generateInviteCode } from '../../lib/inviteCode.js';
import type { AuthRepo } from '../auth/repo.js';
import type { CouplesRepo } from './repo.js';

export type CoupleError =
  | { kind: 'already_in_couple' }
  | { kind: 'invite_not_found' }
  | { kind: 'self_join_forbidden' }
  | { kind: 'not_a_member' };

export type CoupleEventEmitter = {
  emitMemberJoined: (coupleId: string, payload: { couple: Couple; member: UserProfile }) => void;
  emitMemberLeft: (coupleId: string, payload: { coupleId: string; userId: string }) => void;
};

export const noopCoupleEvents: CoupleEventEmitter = {
  emitMemberJoined: () => {},
  emitMemberLeft: () => {},
};

export const createCouplesService = (deps: {
  repo: CouplesRepo;
  authRepo: AuthRepo;
  events?: CoupleEventEmitter;
  /** Number of attempts for code generation before giving up (collision-proof in practice). */
  inviteCodeAttempts?: number;
}) => {
  const { repo, authRepo } = deps;
  const events = deps.events ?? noopCoupleEvents;
  const attempts = deps.inviteCodeAttempts ?? 8;

  const buildCouple = async (id: string): Promise<Couple> => {
    const couple = await repo.findCoupleById(id);
    if (!couple) throw new Error(`couple ${id} vanished mid-request`);
    const members = await repo.listMembers(id);
    return {
      id: couple.id,
      inviteCode: couple.inviteCode,
      createdAt: couple.createdAt.toISOString(),
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  };

  const buildView = async (coupleId: string, viewerId: string): Promise<CoupleView> => {
    const couple = await buildCouple(coupleId);
    const partners: UserProfile[] = [];
    for (const m of couple.members) {
      if (m.userId === viewerId) continue;
      const u = await authRepo.findUserById(m.userId);
      if (u) {
        partners.push({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          locale: u.locale,
          gender: u.gender,
          birthDate: u.birthDate,
          heightCm: u.heightCm,
        });
      }
    }
    return { couple, partners };
  };

  return {
    /** Idempotent fetch of the caller's couple view. Returns null when unpaired. */
    async getMyView(userId: string): Promise<CoupleView | null> {
      const couple = await repo.findCoupleByUserId(userId);
      return couple ? buildView(couple.id, userId) : null;
    },

    async create(ownerId: string): Promise<CoupleView | CoupleError> {
      if (await repo.findCoupleByUserId(ownerId)) return { kind: 'already_in_couple' };
      // Retry generation on the unique-code constraint (extremely rare).
      let lastErr: unknown = null;
      for (let i = 0; i < attempts; i++) {
        const code = generateInviteCode();
        if (await repo.findCoupleByInviteCode(code)) continue;
        try {
          const couple = await repo.insertCouple({ inviteCode: code, ownerId });
          return buildView(couple.id, ownerId);
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr ?? new Error('failed to create couple');
    },

    async join(userId: string, inviteCode: string): Promise<CoupleView | CoupleError> {
      if (await repo.findCoupleByUserId(userId)) return { kind: 'already_in_couple' };
      const couple = await repo.findCoupleByInviteCode(inviteCode);
      if (!couple) return { kind: 'invite_not_found' };
      const members = await repo.listMembers(couple.id);
      if (members.some((m) => m.userId === userId)) return { kind: 'self_join_forbidden' };
      const added = await repo.addMember({ coupleId: couple.id, userId });
      if (!added) return { kind: 'already_in_couple' };
      const view = await buildView(couple.id, userId);
      const joiner = await authRepo.findUserById(userId);
      if (joiner) {
        events.emitMemberJoined(couple.id, {
          couple: view.couple,
          member: {
            id: joiner.id,
            email: joiner.email,
            displayName: joiner.displayName,
            locale: joiner.locale,
            gender: joiner.gender,
            birthDate: joiner.birthDate,
            heightCm: joiner.heightCm,
          },
        });
      }
      return view;
    },

    async leave(userId: string): Promise<{ disbanded: boolean } | CoupleError> {
      const couple = await repo.findCoupleByUserId(userId);
      if (!couple) return { kind: 'not_a_member' };
      const remaining = await repo.removeMember({ coupleId: couple.id, userId });
      events.emitMemberLeft(couple.id, { coupleId: couple.id, userId });
      return { disbanded: remaining === 0 };
    },
  };
};

export type CouplesService = ReturnType<typeof createCouplesService>;
