import { loadEnv } from '../src/config/env.js';

describe('loadEnv', () => {
  it('applies defaults when given an empty environment', () => {
    const env = loadEnv({} as NodeJS.ProcessEnv);
    expect(env.NODE_ENV).toBe('development');
    expect(env.SERVER_PORT).toBe(4000);
    expect(env.BCRYPT_COST).toBe(12);
    expect(env.CORS_ORIGINS).toEqual(
      expect.arrayContaining(['http://localhost:19006', 'http://localhost:8081']),
    );
  });

  it('parses CORS_ORIGINS as a comma-separated allowlist', () => {
    const env = loadEnv({
      CORS_ORIGINS: 'https://a.example, https://b.example , ',
    } as NodeJS.ProcessEnv);
    expect(env.CORS_ORIGINS).toEqual(['https://a.example', 'https://b.example']);
  });

  it('rejects nonsensical BCRYPT_COST values', () => {
    expect(() => loadEnv({ BCRYPT_COST: '1' } as NodeJS.ProcessEnv)).toThrow();
    expect(() => loadEnv({ BCRYPT_COST: '20' } as NodeJS.ProcessEnv)).toThrow();
  });

  it('requires DATABASE_URL to be a valid URL when provided', () => {
    expect(() =>
      loadEnv({ DATABASE_URL: 'not-a-url' } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(
      loadEnv({ DATABASE_URL: 'postgres://u:p@h:5432/d' } as NodeJS.ProcessEnv)
        .DATABASE_URL,
    ).toBe('postgres://u:p@h:5432/d');
  });

  it('falls back to process.env when no source is supplied', () => {
    const before = { ...process.env };
    process.env.SERVER_PORT = '5555';
    try {
      const env = loadEnv();
      expect(env.SERVER_PORT).toBe(5555);
    } finally {
      // restore so we don't leak state into other tests
      for (const key of Object.keys(process.env)) {
        if (!(key in before)) delete process.env[key];
      }
      Object.assign(process.env, before);
    }
  });
});
