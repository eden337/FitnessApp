import {
  compactErrors,
  validateBirthDate,
  validateEmail,
  validateHeightCm,
  validatePassword,
  validateRequired,
  validateWeightKg,
} from './validation';

describe('validators', () => {
  it('email: rejects empty / malformed, accepts valid', () => {
    expect(validateEmail('')).toBe('common:validation.required');
    expect(validateEmail('  ')).toBe('common:validation.required');
    expect(validateEmail('foo')).toBe('common:validation.email');
    expect(validateEmail('foo@bar')).toBe('common:validation.email');
    expect(validateEmail('foo@bar.io')).toBeNull();
  });

  it('password: requires min length 10', () => {
    expect(validatePassword('')).toBe('common:validation.required');
    expect(validatePassword('short')).toBe('common:validation.passwordLength');
    expect(validatePassword('exactly10!')).toBeNull();
  });

  it('required: trimmed', () => {
    expect(validateRequired('')).toBe('common:validation.required');
    expect(validateRequired('  ')).toBe('common:validation.required');
    expect(validateRequired('x')).toBeNull();
  });

  it('birthDate: ISO YYYY-MM-DD only', () => {
    expect(validateBirthDate('')).toBe('common:validation.required');
    expect(validateBirthDate('15/04/1990')).toBe('common:validation.isoDate');
    expect(validateBirthDate('1990-04-15')).toBeNull();
  });

  it('heightCm: 50–250, finite', () => {
    expect(validateHeightCm(NaN)).toBe('common:validation.required');
    expect(validateHeightCm(40)).toBe('common:validation.rangeHeight');
    expect(validateHeightCm(260)).toBe('common:validation.rangeHeight');
    expect(validateHeightCm(170)).toBeNull();
  });

  it('weightKg: 20–300, finite', () => {
    expect(validateWeightKg(NaN)).toBe('common:validation.required');
    expect(validateWeightKg(15)).toBe('common:validation.rangeWeight');
    expect(validateWeightKg(310)).toBe('common:validation.rangeWeight');
    expect(validateWeightKg(72.5)).toBeNull();
  });

  it('compactErrors strips null entries', () => {
    expect(compactErrors({ a: null, b: 'broken', c: null })).toEqual({ b: 'broken' });
  });
});
