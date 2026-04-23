/**
 * Utility for mobile haptic feedback using the Web Vibration API.
 * Provides subtle tactile confirmation for user interactions.
 */
export class HapticUtils {
  /**
   * Triggers a light vibration 'tick'.
   * @param duration Duration in milliseconds (default 15ms for a light tick)
   */
  static lightTick(duration: number = 15): void {
    this.vibrate(duration);
  }

  /**
   * Triggers a success pattern (two short vibrations).
   */
  static success(): void {
    this.vibrate([10, 50, 10]);
  }

  /**
   * Core vibration wrapper with safety checks.
   */
  private static vibrate(pattern: VibratePattern): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently fail if blocked by browser policy or hardware missing
      }
    }
  }
}
