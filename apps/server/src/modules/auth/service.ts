import type { UserProfile } from '@fitnessapp/shared';
import type { PasswordHasher } from '../../lib/password.js';
import type { TokenSigner } from '../../lib/tokens.js';
import type { AuthRepo, UserRow } from './repo.js';

export type AuthError =
  | { kind: 'email_in_use' }
  | { kind: 'invalid_credentials' }
  | { kind: 'invalid_refresh' };

export type AuthResult = {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type RegisterInputInternal = {
  email: string;
  password: string;
  displayName: string;
  locale: 'he' | 'en';
  gender: 'female' | 'male' | 'other';
  birthDate: string;
  heightCm: number;
};

/**
 * Pure business logic. Knows nothing about Fastify; gets the repo + crypto
 * helpers as plain dependencies. Returning an `AuthError` discriminated
 * union (rather than throwing) keeps the route layer's mapping to HTTP
 * status codes explicit and trivially testable.
 */
export const createAuthService = (deps: {
  repo: AuthRepo;
  hasher: PasswordHasher;
  signer: TokenSigner;
}) => {
  const { repo, hasher, signer } = deps;

  const issueTokens = async (userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  }> => {
    const access = signer.signAccess(userId);
    const refresh = signer.issueRefresh();
    await repo.insertRefreshToken({
      userId,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresInSeconds: access.expiresInSeconds,
    };
  };

  const toProfile = (u: UserRow): UserProfile => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    locale: u.locale,
    gender: u.gender,
    birthDate: u.birthDate,
    heightCm: u.heightCm,
  });

  return {
    async register(input: RegisterInputInternal): Promise<AuthResult | AuthError> {
      if (await repo.findUserByEmail(input.email)) return { kind: 'email_in_use' };
      const passwordHash = await hasher.hash(input.password);
      const user = await repo.insertUser({
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        locale: input.locale,
        gender: input.gender,
        birthDate: input.birthDate,
        heightCm: input.heightCm,
      });
      const tokens = await issueTokens(user.id);
      return { user: toProfile(user), ...tokens };
    },

    async login(email: string, password: string): Promise<AuthResult | AuthError> {
      const user = await repo.findUserByEmail(email);
      if (!user) {
        // run a verify against a fixed dummy hash so timing stays comparable
        await hasher.verify(password, '$2b$04$XXXXXXXXXXXXXXXXXXXXXXuLA9hQF.9o3hWqv2yWzAeMtj1wmA8cm');
        return { kind: 'invalid_credentials' };
      }
      const ok = await hasher.verify(password, user.passwordHash);
      if (!ok) return { kind: 'invalid_credentials' };
      const tokens = await issueTokens(user.id);
      return { user: toProfile(user), ...tokens };
    },

    async refresh(refreshToken: string): Promise<AuthResult | AuthError> {
      const hash = signer.hashRefresh(refreshToken);
      const found = await repo.findActiveRefreshToken(hash);
      if (!found) return { kind: 'invalid_refresh' };
      // Rotate: revoke the old one, issue a fresh pair.
      await repo.revokeRefreshToken(found.id);
      const user = await repo.findUserById(found.userId);
      if (!user) return { kind: 'invalid_refresh' };
      const tokens = await issueTokens(user.id);
      return { user: toProfile(user), ...tokens };
    },

    async logout(refreshToken: string): Promise<void> {
      const hash = signer.hashRefresh(refreshToken);
      const found = await repo.findActiveRefreshToken(hash);
      if (found) await repo.revokeRefreshToken(found.id);
    },

    async me(userId: string): Promise<UserProfile | null> {
      const user = await repo.findUserById(userId);
      return user ? toProfile(user) : null;
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
