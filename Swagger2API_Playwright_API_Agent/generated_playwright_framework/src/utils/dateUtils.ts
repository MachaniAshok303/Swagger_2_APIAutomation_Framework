/**
 * Date and Timestamp Utilities
 */
export class DateUtils {
  static nowIso(): string {
    return new Date().toISOString();
  }

  static addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static addDays(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 1000);
  }
}
