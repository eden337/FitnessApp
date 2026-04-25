import {
  LoginInputSchema,
  MIN_PASSWORD_LENGTH,
  RegisterInputSchema,
} from './auth.js';

describe('RegisterInputSchema', () => {
  const valid = {
    email: 'Someone@Example.com',
    password: 'a'.repeat(MIN_PASSWORD_LENGTH),
    displayName: 'Jane',
    locale: 'he' as const,
  };

  it('lowercases the email', () => {
    expect(RegisterInputSchema.parse(valid).email).toBe('someone@example.com');
  });

  it('defaults locale to he when omitted', () => {
    const { locale, ...noLocale } = valid;
    expect(RegisterInputSchema.parse(noLocale).locale).toBe('he');
  });

  it('rejects short passwords', () => {
    const tooShort = { ...valid, password: 'a'.repeat(MIN_PASSWORD_LENGTH - 1) };
    expect(() => RegisterInputSchema.parse(tooShort)).toThrow();
  });

  it('rejects malformed email', () => {
    expect(() => RegisterInputSchema.parse({ ...valid, email: 'nope' })).toThrow();
  });

  it('rejects unknown extra fields', () => {
    expect(() =>
      RegisterInputSchema.parse({ ...valid, admin: true } as unknown),
    ).toThrow();
  });

  it('rejects blank display names', () => {
    expect(() => RegisterInputSchema.parse({ ...valid, displayName: '   ' })).toThrow();
  });
});

describe('LoginInputSchema', () => {
  it('requires email and password only', () => {
    expect(
      LoginInputSchema.parse({ email: 'x@y.io', password: 'a'.repeat(MIN_PASSWORD_LENGTH) }),
    ).toEqual({ email: 'x@y.io', password: 'a'.repeat(MIN_PASSWORD_LENGTH) });
  });
});
