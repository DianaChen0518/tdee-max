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

export const EPOC_TIERS = [
  { threshold: 0.50, multiplier: 0.02, label: 'Low Intensity' },
  { threshold: 0.70, multiplier: 0.07, label: 'Moderate Intensity' },
  { threshold: 0.85, multiplier: 0.14, label: 'High Intensity' },
  { threshold: 1.00, multiplier: 0.20, label: 'Peak/Anaerobic' }
];

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
