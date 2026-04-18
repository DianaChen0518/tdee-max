import { describe, it, expect } from 'vitest';
import { DayManager } from '../../utils/day-manager';
import { Database, DayData, Food } from '../../types';

const makeDayData = (overrides: Partial<DayData> = {}): DayData => ({
  weight: 70,
  steps: 0,
  workouts: [],
  foods: [],
  ...overrides
});

describe('DayManager', () => {
  describe('initDay', () => {
    it('should return existing day data if already in database', () => {
      const db: Database = { '2025-01-15': makeDayData({ weight: 72 }) };
      const result = DayManager.initDay(db, '2025-01-15');
      expect(result.weight).toBe(72);
    });

    it('should carry over weight from most recent past date', () => {
      const db: Database = {
        '2025-01-10': makeDayData({ weight: 68 }),
        '2025-01-13': makeDayData({ weight: 71 })
      };
      const result = DayManager.initDay(db, '2025-01-15');
      expect(result.weight).toBe(71);
    });

    it('should return 0 weight for brand new database', () => {
      const db: Database = {};
      const result = DayManager.initDay(db, '2025-01-01');
      expect(result.weight).toBe(0);
      expect(result.foods).toEqual([]);
      expect(result.workouts).toEqual([]);
    });

    it('should NOT carry forward from future dates', () => {
      const db: Database = {
        '2025-01-20': makeDayData({ weight: 99 })
      };
      const result = DayManager.initDay(db, '2025-01-15');
      expect(result.weight).toBe(0);
    });
  });

  describe('findLastDietDayFoods', () => {
    it('should return empty array if no past days have foods', () => {
      const db: Database = {
        '2025-01-10': makeDayData()
      };
      expect(DayManager.findLastDietDayFoods(db, '2025-01-15')).toEqual([]);
    });

    it('should find foods from the most recent past day with food logs', () => {
      const foods: Food[] = [{ name: 'Rice', cals: 200, multiplier: 1, mealType: 'lunch' }];
      const db: Database = {
        '2025-01-10': makeDayData({ foods }),
        '2025-01-12': makeDayData() // no foods
      };
      const result = DayManager.findLastDietDayFoods(db, '2025-01-15');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Rice');
    });

    it('should deep copy foods (no reference leakage)', () => {
      const foods: Food[] = [{ id: 'old-id', name: 'Egg', cals: 70, multiplier: 1, mealType: 'breakfast' }];
      const db: Database = {
        '2025-01-14': makeDayData({ foods })
      };
      const result = DayManager.findLastDietDayFoods(db, '2025-01-15');

      // Should have new ID (not same reference)
      expect(result[0].id).not.toBe('old-id');
      expect(result[0].id).toBeDefined();

      // Should not mutate original
      result[0].name = 'MUTATED';
      expect(db['2025-01-14'].foods[0].name).toBe('Egg');
    });

    it('should skip future dates', () => {
      const db: Database = {
        '2025-01-20': makeDayData({
          foods: [{ name: 'Future Food', cals: 100, multiplier: 1, mealType: 'lunch' }]
        })
      };
      expect(DayManager.findLastDietDayFoods(db, '2025-01-15')).toEqual([]);
    });
  });

  describe('copyFoods', () => {
    it('should copy foods of the specified meal type', () => {
      const source: Food[] = [
        { id: 's1', name: 'Oats', cals: 150, multiplier: 1, mealType: 'breakfast' },
        { id: 's2', name: 'Rice', cals: 200, multiplier: 1, mealType: 'lunch' }
      ];
      const result = DayManager.copyFoods(source, [], 'breakfast');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Oats');
    });

    it('should accumulate multiplier for duplicate foods in target', () => {
      const source: Food[] = [{ id: 's1', name: 'Egg', cals: 70, multiplier: 2, mealType: 'breakfast' }];
      const target: Food[] = [{ id: 't1', name: 'Egg', cals: 70, multiplier: 1, mealType: 'breakfast' }];
      const result = DayManager.copyFoods(source, target, 'breakfast');
      expect(result).toHaveLength(1);
      expect(result[0].multiplier).toBe(3); // 1 existing + 2 source
    });

    it('should add new food entries with fresh IDs when not duplicated', () => {
      const source: Food[] = [{ id: 'src-id', name: 'Apple', cals: 52, multiplier: 1, mealType: 'lunch' }];
      const result = DayManager.copyFoods(source, [], 'lunch');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
      expect(result[0].id).toBeDefined();
      expect(result[0].id).not.toBe('src-id'); // Fresh ID
    });

    it('should return unchanged target if no matching foods', () => {
      const source: Food[] = [{ id: 's1', name: 'Steak', cals: 400, multiplier: 1, mealType: 'dinner' }];
      const target: Food[] = [{ id: 't1', name: 'Bread', cals: 100, multiplier: 1, mealType: 'breakfast' }];
      const result = DayManager.copyFoods(source, target, 'breakfast');
      expect(result).toEqual(target);
    });

    it('should not mutate original source or target arrays', () => {
      const source: Food[] = [{ id: 's1', name: 'Milk', cals: 50, multiplier: 1, mealType: 'breakfast' }];
      const target: Food[] = [];
      const result = DayManager.copyFoods(source, target, 'breakfast');

      expect(result).toHaveLength(1);
      expect(target).toHaveLength(0); // Original target untouched
    });
  });
});
