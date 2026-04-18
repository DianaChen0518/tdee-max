import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food, RecipeCombo, DailySummaryMetrics, MealType } from '../types';
import { CalculatorService } from '../services/CalculatorService';
import { DayManager } from '../utils/day-manager';
import { DateUtils } from '../utils/DateUtils';
import { Logger } from '../utils/Logger';
import { GistService, GistSyncResult } from '../services/GistService';
import { TokenVault } from '../utils/TokenVault';
import { generateId } from '../utils/IdUtils';
import i18n from '../i18n';

/**
 * Main TDEE Store for managing user profile, food database, and daily logs.
 * Orchestrates state while delegating business logic to Services/Utils.
 */
export const useTdeeStore = defineStore('tdee', () => {
  const { t } = i18n.global;

  // --- Persistent State ---
  const userProfile = useStorage<UserProfile>('tdee_user_v2', {
    birthDate: '', 
    heightCm: 0,
    gender: 'M',
    rhr: 70
  });

  const database = useStorage<Database>('tdee_db_v2', {});
  
  const commonFoods = useStorage<Food[]>('tdee_foods_v2', [
    { id: generateId(), name: t('defaults.foods.chicken'), cals: 133 },
    { id: generateId(), name: t('defaults.foods.rice'), cals: 116 },
    { id: generateId(), name: t('defaults.foods.egg'), cals: 75 },
    { id: generateId(), name: t('defaults.foods.coffee'), cals: 5 }
  ]);

  const recipeCombos = useStorage<RecipeCombo[]>('tdee_recipe_combos', []);

  // --- Secure Token Storage (P0 Fix: obfuscated instead of plaintext localStorage) ---
  const githubToken = ref(TokenVault.migrateLegacy() || TokenVault.retrieve());
  watch(githubToken, (newVal) => {
    TokenVault.store(newVal);
  });

  const gistId = useStorage<string>('tdee_gist_id', '');

  // --- Data Migration: ensure all list items have unique IDs for stable rendering ---
  const migrateDataIds = () => {
    for (const dateStr of Object.keys(database.value)) {
      const day = database.value[dateStr];
      day.foods.forEach(f => { if (!f.id) f.id = generateId(); });
      day.workouts.forEach(w => { if (!w.id) w.id = generateId(); });
    }
    commonFoods.value.forEach(f => { if (!f.id) f.id = generateId(); });
    recipeCombos.value.forEach(rc => {
      rc.foods.forEach(f => { if (!f.id) f.id = generateId(); });
    });
  };
  migrateDataIds();

  // --- Reactive UI State ---
  const selectedDate = ref(DateUtils.getLocalYYYYMMDD());

  // --- Computed Views ---
  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  const isCloudSyncEnabled = computed(() => {
    return !!(githubToken.value && githubToken.value.trim().length > 0);
  });

  const activeDay = computed((): DayData => {
    return database.value[selectedDate.value] || { weight: 0, steps: 0, workouts: [], foods: [] };
  });

  const summary = computed((): DailySummaryMetrics => {
    return CalculatorService.calculateDailySummary(activeDay.value, userProfile.value, selectedDate.value);
  });

  // Individual derived metrics for UI convenience
  const age = computed(() => CalculatorService.calculateAge(userProfile.value.birthDate, selectedDate.value));
  const bmr = computed(() => summary.value.bmr);
  const tefCalories = computed(() => summary.value.tef);
  const stepCalories = computed(() => summary.value.neat);
  const workoutCalories = computed(() => summary.value.eat);
  const epocCalories = computed(() => summary.value.epoc);
  const tdee = computed(() => summary.value.tdee);
  const totalConsumed = computed(() => summary.value.intake);
  const dailyDeficit = computed(() => summary.value.deficit);

  // --- Core Day Actions ---

  const initDayIfNotExists = (dateStr: string) => {
    if (!database.value[dateStr]) {
      database.value[dateStr] = DayManager.initDay(database.value, dateStr);
    }
  };

  // Lifecycle Sync
  watch(selectedDate, (newDate) => {
    initDayIfNotExists(newDate);
  }, { immediate: true });

  const changeDate = (days: number) => {
    selectedDate.value = DateUtils.offsetDate(selectedDate.value, days);
  };
  
  const goToToday = () => {
    selectedDate.value = DateUtils.getLocalYYYYMMDD();
  };

  const clearDayData = () => {
    Logger.info('Clearing data for date', selectedDate.value);
    database.value[selectedDate.value] = { weight: 0, steps: 0, workouts: [], foods: [] };
  };

  const copyYesterdayDiet = () => {
    const lastFoods = DayManager.findLastDietDayFoods(database.value, selectedDate.value);
    if (lastFoods.length > 0) {
      database.value[selectedDate.value].foods = lastFoods;
      Logger.info('Copied past diet to current day', { date: selectedDate.value });
    }
  };

  const copyMealToTomorrow = (mealType: string) => {
    const tomorrowStr = DateUtils.offsetDate(selectedDate.value, 1);
    initDayIfNotExists(tomorrowStr);
    
    database.value[tomorrowStr].foods = DayManager.copyFoods(
      activeDay.value.foods,
      database.value[tomorrowStr].foods,
      mealType
    );
    Logger.info(`Copied ${mealType} to tomorrow`, { tomorrowStr });
  };

  // --- Food Actions (P0 Fix: centralized mutations with ID generation) ---

  const addFoodToDay = (name: string, cals: number, mealType: MealType) => {
    const existing = activeDay.value.foods.find(f => 
      f.name === name && (f.mealType || 'uncategorized') === mealType
    );
    if (existing) {
      existing.multiplier = (existing.multiplier || 1) + 1;
    } else {
      activeDay.value.foods.push({ id: generateId(), name, cals, multiplier: 1, mealType });
    }
  };

  const removeFoodFromDay = (foodId: string) => {
    const idx = activeDay.value.foods.findIndex(f => f.id === foodId);
    if (idx > -1) activeDay.value.foods.splice(idx, 1);
  };

  const adjustFoodMultiplier = (foodId: string, delta: number) => {
    const food = activeDay.value.foods.find(f => f.id === foodId);
    if (!food) return;
    const newVal = (food.multiplier || 1) + delta;
    if (newVal <= 0) {
      removeFoodFromDay(foodId);
    } else {
      food.multiplier = newVal;
    }
  };

  const applyComboToDay = (combo: RecipeCombo, mealType: MealType) => {
    combo.foods.forEach((cf: Food) => {
      const existing = activeDay.value.foods.find((f: Food) => 
        f.name === cf.name && (f.mealType || 'uncategorized') === mealType
      );
      if (existing) {
        existing.multiplier = (existing.multiplier || 1) + (cf.multiplier || 1);
      } else {
        activeDay.value.foods.push({ ...cf, id: generateId(), mealType });
      }
    });
  };

  const addCommonFood = (food: Food) => {
    commonFoods.value.push({ ...food, id: generateId() });
  };

  const removeCommonFood = (index: number) => {
    commonFoods.value.splice(index, 1);
  };

  const addRecipeCombo = (combo: RecipeCombo) => {
    recipeCombos.value.push(combo);
  };

  const removeRecipeCombo = (index: number) => {
    recipeCombos.value.splice(index, 1);
  };

  // --- Workout Actions (P0 Fix: centralized with ID generation) ---

  const addWorkout = () => {
    activeDay.value.workouts.push({
      id: generateId(),
      type: 'aerobic', hr: 0, mins: 0, secs: 0, intensity: 'med', kcal: 0
    });
  };

  const removeWorkout = (workoutId: string) => {
    const idx = activeDay.value.workouts.findIndex(w => w.id === workoutId);
    if (idx > -1) activeDay.value.workouts.splice(idx, 1);
  };

  // --- Cloud Sync ---

  const syncToCloud = async (): Promise<GistSyncResult> => {
    if (!isCloudSyncEnabled.value) {
      return { success: false, message: 'Cloud sync not configured' };
    }

    const payload = {
      userProfile: userProfile.value,
      database: database.value,
      commonFoods: commonFoods.value,
      recipeCombos: recipeCombos.value
    };

    const result = await GistService.pushToCloud(githubToken.value, gistId.value, payload);
    
    if (result.success && result.data?.id && !gistId.value) {
      gistId.value = result.data.id as string;
    }

    return result;
  };

  return {
    userProfile, githubToken, gistId, database, commonFoods, recipeCombos, selectedDate, activeDay,
    isConfigured, isCloudSyncEnabled,
    age, bmr, tefCalories, stepCalories, workoutCalories, epocCalories, tdee, totalConsumed, dailyDeficit, summary,
    changeDate, goToToday, clearDayData, copyYesterdayDiet, copyMealToTomorrow, syncToCloud,
    addFoodToDay, removeFoodFromDay, adjustFoodMultiplier, applyComboToDay,
    addCommonFood, removeCommonFood, addRecipeCombo, removeRecipeCombo,
    addWorkout, removeWorkout
  };
});
