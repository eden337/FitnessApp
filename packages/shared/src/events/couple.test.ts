import {
  CoupleMemberJoinedEventSchema,
  CoupleMemberLeftEventSchema,
  CoupleReadyEventSchema,
  SOCKET_EVENTS,
} from './couple.js';

const sampleProfile = () => ({
  id: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.io',
  displayName: 'A',
  locale: 'en',
  gender: 'female',
  birthDate: '1990-01-01',
  heightCm: 165,
});

const sampleCouple = () => ({
  id: '00000000-0000-4000-8000-000000000001',
  inviteCode: 'ABCDEFGH',
  createdAt: '2026-04-25T00:00:00.000Z',
  members: [
    { userId: '00000000-0000-4000-8000-000000000000', role: 'owner', joinedAt: '2026-04-25T00:00:00.000Z' },
  ],
});

describe('socket event schemas', () => {
  it('exposes the canonical event names', () => {
    expect(SOCKET_EVENTS).toEqual({
      ready: 'couple:ready',
      memberJoined: 'couple:member-joined',
      memberLeft: 'couple:member-left',
      hello: 'hello',
    });
  });

  it('CoupleReadyEventSchema accepts both null and a full view', () => {
    expect(CoupleReadyEventSchema.parse({ view: null }).view).toBeNull();
    expect(
      CoupleReadyEventSchema.parse({
        view: { couple: sampleCouple(), partners: [] },
      }).view,
    ).not.toBeNull();
  });

  it('CoupleMemberJoinedEventSchema validates the joiner profile + couple', () => {
    expect(
      CoupleMemberJoinedEventSchema.parse({
        couple: sampleCouple(),
        member: sampleProfile(),
      }).member.id,
    ).toBe(sampleProfile().id);
  });

  it('CoupleMemberLeftEventSchema requires both ids', () => {
    expect(() =>
      CoupleMemberLeftEventSchema.parse({ coupleId: 'not-uuid', userId: 'not-uuid' }),
    ).toThrow();
    expect(
      CoupleMemberLeftEventSchema.parse({
        coupleId: '00000000-0000-4000-8000-000000000001',
        userId: '00000000-0000-4000-8000-000000000000',
      }),
    ).toBeDefined();
  });
});
