import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportingService } from '../ReportingService';
import { Database, UserProfile } from '../../types';
import { DateUtils } from '../../utils/DateUtils';

describe('ReportingService', () => {
  const mockProfile: UserProfile = {
    birthDate: '1990-01-01',
    heightCm: 175,
    gender: 'M',
    rhr: 70
  };

  const mockDb: Database = {
    '2024-01-01': { weight: 80, steps: 10000, foods: [], workouts: [] },
    '2024-01-02': { weight: 79.5, steps: 5000, foods: [], workouts: [] },
    // Today according to mock
    '2024-01-03': { weight: 79.2, steps: 2000, foods: [], workouts: [] },
  };

  beforeEach(() => {
    // Mock today's date to 2024-01-03
    vi.spyOn(DateUtils, 'getLocalYYYYMMDD').mockReturnValue('2024-01-03');
  });

  describe('getProcessingRecords', () => {
    it('should exclude today and future dates', () => {
      const records = ReportingService.getProcessingRecords(mockDb, mockProfile);
      
      // Should only contain 01-01 and 01-02
      expect(records.length).toBe(2);
      expect(records.map(r => r.date)).not.toContain('2024-01-03');
    });

    it('should filter records with no meaningful data', () => {
      const emptyDb: Database = {
        '2024-01-01': { weight: 0, steps: 0, foods: [], workouts: [] }
      };
      const records = ReportingService.getProcessingRecords(emptyDb, mockProfile);
      expect(records.length).toBe(0);
    });

    it('should sort records chronologically', () => {
      const unsortedDb: Database = {
        '2024-01-02': { weight: 79.5, steps: 5000, foods: [], workouts: [] },
        '2024-01-01': { weight: 80, steps: 10000, foods: [], workouts: [] },
      };
      const records = ReportingService.getProcessingRecords(unsortedDb, mockProfile);
      expect(records[0].date).toBe('2024-01-01');
      expect(records[1].date).toBe('2024-01-02');
    });
  });

  describe('aggregateStats', () => {
    it('should calculate averages and totals correctly', () => {
      const records = [
        { date: '2024-01-01', weight: 80, tdee: 2500, intake: 2000, deficit: 500 },
        { date: '2024-01-02', weight: 79.5, tdee: 2400, intake: 1800, deficit: 600 },
      ];

      const stats = ReportingService.aggregateStats(records);
      
      expect(stats.totalDeficit).toBe(1100);
      expect(stats.avgIntake).toBe(1900);
      expect(stats.recordCount).toBe(2);
      // Theoretical fat change: 1100 / 7.7 = 142.85...
      expect(stats.theoreticalFatChangeGrams).toBeCloseTo(142.85, 1);
    });

    it('should return zeros for empty record list', () => {
      const stats = ReportingService.aggregateStats([]);
      expect(stats.recordCount).toBe(0);
      expect(stats.totalDeficit).toBe(0);
    });
  });
});
