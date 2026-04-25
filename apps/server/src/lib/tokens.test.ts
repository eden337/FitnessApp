import { createTokenSigner, parseTtlToSeconds } from './tokens.js';

const baseConfig = {
  accessSecret: 'test-access-secret-with-enough-entropy',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 86400 * 30,
};

describe('createTokenSigner', () => {
  it('signs and verifies an access token round-trip', () => {
    const signer = createTokenSigner(baseConfig);
    const { token, expiresInSeconds } = signer.signAccess('user-123');
    expect(expiresInSeconds).toBe(900);
    expect(signer.verifyAccess(token).sub).toBe('user-123');
  });

  it('rejects tokens signed with a different secret', () => {
    const a = createTokenSigner(baseConfig);
    const b = createTokenSigner({ ...baseConfig, accessSecret: 'other-secret-other-secret' });
    const { token } = a.signAccess('user-123');
    expect(() => b.verifyAccess(token)).toThrow();
  });

  it('rejects tokens whose payload lacks a valid sub', () => {
    const signer = createTokenSigner(baseConfig);
    // Sign a token with no `sub` using the same secret and verify rejects it.
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    const bogus = jwt.sign({ foo: 'bar' }, baseConfig.accessSecret, {
      algorithm: 'HS256',
      expiresIn: 60,
    });
    expect(() => signer.verifyAccess(bogus)).toThrow();
  });

  it('issues refresh tokens with stable hash-of-token semantics', () => {
    const signer = createTokenSigner(baseConfig);
    const { token, tokenHash, expiresAt } = signer.issueRefresh();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
    expect(token.length).toBeGreaterThanOrEqual(60);
    expect(signer.hashRefresh(token)).toBe(tokenHash);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('produces unique refresh tokens on every call', () => {
    const signer = createTokenSigner(baseConfig);
    const a = signer.issueRefresh();
    const b = signer.issueRefresh();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});

describe('parseTtlToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 15 * 60],
    ['2h', 2 * 3600],
    ['30d', 30 * 86400],
    ['600', 600],
  ])('parses %s', (input, expected) => {
    expect(parseTtlToSeconds(input)).toBe(expected);
  });

  it('rejects malformed inputs', () => {
    expect(() => parseTtlToSeconds('abc')).toThrow();
    expect(() => parseTtlToSeconds('')).toThrow();
    expect(() => parseTtlToSeconds('5y')).toThrow();
  });
});
