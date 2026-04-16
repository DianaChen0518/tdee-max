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
  public static calculateAge(birthDateStr: string): number {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
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
   * @returns Total EAT in kcal.
   */
  public static calculateEAT(workouts: Workout[], weight: number, age: number, gender: 'M' | 'F'): number {
    if (!weight || !workouts.length) return 0;

    return workouts.reduce((total, wo) => {
      const type = wo.type || 'aerobic';

      // Manual input: directly use the value if provided
      if (type === 'manual') {
        const kcal = typeof wo.kcal === 'string' ? parseFloat(wo.kcal) : (wo.kcal || 0);
        return total + Math.max(0, kcal);
      }

      // Calculate total duration in minutes
      const mins = typeof wo.mins === 'string' ? parseFloat(wo.mins) : (wo.mins || 0);
      const secs = typeof wo.secs === 'string' ? parseFloat(wo.secs) : (wo.secs || 0);
      const totalMins = Math.max(0, mins + (secs / 60));
      
      if (totalMins <= 0) return total;

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
          return total + Math.max(0, kcalPerMin * totalMins);
        }
      } else if (type === 'anaerobic') {
        // MET-based calculation for resistance training
        // High (7.0), Medium (5.0), Low (3.5)
        const met = wo.intensity === 'high' ? 7.0 : (wo.intensity === 'low' ? 3.5 : 5.0);
        const kcal = met * weight * (totalMins / 60);
        return total + Math.max(0, kcal);
      }

      return total;
    }, 0);
  }

  /**
   * Generates a comprehensive summary for a given day.
   * @param data - Daily activity/weight data.
   * @param profile - User physiological profile.
   * @returns A complete set of metabolic metrics.
   */
  public static calculateDailySummary(data: DayData, profile: UserProfile): DailySummaryMetrics {
    const age = this.calculateAge(profile.birthDate);
    const bmr = this.calculateBMR(data.weight, profile.heightCm, age, profile.gender);
    
    // Total Daily Energy Expenditure (TDEE)
    // Formula: (BMR * 1.1) [TEF] + NEAT + EAT
    const neat = this.calculateNEAT(data.weight, data.steps);
    const eat = this.calculateEAT(data.workouts, data.weight, age, profile.gender);
    
    const tdee = (bmr * 1.1) + neat + eat;
    const intake = data.foods.reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0);
    const deficit = tdee - intake;

    return {
      bmr: Math.round(bmr),
      neat: Math.round(neat),
      eat: Math.round(eat),
      tdee: Math.round(tdee),
      intake: Math.round(intake),
      deficit: Math.round(deficit)
    };
  }
}
