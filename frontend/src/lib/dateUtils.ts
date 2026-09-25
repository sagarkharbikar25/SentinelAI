/**
 * Universal UTC to Local Timezone Normalizer for SentinelAI
 * Ensures SQLite UTC ISO strings (with or without 'Z') accurately map
 * to the user's local operating system clock.
 */

export function parseUtcDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  // If no timezone offset (Z or +/-), treat explicitly as UTC
  const hasTimezone =
    trimmed.endsWith('Z') ||
    trimmed.includes('+') ||
    (trimmed.length > 10 && trimmed.slice(10).includes('-'));
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date(trimmed) : parsed;
}

export function formatLocalDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const d = parseUtcDate(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatLocalTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const d = parseUtcDate(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatUtcDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const d = parseUtcDate(dateStr);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}
