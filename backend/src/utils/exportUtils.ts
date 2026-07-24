/**
 * exportUtils.ts
 * Reusable utilities for generating CSV and JSON export payloads.
 */

/**
 * Escape a single CSV cell value per RFC-4180.
 */
export const csvCell = (value: unknown): string =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

/**
 * Convert a header row + data rows into a properly-formatted CSV string.
 */
export function toCsv(headers: string[], rows: (unknown[])[]): string {
  const all = [headers, ...rows];
  return all.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/**
 * Wrap exported data in a standard JSON envelope with metadata.
 */
export function toJson<T>(
  data: T[],
  meta: Record<string, unknown> = {}
): { generatedAt: string; count: number; data: T[]; [key: string]: unknown } {
  return {
    generatedAt: new Date().toISOString(),
    count: data.length,
    ...meta,
    data,
  };
}

/**
 * Generate a download filename with today's date suffix.
 */
export function exportFilename(
  prefix: string,
  extension: "csv" | "json"
): string {
  const date = new Date().toISOString().slice(0, 10);
  return `placetrack-${prefix}-${date}.${extension}`;
}
