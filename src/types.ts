/**
 * Represents the user's physiological profile used for BMR and TDEE calculations.
 */
export interface UserProfile {
  /** Birth date in ISO string format (YYYY-MM-DD) */
  birthDate: string;
  /** Height in centimeters */
  heightCm: number;
  /** Biological gender for metabolic formulas */
  gender: 'M' | 'F';
  /** Resting Heart Rate in bpm */
  rhr: number;
}

/**
 * Exercise activity types.
 */
export type WorkoutType = 'aerobic' | 'anaerobic' | 'manual';

/**
 * Workout intensity levels for MET-based calculations.
 */
export type IntensityLevel = 'low' | 'med' | 'high';

/**
 * Individual exercise record.
 */
export interface Workout {
  /** Type of exercise determining the calculation method used */
  type?: WorkoutType;
  /** Average heart rate (BPM) - used for aerobic calculations */
  hr?: number;
  /** Duration: minutes part */
  mins?: number;
  /** Duration: seconds part */
  secs?: number;
  /** Intensity level - used for anaerobic MET-based calculations */
  intensity?: IntensityLevel;
  /** Manually entered calorie burn (kcal) */
  kcal?: number;
}

/**
 * Standard meal categories.
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'uncategorized';

/**
 * Food item entry.
 */
export interface Food {
  /** Display name of the food */
  name: string;
  /** Calorie content per unit/multiplier */
  cals: number;
  /** Quantity multiplier (default 1) */
  multiplier?: number;
  /** Associated meal category */
  mealType?: MealType;
}

/**
 * Saved combination of food items for quick logging.
 */
export interface RecipeCombo {
  /** Unique identifier for the combo */
  id: string;
  /** Display name of the combo */
  name: string;
  /** List of food items in this recipe */
  foods: Food[];
}

/**
 * Accumulated data for a single calendar day.
 */
export interface DayData {
  /** Morning or current weight in kilograms */
  weight: number;
  /** Daily step count logged from trackers */
  steps: number;
  /** List of performed workouts */
  workouts: Workout[];
  /** List of consumed food items */
  foods: Food[];
}

/**
 * Root database structure indexed by date strings (YYYY-MM-DD).
 */
export interface Database {
  [date: string]: DayData;
}

/**
 * Summary object containing all calculated metabolic metrics for a day.
 */
export interface DailySummaryMetrics {
  /** Basal Metabolic Rate (at rest) */
  bmr: number;
  /** Non-Exercise Activity Thermogenesis (steps, etc) */
  neat: number;
  /** Exercise Activity Thermogenesis */
  eat: number;
  /** Thermic Effect of Food (energy cost of digestion) */
  tef: number;
  /** Total Daily Energy Expenditure (including TEF) */
  tdee: number;
  /** Total calories consumed from food */
  intake: number;
  /** Current calorie balance (TDEE - Intake) */
  deficit: number;
}
