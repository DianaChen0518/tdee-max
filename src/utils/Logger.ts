/// <reference types="vite/client" />

/**
 * Structured Logger for calculation auditing and system monitoring.
 * Facilitates debugging of complex metabolic logic in non-production environments.
 */
export class Logger {
  private static readonly prefix = '[TDEE-Core]';

  static info(message: string, context?: unknown) {
    if (import.meta.env.DEV) {
      console.log(`${this.prefix} INFO: ${message}`, context || '');
    }
  }

  static warn(message: string, context?: unknown) {
    console.warn(`${this.prefix} WARN: ${message}`, context || '');
  }

  static error(message: string, error?: unknown) {
    console.error(`${this.prefix} ERROR: ${message}`, error || '');
  }

  /**
   * Specifically for tracing calculation steps.
   */
  static trace(calculation: string, value: number, details?: unknown) {
    if (import.meta.env.DEV) {
      console.debug(`${this.prefix} CALC-TRACE: ${calculation} => ${value.toFixed(2)}`, details || '');
    }
  }
}
