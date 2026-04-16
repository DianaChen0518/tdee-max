import { Workout, DayData, UserProfile, DailySummaryMetrics } from '../types';

/**
 * Service class for all energy expenditure and calorie-related calculations.
 * Adheres to standard physiological formulas (Mifflin-St Jeor, Keytel et al., METs).
 */
export class CalculatorService {
  /**
   * Calculates age in years based on a birth date string.
   * @param birthDateStr - Date string in YYYY-MM-DD format.
   * @returns Age in years.
   */
  /**
   * Calculates age in years based on a birth date string.
   * Accuracy: Fractional years using 365.25 days/yr.
   * @param birthDateStr - Date string in YYYY-MM-DD format.
   * @param referenceDateStr - Optional date to calculate age at (defaults to now).
   * @returns Continuous age in years.
   */
  public static calculateAge(birthDateStr: string, referenceDateStr?: string): number {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    
    // Use precise millisecond difference for continuous age
    const diffMs = refDate.getTime() - birth.getTime();
    const age = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    
    return Math.max(0, age);
  }

  /**
   * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
   * @param weight - Body weight in kg.
   * @param height - Height in cm.
   * @param age - Age in years.
   * @param gender - 'M' or 'F'.
   * @returns BMR in kcal/day.
   */
  public static calculateBMR(weight: number, height: number, age: number, gender: 'M' | 'F'): number {
    if (!weight || !height || age <= 0) return 0;
    const offset = gender === 'M' ? 5 : -161;
    return (10 * weight) + (6.25 * height) - (5 * age) + offset;
  }

  /**
   * Calculates Non-Exercise Activity Thermogenesis (NEAT) based on step count.
   * Simplified model: approx 0.045 kcal per step per kg, normalized.
   * @param weight - Body weight in kg.
   * @param steps - Daily step count.
   * @returns NEAT in kcal.
   */
  public static calculateNEAT(weight: number, steps: number): number {
    if (!weight || !steps || steps < 0) return 0;
    // Standard approximation for activity-based calorie burn from steps
    return steps * 0.045 * (weight / 100);
  }

  /**
   * Calculates Exercise Activity Thermogenesis (EAT) based on specific workout records.
   * @param workouts - Array of workout sessions.
   * @param weight - Body weight in kg.
   * @param age - Age in years.
   * @param gender - 'M' or 'F'.
   * @param rhr - Resting heart rate in bpm.
   * @returns An object containing base EAT and EPOC calories.
   */
  public static calculateEAT(workouts: Workout[], weight: number, age: number, gender: 'M' | 'F', rhr: number): { eat: number, epoc: number } {
    if (!weight || !workouts.length) return { eat: 0, epoc: 0 };

    return workouts.reduce((res, wo) => {
      const type = wo.type || 'aerobic';

      // Manual input: directly use the value if provided
      if (type === 'manual') {
        const kcal = typeof wo.kcal === 'string' ? parseFloat(wo.kcal) : (wo.kcal || 0);
        res.eat += Math.max(0, kcal);
        return res;
      }

      // Calculate total duration in minutes
      const mins = typeof wo.mins === 'string' ? parseFloat(wo.mins) : (wo.mins || 0);
      const secs = typeof wo.secs === 'string' ? parseFloat(wo.secs) : (wo.secs || 0);
      const totalMins = Math.max(0, mins + (secs / 60));
      
      if (totalMins <= 0) return res;

      if (type === 'aerobic') {
        // Precise Keytel et al. (2005) formula for HR-based calorie burn
        const hr = typeof wo.hr === 'string' ? parseFloat(wo.hr) : (wo.hr || 0);
        if (hr > 80) {
          let kcalPerMin = 0;
          if (gender === 'M') {
            kcalPerMin = (-55.0969 + 0.6309 * hr + 0.1988 * weight + 0.2017 * age) / 4.184;
          } else {
            kcalPerMin = (-20.4022 + 0.4472 * hr - 0.1263 * weight + 0.0740 * age) / 4.184;
          }
          let workoutKcal = kcalPerMin * totalMins;

          // --- EPOC (Afterburn Effect) Logic ---
          const maxHR = 220 - age;
          const hrr = Math.max(0, maxHR - rhr);
          const epocThreshold = (hrr * 0.75) + rhr;

          let epocKcal = 0;
          if (hr >= epocThreshold && totalMins >= 20) {
            epocKcal = workoutKcal * 0.1; // 10% bonus
          }

          res.eat += Math.max(0, workoutKcal);
          res.epoc += Math.max(0, epocKcal);
        }
      } else if (type === 'anaerobic') {
        // MET-based calculation for resistance training
        const met = wo.intensity === 'high' ? 7.0 : (wo.intensity === 'low' ? 3.5 : 5.0);
        const kcal = met * weight * (totalMins / 60);
        res.eat += Math.max(0, kcal);
      }

      return res;
    }, { eat: 0, epoc: 0 });
  }

  /**
   * Generates a comprehensive summary for a given day.
   * @param data - Daily activity/weight data.
   * @param profile - User physiological profile.
   * @param dateStr - Optional ISO date string (YYYY-MM-DD) for historical accuracy.
   * @returns A complete set of metabolic metrics.
   */
  public static calculateDailySummary(data: DayData, profile: UserProfile, dateStr?: string): DailySummaryMetrics {
    const age = this.calculateAge(profile.birthDate, dateStr);
    const bmr = this.calculateBMR(data.weight, profile.heightCm, age, profile.gender);
    
    // Total Daily Energy Expenditure (TDEE)
    // Formula: BMR + TEF + NEAT + EAT + EPOC
    const neat = this.calculateNEAT(data.weight, data.steps);
    const { eat, epoc } = this.calculateEAT(data.workouts, data.weight, age, profile.gender, profile.rhr);
    
    const tef = bmr * 0.1;
    const tdee = bmr + tef + neat + eat + epoc;
    const intake = data.foods.reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0);
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
}
