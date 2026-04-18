import { UserProfile } from '../types';

/**
 * Validation Guard implements defensive programming patterns.
 * Ensures data sanity before entering high-precision metabolic logic.
 */
export class ValidationGuard {
  /**
   * Validates if a user profile has minimum required fields for calculation.
   */
  static isProfileCalculable(profile: UserProfile): boolean {
    return !!(profile.birthDate && profile.heightCm > 0 && profile.gender);
  }

  /**
   * Sanitizes weight input to prevent division by zero or unrealistic metabolic outputs.
   */
  static sanitizeWeight(weight: number): number {
    if (!weight || weight <= 0) return 0;
    // Cap at 500kg for stability
    return Math.min(500, weight);
  }

  /**
   * Ensures step count is non-negative and within human physical limits for a 24h period.
   */
  static sanitizeSteps(steps: number): number {
    return Math.max(0, Math.min(100000, steps || 0));
  }

  /**
   * Clamps heart rate to biological physiological limits + safety buffer.
   */
  static clampHeartRate(hr: number, rhr: number, maxHROffset: number): number {
    const minHR = Math.max(30, rhr);
    const maxHR = 220 + maxHROffset; // Absolute biological limit for safety
    return Math.max(minHR, Math.min(maxHR, hr));
  }
}
