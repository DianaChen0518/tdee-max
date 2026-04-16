/**
 * Centralized Date Utilities for TDEE Tracker.
 * Ensures consistent timezone handling and formatting.
 */
export class DateUtils {
  /**
   * Returns YYYY-MM-DD in local timezone.
   */
  static getLocalYYYYMMDD(date: Date = new Date()): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
  }

  /**
   * Calculates difference in days between two YYYY-MM-DD strings.
   */
  static diffDays(dateStrA: string, dateStrB: string): number {
    const d1 = new Date(dateStrA);
    const d2 = new Date(dateStrB);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Safely adds/subtracts days to a YYYY-MM-DD string.
   */
  static offsetDate(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return this.getLocalYYYYMMDD(d);
  }
}
