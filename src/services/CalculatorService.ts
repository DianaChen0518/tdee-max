import { Workout, DayData, UserProfile, DailySummaryMetrics } from '../types';
import { 
  BMR_CONSTANTS, 
  THERMIC_EFFECT_OF_FOOD_RATIO, 
  NEAT_CONSTANTS, 
  EPOC_SEGMENTS,
  EPOC_DURATION_MODEL,
  AEROBIC_FORMULA_CONSTANTS,
  MET_VALUES,
  MAX_HR_TANAKA
} from '../constants/metabolic';

/**
 * High-precision metabolic calculation engine.
 * Implements Mifflin-St Jeor (BMR), Keytel et al. (EAT), and hierarchical EPOC logic.
 */
export class CalculatorService {
  
  /**
   * Calculates age in fractional years with 365.25 day precision.
   */
  public static calculateAge(birthDateStr: string, referenceDateStr?: string): number {
    if (!birthDateStr) return 0;
    
    const birthDate = new Date(birthDateStr);
    const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    
    const diffMs = referenceDate.getTime() - birthDate.getTime();
    if (diffMs < 0) return 0;

    // Using 365.25 to account for leap years in long-term historical calculations
    return diffMs / (1000 * 60 * 60 * 24 * 365.25);
  }

  /**
   * Basal Metabolic Rate using Mifflin-St Jeor equation.
   */
  public static calculateBMR(weight: number, height: number, age: number, gender: 'M' | 'F'): number {
    if (!weight || !height || !age) return 0;

    const config = gender === 'M' ? BMR_CONSTANTS.MALES : BMR_CONSTANTS.FEMALES;
    
    return (config.WEIGHT_MULT * weight) + 
           (config.HEIGHT_MULT * height) - 
           (config.AGE_MULT * age) + 
           config.OFFSET;
  }

  /**
   * Non-Exercise Activity Thermogenesis (NEAT).
   */
  public static calculateNEAT(weight: number, steps: number): number {
    if (!weight) return 0;
    
    const baseStepBurn = steps * NEAT_CONSTANTS.CALORIES_PER_STEP;
    const mechanicalEfficiencyOffset = steps * weight * NEAT_CONSTANTS.WEIGHT_COEFFICIENT;
    
    return baseStepBurn + mechanicalEfficiencyOffset;
  }

  /**
   * Calculates Exercise Activity Thermogenesis (EAT) and EPOC.
   * Note: This returns NET calories (subtracting BMR for the workout duration).
   */
  public static calculateEAT(
    workouts: Workout[], 
    weight: number, 
    age: number, 
    gender: 'M' | 'F', 
    rhr: number,
    bmr: number
  ): { eat: number, epoc: number } {
    if (!weight || !workouts || workouts.length === 0) return { eat: 0, epoc: 0 };
    const bmrPerMin = bmr / 1440;

    return workouts.reduce((res, wo) => {
      const type = wo.type || 'aerobic';

      // 1. Manual override
      if (type === 'manual') {
        const kcal = typeof wo.kcal === 'string' ? parseFloat(wo.kcal) : (wo.kcal || 0);
        res.eat += Math.max(0, kcal);
        return res;
      }

      // 2. Duration normalized to minutes
      const mins = typeof wo.mins === 'string' ? parseFloat(wo.mins) : (wo.mins || 0);
      const secs = typeof wo.secs === 'string' ? parseFloat(wo.secs) : (wo.secs || 0);
      const totalMins = Math.max(0, mins + (secs / 60));
      
      if (totalMins <= 0) return res;

      // 3. Calculation based on exercise type
      if (type === 'aerobic') {
        const hr = typeof wo.hr === 'string' ? parseFloat(wo.hr) : (wo.hr || 0);
        
        // Keytel et al. HR threshold
        if (hr > 80) {
          const config = gender === 'M' ? AEROBIC_FORMULA_CONSTANTS.MALES : AEROBIC_FORMULA_CONSTANTS.FEMALES;
          
          const kcalPerMin = (config.INTERCEPT + config.HR_MULT * hr + config.WEIGHT_MULT * weight + config.AGE_MULT * age) / config.DIVISOR;
          const grossWorkoutKcal = Math.max(0, kcalPerMin * totalMins);
          const netWorkoutKcal = Math.max(0, grossWorkoutKcal - (bmrPerMin * totalMins));

          // EPOC Tiered Model - Based on physiological strain (Gross)
          const maxHR = MAX_HR_TANAKA.INTERCEPT - (MAX_HR_TANAKA.AGE_MULT * age);
          const hrr = Math.max(0, maxHR - (rhr || 70));
          const pctHRR = hrr > 0 ? (hr - (rhr || 70)) / hrr : 0;

          let epocKcal = 0;
          
          // 1. Calculate Intensity Multiplier (3-Segment Linear Model)
          let ratio = 0;
          if (pctHRR < EPOC_SEGMENTS.LOW.threshold) {
            ratio = EPOC_SEGMENTS.LOW.base + EPOC_SEGMENTS.LOW.slope * pctHRR;
          } else if (pctHRR < EPOC_SEGMENTS.MODERATE.threshold) {
            ratio = EPOC_SEGMENTS.MODERATE.base + EPOC_SEGMENTS.MODERATE.slope * (pctHRR - EPOC_SEGMENTS.LOW.threshold);
          } else {
            ratio = EPOC_SEGMENTS.HIGH.base + EPOC_SEGMENTS.HIGH.slope * (pctHRR - EPOC_SEGMENTS.MODERATE.threshold);
          }

          // 2. Calculate Duration Scaling Factor
          let durFactor = 1.0;
          if (totalMins < EPOC_DURATION_MODEL.SHORT_MIN) {
            durFactor = EPOC_DURATION_MODEL.SHORT_BASE + EPOC_DURATION_MODEL.SHORT_SLOPE * (totalMins / EPOC_DURATION_MODEL.SHORT_MIN);
          } else if (totalMins < EPOC_DURATION_MODEL.LONG_MIN) {
            durFactor = EPOC_DURATION_MODEL.LONG_BASE + EPOC_DURATION_MODEL.LONG_SLOPE * ((totalMins - EPOC_DURATION_MODEL.SHORT_MIN) / (EPOC_DURATION_MODEL.LONG_MIN - EPOC_DURATION_MODEL.SHORT_MIN));
          } else {
            durFactor = EPOC_DURATION_MODEL.MAX_FACTOR;
          }

          // 3. Final Calculation (Strictly on Net calories)
          epocKcal = netWorkoutKcal * ratio * durFactor;

          res.eat += netWorkoutKcal;
          res.epoc += epocKcal;
        }
      } else if (type === 'anaerobic') {
        const met = wo.intensity === 'high' ? MET_VALUES.RESISTANCE_HIGH : (wo.intensity === 'low' ? MET_VALUES.RESISTANCE_LOW : MET_VALUES.RESISTANCE_MEDIUM);
        // Formula: Net Kcal = (MET - 1) * weight * (totalMins / 60)
        const netWorkoutKcal = (met - 1) * weight * (totalMins / 60);
        res.eat += Math.max(0, netWorkoutKcal);
      }

      return res;
    }, { eat: 0, epoc: 0 });
  }

  /**
   * Generates a comprehensive summary for a given day.
   */
  public static calculateDailySummary(data: DayData, profile: UserProfile, dateStr?: string): DailySummaryMetrics {
    const age = this.calculateAge(profile.birthDate, dateStr);
    
    // Safety check for critical metrics
    if (!data.weight || data.weight <= 0) {
      return this.emptySummary();
    }

    const bmr = this.calculateBMR(data.weight, profile.heightCm, age, profile.gender);
    const neat = this.calculateNEAT(data.weight, data.steps || 0);
    const { eat, epoc } = this.calculateEAT(data.workouts || [], data.weight, age, profile.gender, profile.rhr || 70, bmr);
    
    const tef = bmr * THERMIC_EFFECT_OF_FOOD_RATIO;
    const tdee = bmr + tef + neat + eat + epoc;
    const intake = (data.foods || []).reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0);
    const deficit = tdee - intake;

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

  private static emptySummary(): DailySummaryMetrics {
    return { bmr: 0, neat: 0, eat: 0, epoc: 0, tef: 0, tdee: 0, intake: 0, deficit: 0 };
  }
}
