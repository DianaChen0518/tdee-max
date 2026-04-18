import { Food } from '../types';

/**
 * Validates cloud backup data before applying to local store.
 * Prevents corrupted or malicious Gist content from crashing the app.
 */
export class DataValidator {
  /**
   * Validates the top-level structure and critical fields of a cloud backup payload.
   * @returns Object with `valid` flag and an array of human-readable `errors`.
   */
  static validateCloudData(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Root payload is not an object'] };
    }

    const d = data as Record<string, unknown>;

    // --- userProfile ---
    if (d.userProfile !== undefined) {
      if (typeof d.userProfile !== 'object' || d.userProfile === null) {
        errors.push('userProfile is not an object');
      } else {
        const p = d.userProfile as Record<string, unknown>;
        if (p.heightCm !== undefined && typeof p.heightCm !== 'number') {
          errors.push('userProfile.heightCm is not a number');
        }
        if (p.gender !== undefined && !['M', 'F'].includes(p.gender as string)) {
          errors.push('userProfile.gender must be "M" or "F"');
        }
      }
    }

    // --- database ---
    if (d.database !== undefined) {
      if (typeof d.database !== 'object' || d.database === null || Array.isArray(d.database)) {
        errors.push('database is not a key-value object');
      } else {
        const db = d.database as Record<string, unknown>;
        for (const [key, val] of Object.entries(db)) {
          // Validate date key format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
            errors.push(`Invalid date key format: "${key}"`);
            continue;
          }
          // Validate DayData shape
          if (!val || typeof val !== 'object') {
            errors.push(`Day "${key}" is not an object`);
            continue;
          }
          const day = val as Record<string, unknown>;
          if (!Array.isArray(day.foods)) {
            errors.push(`Day "${key}".foods is not an array`);
          }
          if (!Array.isArray(day.workouts)) {
            errors.push(`Day "${key}".workouts is not an array`);
          }
        }
      }
    }

    // --- commonFoods ---
    if (d.commonFoods !== undefined) {
      if (!Array.isArray(d.commonFoods)) {
        errors.push('commonFoods is not an array');
      } else {
        (d.commonFoods as unknown[]).forEach((f, i) => {
          if (!this.isValidFood(f)) {
            errors.push(`commonFoods[${i}] is missing required name/cals`);
          }
        });
      }
    }

    // --- recipeCombos ---
    if (d.recipeCombos !== undefined) {
      if (!Array.isArray(d.recipeCombos)) {
        errors.push('recipeCombos is not an array');
      } else {
        (d.recipeCombos as unknown[]).forEach((rc, i) => {
          if (!rc || typeof rc !== 'object') {
            errors.push(`recipeCombos[${i}] is not an object`);
          } else {
            const combo = rc as Record<string, unknown>;
            if (!Array.isArray(combo.foods)) {
              errors.push(`recipeCombos[${i}].foods is not an array`);
            }
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /** Checks that a value satisfies the minimum Food shape: name (string) + cals (number). */
  private static isValidFood(f: unknown): f is Food {
    if (!f || typeof f !== 'object') return false;
    const food = f as Record<string, unknown>;
    return typeof food.name === 'string' && typeof food.cals === 'number';
  }
}
