export function parseYmdToUtcDate(ymd: string): Date {
  const head = ymd.trim().split('T')[0];
  const parts = head.split('-');
  if (parts.length !== 3) {
    return new Date(NaN);
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYmdUtc(d: Date | string): string {
  const date = typeof d === 'string' ? parseYmdToUtcDate(d) : d;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date value for formatYmdUtc');
  }

  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const da = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function extractYmdFromDto(value: string): string {
  return value.trim().split('T')[0];
}
