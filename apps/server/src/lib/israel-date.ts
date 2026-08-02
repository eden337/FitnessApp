const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * PostgreSQL DATE values are parsed as local-midnight Date objects by `pg`.
 * Use local calendar fields so positive UTC offsets do not shift the date
 * back one day during serialization.
 */
export const serializeDateOnly = (value: Date | string): string => {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const todayInIsrael = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};
