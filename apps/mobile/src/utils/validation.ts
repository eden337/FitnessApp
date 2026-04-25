/**
 * Cheap client-side validators that mirror the shared zod constraints. Their
 * job is friendly inline feedback — the server is the source of truth and
 * always re-validates with zod.
 *
 * Each function returns `null` when the input is acceptable, or a translation
 * key (e.g. `'common:validation.email'`) the screen looks up via i18n.
 */
export const validateEmail = (v: string): string | null => {
  const trimmed = v.trim();
  if (!trimmed) return 'common:validation.required';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? null : 'common:validation.email';
};

export const validatePassword = (v: string): string | null => {
  if (!v) return 'common:validation.required';
  return v.length >= 10 ? null : 'common:validation.passwordLength';
};

export const validateRequired = (v: string): string | null =>
  v.trim() ? null : 'common:validation.required';

export const validateBirthDate = (v: string): string | null => {
  if (!v) return 'common:validation.required';
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? null : 'common:validation.isoDate';
};

export const validateHeightCm = (v: number): string | null => {
  if (!Number.isFinite(v)) return 'common:validation.required';
  return v >= 50 && v <= 250 ? null : 'common:validation.rangeHeight';
};

export const validateWeightKg = (v: number): string | null => {
  if (!Number.isFinite(v)) return 'common:validation.required';
  return v >= 20 && v <= 300 ? null : 'common:validation.rangeWeight';
};

/** Drops every entry whose value is null. Useful for collecting form errors. */
export const compactErrors = <T extends string>(
  errors: Partial<Record<T, string | null>>,
): Partial<Record<T, string>> => {
  const out: Partial<Record<T, string>> = {};
  for (const [k, v] of Object.entries(errors) as [T, string | null][]) {
    if (v) out[k] = v;
  }
  return out;
};
