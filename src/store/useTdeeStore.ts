import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food, RecipeCombo, DailySummaryMetrics } from '../types';
import { CalculatorService } from '../services/CalculatorService';
import { DayManager } from '../utils/day-manager';

/**
 * Utility to get YYYY-MM-DD in local timezone.
 */
export const getLocalYYYYMMDD = (d: Date): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

/**
 * Main TDEE Store for managing user profile, food database, and daily logs.
 * Follows an enterprise-grade setup with logic decoupled into Services/Utils.
 */
export const useTdeeStore = defineStore('tdee', () => {
  // --- Persistent State ---
  const userProfile = useStorage<UserProfile>('tdee_user_v2', {
    birthDate: '', 
    heightCm: 0,
    gender: 'M',
    rhr: 70
  });

  const database = useStorage<Database>('tdee_db_v2', {});
  
  const commonFoods = useStorage<Food[]>('tdee_foods_v2', [
    { name: '生鸡胸肉 (100g)', cals: 133 },
    { name: '熟米饭 (100g)', cals: 116 },
    { name: '水煮蛋 (1个)', cals: 75 },
    { name: '黑咖啡', cals: 5 }
  ]);

  const recipeCombos = useStorage<RecipeCombo[]>('tdee_recipe_combos', []);
  const githubToken = useStorage<string>('tdee_github_token', '');
  const gistId = useStorage<string>('tdee_gist_id', '');

  // --- Reactive UI State ---
  const selectedDate = ref(getLocalYYYYMMDD(new Date()));

  // --- Computed Views ---
  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  const activeDay = computed((): DayData => {
    return database.value[selectedDate.value] || { weight: 0, steps: 0, workouts: [], foods: [] };
  });

  const summary = computed((): DailySummaryMetrics => {
    return CalculatorService.calculateDailySummary(activeDay.value, userProfile.value, selectedDate.value);
  });

  // Individual derived metrics
  const age = computed(() => CalculatorService.calculateAge(userProfile.value.birthDate, selectedDate.value));
  const bmr = computed(() => summary.value.bmr);
  const tefCalories = computed(() => summary.value.tef);
  const stepCalories = computed(() => summary.value.neat);
  const workoutCalories = computed(() => summary.value.eat);
  const epocCalories = computed(() => summary.value.epoc);
  const tdee = computed(() => summary.value.tdee);
  const totalConsumed = computed(() => summary.value.intake);
  const dailyDeficit = computed(() => summary.value.deficit);

  // --- Actions ---

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
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + days);
    selectedDate.value = getLocalYYYYMMDD(d);
  };
  
  const goToToday = () => {
    selectedDate.value = getLocalYYYYMMDD(new Date());
  };

  const clearDayData = () => {
    database.value[selectedDate.value] = { weight: 0, steps: 0, workouts: [], foods: [] };
  };

  const copyYesterdayDiet = () => {
    const pastDates = Object.keys(database.value)
      .filter(d => d < selectedDate.value && database.value[d].foods.length > 0)
      .sort((a, b) => b.localeCompare(a));
    
    if (pastDates.length > 0) {
      const lastFoodDay = database.value[pastDates[0]];
      database.value[selectedDate.value].foods = lastFoodDay.foods.map(f => ({ ...f }));
    }
  };

  const copyMealToTomorrow = (mealType: string) => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = getLocalYYYYMMDD(d);
    
    initDayIfNotExists(tomorrowStr);
    
    database.value[tomorrowStr].foods = DayManager.copyFoods(
      activeDay.value.foods,
      database.value[tomorrowStr].foods,
      mealType
    );
  };

  return {
    userProfile, githubToken, gistId, database, commonFoods, recipeCombos, selectedDate, activeDay,
    isConfigured, 
    age, bmr, tefCalories, stepCalories, workoutCalories, epocCalories, tdee, totalConsumed, dailyDeficit, summary,
    changeDate, goToToday, clearDayData, copyYesterdayDiet, copyMealToTomorrow
  };
});
