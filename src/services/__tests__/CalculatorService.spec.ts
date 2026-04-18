import { describe, it, expect } from 'vitest';
import { CalculatorService } from '../CalculatorService';
import { UserProfile, DayData } from '../../types';

describe('CalculatorService', () => {
  const mockProfile: UserProfile = {
    birthDate: '1990-01-01',
    heightCm: 175,
    gender: 'M',
    rhr: 70
  };

  // Mock date 2024-01-01 for age calculation (Age 34)
  const referenceDate = '2024-01-01';

  describe('calculateAge', () => {
    it('should calculate fractional age correctly', () => {
      const age = CalculatorService.calculateAge('1990-01-01', '2024-01-01');
      expect(Math.floor(age)).toBe(34);
    });

    it('should return 0 for future birth dates', () => {
      const age = CalculatorService.calculateAge('2025-01-01', '2024-01-01');
      expect(age).toBe(0);
    });
  });

  describe('calculateBMR (Mifflin-St Jeor)', () => {
    it('should calculate BMR for males correctly', () => {
      const weight = 80;
      const height = 180;
      const age = 30;
      // Formula: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      const bmr = CalculatorService.calculateBMR(weight, height, age, 'M');
      expect(bmr).toBe(1780);
    });

    it('should calculate BMR for females correctly', () => {
      const weight = 60;
      const height = 165;
      const age = 25;
      // Formula: 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      const bmr = CalculatorService.calculateBMR(weight, height, age, 'F');
      expect(bmr).toBe(1345.25);
    });
  });

  describe('calculateNEAT (Steps)', () => {
    it('should calculate step calories based on weight and steps', () => {
      const weight = 80;
      const steps = 10000;
      // Base: 10000 * 0.035 = 350
      // Efficiency: 10000 * 80 * 0.00045 = 360
      // Total: 710
      const neat = CalculatorService.calculateNEAT(weight, steps);
      expect(neat).toBe(710);
    });
  });

  describe('calculateDailySummary', () => {
    it('should aggregate all components into TDEE', () => {
      const data: DayData = {
        weight: 80,
        steps: 10000,
        foods: [{ name: 'Test', cals: 2000 }],
        workouts: []
      };

      const summary = CalculatorService.calculateDailySummary(data, mockProfile, referenceDate);

      // BMR (80kg, 175cm, 34y, M) = 1728.75
      // NEAT (80kg, 10000 steps) = 710
      // TEF (2000 kcal intake) = 200
      // TDEE = 1728.75 + 710 + 200 = 2638.75
      expect(summary.tdee).toBe(2639); // Rounded
      expect(summary.intake).toBe(2000);
      expect(summary.deficit).toBe(639);
    });
  });

  describe('calculateEAT & EPOC', () => {
    it('should calculate net workout burn and EPOC for aerobic exercises', () => {
      const weight = 80;
      const age = 34;
      const gender = 'M';
      const rhr = 70;
      const bmr = 1728;

      const workouts = [
        {
          type: 'aerobic' as any,
          hr: 150,
          mins: 30,
          secs: 0
        }
      ];

      const { eat, epoc } = CalculatorService.calculateEAT(workouts, weight, age, gender, rhr, bmr);

      // Expected logic: gross burn - bmr offset
      expect(eat).toBeGreaterThan(0);
      expect(epoc).toBeGreaterThan(0);
    });

    it('should calculate resistance training using MET model', () => {
      const weight = 80;
      const workouts = [
        {
          type: 'anaerobic' as any,
          intensity: 'high' as any,
          mins: 60,
          secs: 0
        }
      ];

      const { eat } = CalculatorService.calculateEAT(workouts, weight, 30, 'M', 70, 1800);
      // MET for High Resistance = 7.0
      // Net Burn = (7 - 1) * 80 * (60/60) = 6 * 80 = 480
      expect(eat).toBe(480);
    });
  });
});
