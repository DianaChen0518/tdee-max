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
  CALORIES_PER_STEP: 0.04, // Approximation: 10000 steps ~= 400 kcal
  WEIGHT_COEFFICIENT: 0.0005 // Extra burn based on body mass
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

export const EPOC_DURATION_THRESHOLD_MINS = 20;

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
  AGE_MULT: 0.7
};
