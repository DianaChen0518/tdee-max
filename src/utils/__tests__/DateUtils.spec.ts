import { describe, it, expect } from 'vitest';
import { DateUtils } from '../../utils/DateUtils';

describe('DateUtils', () => {
  describe('getLocalYYYYMMDD', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = DateUtils.getLocalYYYYMMDD(new Date(2025, 0, 15));
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2025-01-15');
    });

    it('should default to today when no argument', () => {
      const result = DateUtils.getLocalYYYYMMDD();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle month and day zero-padding', () => {
      expect(DateUtils.getLocalYYYYMMDD(new Date(2025, 2, 5))).toBe('2025-03-05');
    });
  });

  describe('diffDays', () => {
    it('should return positive diff for forward dates', () => {
      expect(DateUtils.diffDays('2025-01-01', '2025-01-10')).toBe(9);
    });

    it('should return negative diff for backward dates', () => {
      expect(DateUtils.diffDays('2025-01-10', '2025-01-01')).toBe(-9);
    });

    it('should return 0 for same date', () => {
      expect(DateUtils.diffDays('2025-06-15', '2025-06-15')).toBe(0);
    });

    it('should handle month boundaries', () => {
      expect(DateUtils.diffDays('2025-01-30', '2025-02-01')).toBe(2);
    });

    it('should handle year boundaries', () => {
      expect(DateUtils.diffDays('2024-12-31', '2025-01-01')).toBe(1);
    });
  });

  describe('offsetDate', () => {
    it('should add days forward', () => {
      expect(DateUtils.offsetDate('2025-01-01', 5)).toBe('2025-01-06');
    });

    it('should subtract days backward', () => {
      expect(DateUtils.offsetDate('2025-01-10', -3)).toBe('2025-01-07');
    });

    it('should handle month rollover', () => {
      expect(DateUtils.offsetDate('2025-01-30', 3)).toBe('2025-02-02');
    });

    it('should handle year rollover', () => {
      expect(DateUtils.offsetDate('2025-12-30', 5)).toBe('2026-01-04');
    });

    it('should handle offset of 0', () => {
      expect(DateUtils.offsetDate('2025-06-15', 0)).toBe('2025-06-15');
    });

    it('should handle leap year', () => {
      expect(DateUtils.offsetDate('2024-02-28', 1)).toBe('2024-02-29');
      expect(DateUtils.offsetDate('2024-02-29', 1)).toBe('2024-03-01');
    });
  });
});
