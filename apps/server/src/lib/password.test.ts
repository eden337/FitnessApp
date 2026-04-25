import { createPasswordHasher } from './password.js';

describe('createPasswordHasher', () => {
  // cost 4 keeps these tests fast; production uses 12 (env BCRYPT_COST).
  const hasher = createPasswordHasher(4);

  it('produces a hash that verifies the original password', async () => {
    const hash = await hasher.hash('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(await hasher.verify('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hasher.hash('s3cret-passphrase!');
    expect(await hasher.verify('not the password', hash)).toBe(false);
  });

  it('produces different hashes for the same input (salt is unique)', async () => {
    const a = await hasher.hash('repeat-me-123');
    const b = await hasher.hash('repeat-me-123');
    expect(a).not.toBe(b);
  });
});
