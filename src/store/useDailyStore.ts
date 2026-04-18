import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { Database, DayData, Food, RecipeCombo, DailySummaryMetrics, MealType } from '../types';
import { CalculatorService } from '../services/CalculatorService';
import { DayManager } from '../utils/day-manager';
import { DateUtils } from '../utils/DateUtils';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/IdUtils';
import { useProfileStore } from './useProfileStore';

export const useDailyStore = defineStore('daily', () => {
  const profileStore = useProfileStore();
  const database = useStorage<Database>('tdee_db_v2', {});
  const selectedDate = ref(DateUtils.getLocalYYYYMMDD());

  // Data Migration for IDs
  const migrateDataIds = () => {
    for (const dateStr of Object.keys(database.value)) {
      const day = database.value[dateStr];
      day.foods.forEach(f => {
        if (!f.id) f.id = generateId();
      });
      day.workouts.forEach(w => {
        if (!w.id) w.id = generateId();
      });
    }
  };
  migrateDataIds();

  const activeDay = computed((): DayData => {
    return database.value[selectedDate.value] || { weight: 0, steps: 0, workouts: [], foods: [] };
  });

  const summary = computed((): DailySummaryMetrics => {
    return CalculatorService.calculateDailySummary(activeDay.value, profileStore.userProfile, selectedDate.value);
  });

  const age = computed(() => CalculatorService.calculateAge(profileStore.userProfile.birthDate, selectedDate.value));
  const bmr = computed(() => summary.value.bmr);
  const tefCalories = computed(() => summary.value.tef);
  const stepCalories = computed(() => summary.value.neat);
  const workoutCalories = computed(() => summary.value.eat);
  const epocCalories = computed(() => summary.value.epoc);
  const tdee = computed(() => summary.value.tdee);
  const totalConsumed = computed(() => summary.value.intake);
  const dailyDeficit = computed(() => summary.value.deficit);

  const initDayIfNotExists = (dateStr: string) => {
    if (!database.value[dateStr]) {
      database.value[dateStr] = DayManager.initDay(database.value, dateStr);
    }
  };

  watch(
    selectedDate,
    newDate => {
      initDayIfNotExists(newDate);
    },
    { immediate: true }
  );

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

  const addFoodToDay = (name: string, cals: number, mealType: MealType) => {
    const existing = activeDay.value.foods.find(f => f.name === name && (f.mealType || 'uncategorized') === mealType);
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
      const existing = activeDay.value.foods.find(
        (f: Food) => f.name === cf.name && (f.mealType || 'uncategorized') === mealType
      );
      if (existing) {
        existing.multiplier = (existing.multiplier || 1) + (cf.multiplier || 1);
      } else {
        activeDay.value.foods.push({ ...cf, id: generateId(), mealType });
      }
    });
  };

  const addWorkout = () => {
    activeDay.value.workouts.push({
      id: generateId(),
      type: 'aerobic',
      hr: 0,
      mins: 0,
      secs: 0,
      intensity: 'med',
      kcal: 0
    });
  };

  const removeWorkout = (workoutId: string) => {
    const idx = activeDay.value.workouts.findIndex(w => w.id === workoutId);
    if (idx > -1) activeDay.value.workouts.splice(idx, 1);
  };

  return {
    database,
    selectedDate,
    activeDay,
    age,
    bmr,
    tefCalories,
    stepCalories,
    workoutCalories,
    epocCalories,
    tdee,
    totalConsumed,
    dailyDeficit,
    summary,
    changeDate,
    goToToday,
    clearDayData,
    copyYesterdayDiet,
    copyMealToTomorrow,
    addFoodToDay,
    removeFoodFromDay,
    adjustFoodMultiplier,
    applyComboToDay,
    addWorkout,
    removeWorkout
  };
});
