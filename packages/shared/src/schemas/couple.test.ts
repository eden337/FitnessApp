import { InviteCodeSchema, JoinCoupleInputSchema } from './couple.js';

describe('InviteCodeSchema', () => {
  it('accepts an 8-char string from the unambiguous alphabet', () => {
    expect(InviteCodeSchema.parse('ABCDEFGH')).toBe('ABCDEFGH');
    expect(InviteCodeSchema.parse('23456789')).toBe('23456789');
  });

  it('rejects ambiguous characters (0, 1, I, O)', () => {
    for (const code of ['ABCDEFG0', 'ABCDEFG1', 'ABCDEFGI', 'ABCDEFGO']) {
      expect(() => InviteCodeSchema.parse(code)).toThrow();
    }
  });

  it('rejects wrong length', () => {
    expect(() => InviteCodeSchema.parse('ABCD')).toThrow();
    expect(() => InviteCodeSchema.parse('ABCDEFGHI')).toThrow();
  });

  it('rejects lower-case input (codes are upper-case only)', () => {
    expect(() => InviteCodeSchema.parse('abcdefgh')).toThrow();
  });
});

describe('JoinCoupleInputSchema', () => {
  it('rejects unknown extra fields', () => {
    expect(() =>
      JoinCoupleInputSchema.parse({ inviteCode: 'ABCDEFGH', extra: 1 } as unknown),
    ).toThrow();
  });
  it('parses a valid payload', () => {
    expect(JoinCoupleInputSchema.parse({ inviteCode: 'ABCDEFGH' })).toEqual({
      inviteCode: 'ABCDEFGH',
    });
  });
});
