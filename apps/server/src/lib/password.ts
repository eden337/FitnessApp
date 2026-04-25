import bcrypt from 'bcrypt';

export type PasswordHasher = {
  hash: (plain: string) => Promise<string>;
  verify: (plain: string, hash: string) => Promise<boolean>;
};

/**
 * bcrypt-backed password hasher. Cost is injected so production uses the
 * configured value (12) and tests can drop to 4 to keep wall-clock time
 * reasonable when many hashes are computed.
 */
export const createPasswordHasher = (cost: number): PasswordHasher => ({
  hash: (plain) => bcrypt.hash(plain, cost),
  verify: (plain, hash) => bcrypt.compare(plain, hash),
});
