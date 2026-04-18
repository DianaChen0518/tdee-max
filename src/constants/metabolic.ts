/**
 * Metabolic Constants & Coefficients
 * Based on Mifflin-St Jeor, Keytel et al., and standard exercise science.
 */

export const BMR_CONSTANTS = {
  MALES: {
    OFFSET: 5,
    WEIGHT_MULT: 10,
    HEIGHT_MULT: 6.25,
    AGE_MULT: 5
  },
  FEMALES: {
    OFFSET: -161,
    WEIGHT_MULT: 10,
    HEIGHT_MULT: 6.25,
    AGE_MULT: 5
  }
};

export const THERMIC_EFFECT_OF_FOOD_RATIO = 0.1;

export const NEAT_CONSTANTS = {
  CALORIES_PER_STEP: 0.035, // More conservative: 10000 steps ~= 350-500 kcal depending on weight
  WEIGHT_COEFFICIENT: 0.00045 // Adjusted downward based on engineering review
};

/**
 * Piecewise Linear EPOC Intensity Model
 * 1. <0.60 HRR: 3% - 6%
 * 2. 0.60-0.80 HRR: 6% - 11%
 * 3. >=0.80 HRR: 11% - 21%
 */
export const EPOC_SEGMENTS = {
  LOW: { threshold: 0.60, base: 0.03, slope: 0.05 },
  MODERATE: { threshold: 0.80, base: 0.06, slope: 0.25 },
  HIGH: { base: 0.11, slope: 0.20 }
};

/**
 * EPOC Duration Scaling Model
 * Corrects for short-burst efficiency and long-duration synergy.
 */
export const EPOC_DURATION_MODEL = {
  SHORT_MIN: 15,
  LONG_MIN: 40,
  SHORT_BASE: 0.7,
  SHORT_SLOPE: 0.3,
  LONG_BASE: 1.0,
  LONG_SLOPE: 0.1,
  MAX_FACTOR: 1.1
};

export const AEROBIC_FORMULA_CONSTANTS = {
  MALES: {
    INTERCEPT: -55.0969,
    HR_MULT: 0.6309,
    WEIGHT_MULT: 0.1988,
    AGE_MULT: 0.2017,
    DIVISOR: 4.184
  },
  FEMALES: {
    INTERCEPT: -20.4022,
    HR_MULT: 0.4472,
    WEIGHT_MULT: -0.1263,
    AGE_MULT: 0.0740,
    DIVISOR: 4.184
  }
};

export const MET_VALUES = {
  RESISTANCE_HIGH: 7.0,
  RESISTANCE_MEDIUM: 5.0,
  RESISTANCE_LOW: 3.5
};

export const MAX_HR_TANAKA = {
  INTERCEPT: 208,
  AGE_MULT: 0.7,
  SAFETY_OFFSET: 10 // Buffer for sensor anomalies
};

// --- General Constants (P3: extracted magic numbers) ---

/** Minutes in a day — used for BMR-per-minute derivation. */
export const MINUTES_PER_DAY = 1440;

/** Minimum HR (bpm) for aerobic calorie calculation to activate. */
export const AEROBIC_HR_MIN_THRESHOLD = 80;

/** kJ → kcal conversion divisor (1 kcal = 4.184 kJ). */
export const KJ_TO_KCAL_FACTOR = 4.184;

/** kcal energy equivalent of 1 gram of body fat. */
export const KCAL_PER_GRAM_FAT = 7.7;
