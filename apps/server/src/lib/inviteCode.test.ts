import { generateInviteCode } from './inviteCode.js';

const ALPHABET = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

describe('generateInviteCode', () => {
  it('produces an 8-char code in the unambiguous alphabet', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateInviteCode()).toMatch(ALPHABET);
    }
  });

  it('produces a high-entropy distribution (≥ 95 distinct codes in 100 calls)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) codes.add(generateInviteCode());
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });
});
