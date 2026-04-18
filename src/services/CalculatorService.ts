import { Workout, DayData, UserProfile, DailySummaryMetrics } from '../types';
import { 
  BMR_CONSTANTS, 
  THERMIC_EFFECT_OF_FOOD_RATIO, 
  NEAT_CONSTANTS, 
  EPOC_SEGMENTS,
  EPOC_DURATION_MODEL,
  AEROBIC_FORMULA_CONSTANTS,
  MET_VALUES,
  MAX_HR_TANAKA,
  MINUTES_PER_DAY,
  AEROBIC_HR_MIN_THRESHOLD
} from '../constants/metabolic';
import { ValidationGuard } from '../utils/ValidationGuard';
import { Logger } from '../utils/Logger';

/** Accumulator for Exercise Activity Thermogenesis results. */
interface EATResult {
  eat: number;
  epoc: number;
}

/**
 * High-precision metabolic calculation engine.
 * Refactored to modular sub-calculators for Big Tech grade maintainability.
 */
export class CalculatorService {
  
  /**
   * Calculates age in fractional years with 365.25 day precision.
   */
  public static calculateAge(birthDateStr: string, referenceDateStr?: string): number {
    if (!birthDateStr) return 0;
    
    const birthDate = new Date(birthDateStr);
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    
    if (refDate < birthDate) return 0;
    
    let years = refDate.getFullYear() - birthDate.getFullYear();
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const refMonth = refDate.getMonth();
    const refDay = refDate.getDate();

    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
      years--;
    }

    // Fraction calculation for precision
    const lastAnniversary = new Date(refDate.getFullYear(), birthMonth, birthDay);
    if (lastAnniversary > refDate) {
      lastAnniversary.setFullYear(lastAnniversary.getFullYear() - 1);
    }
    
    const nextAnniversary = new Date(lastAnniversary.getFullYear() + 1, birthMonth, birthDay);
    const msInYear = nextAnniversary.getTime() - lastAnniversary.getTime();
    const msSinceAnniversary = refDate.getTime() - lastAnniversary.getTime();
    
    return years + (msSinceAnniversary / msInYear);
  }

  /**
   * Primary entry point for daily summary calculations.
   */
  public static calculateDailySummary(data: DayData, profile: UserProfile, dateStr?: string): DailySummaryMetrics {
    const age = this.calculateAge(profile.birthDate, dateStr);
    
    // Safety check for critical metrics using the Guard layer
    if (!ValidationGuard.isProfileCalculable(profile)) {
      Logger.warn('Attempted calculation with incomplete profile', { profile });
      return this.emptySummary();
    }

    const weight = ValidationGuard.sanitizeWeight(data.weight);
    if (weight === 0) return this.emptySummary();

    // 1. Core Component Calculations
    const bmr = this.calculateBMR(weight, profile.heightCm, age, profile.gender);
    const neat = this.calculateNEAT(weight, data.steps || 0);
    const { eat, epoc } = this.calculateEAT(data.workouts || [], weight, age, profile.gender, profile.rhr || 70, bmr);
    
    // 2. Secondary Component Calculations
    const intake = (data.foods || []).reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0);
    const tef = this.calculateTEF(intake, bmr, neat, eat);
    
    // 3. Aggregate Final Results
    const tdee = bmr + tef + neat + eat + epoc;
    const deficit = tdee - intake;

    Logger.trace('Daily Sum', tdee, { bmr, neat, eat, epoc, tef, intake });

    return {
      bmr: Math.round(bmr),
      neat: Math.round(neat),
      eat: Math.round(eat),
      epoc: Math.round(epoc),
      tef: Math.round(tef),
      tdee: Math.round(tdee),
      intake: Math.round(intake),
      deficit: Math.round(deficit)
    };
  }

  /**
   * Basal Metabolic Rate using Mifflin-St Jeor equation.
   */
  public static calculateBMR(weight: number, height: number, age: number, gender: 'M' | 'F'): number {
    const w = ValidationGuard.sanitizeWeight(weight);
    if (w === 0 || !height || !age) return 0;

    const config = gender === 'M' ? BMR_CONSTANTS.MALES : BMR_CONSTANTS.FEMALES;
    return (config.WEIGHT_MULT * w) + (config.HEIGHT_MULT * height) - (config.AGE_MULT * age) + config.OFFSET;
  }

  /**
   * Non-Exercise Activity Thermogenesis (NEAT).
   */
  public static calculateNEAT(weight: number, steps: number): number {
    const w = ValidationGuard.sanitizeWeight(weight);
    const s = ValidationGuard.sanitizeSteps(steps);
    if (w === 0) return 0;
    
    const baseStepBurn = s * NEAT_CONSTANTS.CALORIES_PER_STEP;
    const mechanicalEfficiencyOffset = s * w * NEAT_CONSTANTS.WEIGHT_COEFFICIENT;
    
    return baseStepBurn + mechanicalEfficiencyOffset;
  }

  /**
   * Thermic Effect of Food (TEF) - Intake or Expenditure based.
   */
  private static calculateTEF(intake: number, bmr: number, neat: number, eat: number): number {
    if (intake > 0) {
      return intake * THERMIC_EFFECT_OF_FOOD_RATIO;
    }
    // Estimated minimum cost of digestion even if not recorded
    return (bmr + neat + eat) * THERMIC_EFFECT_OF_FOOD_RATIO;
  }

  /**
   * Calculates Exercise Activity Thermogenesis (EAT) and EPOC.
   */
  public static calculateEAT(
    workouts: Workout[], 
    weight: number, 
    age: number, 
    gender: 'M' | 'F', 
    rhr: number,
    bmr: number
  ): { eat: number, epoc: number } {
    const w = ValidationGuard.sanitizeWeight(weight);
    if (w === 0 || !workouts || workouts.length === 0) return { eat: 0, epoc: 0 };
    
    const bmrPerMin = bmr / MINUTES_PER_DAY;

    return workouts.reduce((res, wo) => {
      const type = wo.type || 'aerobic';
      
      // Manual/Override Logic
      if (type === 'manual') {
        const kcal = typeof wo.kcal === 'string' ? parseFloat(wo.kcal) : (wo.kcal || 0);
        res.eat += Math.max(0, kcal);
        return res;
      }

      // Duration Logic
      const mins = typeof wo.mins === 'string' ? parseFloat(wo.mins) : (wo.mins || 0);
      const secs = typeof wo.secs === 'string' ? parseFloat(wo.secs) : (wo.secs || 0);
      const totalMins = Math.max(0, mins + (secs / 60));
      if (totalMins <= 0) return res;

      // Exercise Specific Calculations
      if (type === 'aerobic') {
        this.processAerobicWorkout(res, wo, w, age, gender, rhr, bmrPerMin, totalMins);
      } else if (type === 'anaerobic') {
        this.processAnaerobicWorkout(res, wo, w, totalMins);
      }

      return res;
    }, { eat: 0, epoc: 0 });
  }

  private static processAerobicWorkout(res: EATResult, wo: Workout, weight: number, age: number, gender: 'M' | 'F', rhr: number, bmrPerMin: number, totalMins: number) {
    const hr = typeof wo.hr === 'string' ? parseFloat(wo.hr) : (wo.hr || 0);
    
    if (hr > AEROBIC_HR_MIN_THRESHOLD) {
      const config = gender === 'M' ? AEROBIC_FORMULA_CONSTANTS.MALES : AEROBIC_FORMULA_CONSTANTS.FEMALES;
      const kcalPerMin = (config.INTERCEPT + config.HR_MULT * hr + config.WEIGHT_MULT * weight + config.AGE_MULT * age) / config.DIVISOR;
      const grossWorkoutKcal = Math.max(0, kcalPerMin * totalMins);
      const netWorkoutKcal = Math.max(0, grossWorkoutKcal - (bmrPerMin * totalMins));

      // EPOC Calculation with Guards
      const epocKcal = this.calculateEPOC(hr, rhr, age, netWorkoutKcal, totalMins);

      res.eat += netWorkoutKcal;
      res.epoc += epocKcal;
    }
  }

  private static processAnaerobicWorkout(res: EATResult, wo: Workout, weight: number, totalMins: number) {
    const met = wo.intensity === 'high' ? MET_VALUES.RESISTANCE_HIGH : (wo.intensity === 'low' ? MET_VALUES.RESISTANCE_LOW : MET_VALUES.RESISTANCE_MEDIUM);
    const netWorkoutKcal = Math.max(0, (met - 1) * weight * (totalMins / 60));
    res.eat += netWorkoutKcal;
  }

  private static calculateEPOC(hr: number, rhr: number, age: number, netWorkoutKcal: number, duration: number): number {
    const maxHR = MAX_HR_TANAKA.INTERCEPT - (MAX_HR_TANAKA.AGE_MULT * age);
    const safeHR = ValidationGuard.clampHeartRate(hr, rhr, MAX_HR_TANAKA.SAFETY_OFFSET);
    
    const hrr = Math.max(0, maxHR - rhr);
    const pctHRR = hrr > 0 ? Math.max(0, Math.min(1.5, (safeHR - rhr) / hrr)) : 0;

    // Intensity Ratio (3-Segment Linear)
    let ratio = 0;
    if (pctHRR < EPOC_SEGMENTS.LOW.threshold) {
      ratio = EPOC_SEGMENTS.LOW.base + EPOC_SEGMENTS.LOW.slope * pctHRR;
    } else if (pctHRR < EPOC_SEGMENTS.MODERATE.threshold) {
      ratio = EPOC_SEGMENTS.MODERATE.base + EPOC_SEGMENTS.MODERATE.slope * (pctHRR - EPOC_SEGMENTS.LOW.threshold);
    } else {
      ratio = EPOC_SEGMENTS.HIGH.base + EPOC_SEGMENTS.HIGH.slope * (pctHRR - EPOC_SEGMENTS.MODERATE.threshold);
    }

    // Duration Factor
    let durFactor = 1.0;
    if (duration < EPOC_DURATION_MODEL.SHORT_MIN) {
      durFactor = EPOC_DURATION_MODEL.SHORT_BASE + EPOC_DURATION_MODEL.SHORT_SLOPE * (duration / EPOC_DURATION_MODEL.SHORT_MIN);
    } else if (duration < EPOC_DURATION_MODEL.LONG_MIN) {
      durFactor = EPOC_DURATION_MODEL.LONG_BASE + EPOC_DURATION_MODEL.LONG_SLOPE * ((duration - EPOC_DURATION_MODEL.SHORT_MIN) / (EPOC_DURATION_MODEL.LONG_MIN - EPOC_DURATION_MODEL.SHORT_MIN));
    } else {
      durFactor = EPOC_DURATION_MODEL.MAX_FACTOR;
    }

    return Math.max(0, netWorkoutKcal * ratio * durFactor);
  }

  private static emptySummary(): DailySummaryMetrics {
    return { bmr: 0, neat: 0, eat: 0, epoc: 0, tef: 0, tdee: 0, intake: 0, deficit: 0 };
  }
}
