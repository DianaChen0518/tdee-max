import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food, RecipeCombo, DailySummaryMetrics } from '../types';
import { CalculatorService } from '../services/CalculatorService';

/**
 * Utility to get YYYY-MM-DD in local timezone.
 */
export const getLocalYYYYMMDD = (d: Date): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

/**
 * Main TDEE Store for managing user profile, food database, and daily logs.
 */
export const useTdeeStore = defineStore('tdee', () => {
  // --- Persistent State ---
  const userProfile = useStorage<UserProfile>('tdee_user_v2', {
    birthDate: '', 
    heightCm: 0,
    gender: 'M'
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

  // --- Reactive State ---
  const selectedDate = ref(getLocalYYYYMMDD(new Date()));

  // --- Computed Views ---
  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  const activeDay = computed((): DayData => {
    return database.value[selectedDate.value] || { weight: 0, steps: 0, workouts: [], foods: [] };
  });

  /**
   * Comprehensive metabolic metrics for the selected day.
   */
  const summary = computed((): DailySummaryMetrics => {
    return CalculatorService.calculateDailySummary(activeDay.value, userProfile.value);
  });

  // Individual metrics (proxied from summary for backward compatibility and ease of use)
  const age = computed(() => CalculatorService.calculateAge(userProfile.value.birthDate));
  const bmr = computed(() => summary.value.bmr);
  const baseCalories = computed(() => Math.round(summary.value.bmr * 1.1));
  const stepCalories = computed(() => summary.value.neat);
  const workoutCalories = computed(() => summary.value.eat);
  const tdee = computed(() => summary.value.tdee);
  const totalConsumed = computed(() => summary.value.intake);
  const dailyDeficit = computed(() => summary.value.deficit);

  // --- Actions ---

  /**
   * Ensures a day record exists in the database.
   */
  const initDayIfNotExists = (dateStr: string) => {
    if (!database.value[dateStr]) {
      let defaultWeight = 0;
      const pastDates = Object.keys(database.value).filter(d => d < dateStr).sort();
      if (pastDates.length > 0) {
        defaultWeight = database.value[pastDates[pastDates.length - 1]].weight;
      }
      database.value[dateStr] = { weight: defaultWeight, steps: 0, workouts: [], foods: [] };
    }
  };

  // Keep database initialized for the selected date
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
      .sort();
    if (pastDates.length > 0) {
      const lastFoodDay = database.value[pastDates[pastDates.length - 1]];
      activeDay.value.foods = lastFoodDay.foods.map(f => ({ ...f }));
    }
  };

  const copyMealToTomorrow = (mealType: string) => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = getLocalYYYYMMDD(d);
    
    initDayIfNotExists(tomorrowStr);
    
    const foodsToCopy = activeDay.value.foods.filter(f => (f.mealType || 'uncategorized') === mealType);
    if (foodsToCopy.length === 0) return;
    
    foodsToCopy.forEach(sourceFood => {
      const targetType = sourceFood.mealType || 'uncategorized';
      const existing = database.value[tomorrowStr].foods.find(f => 
        f.name === sourceFood.name && (f.mealType || 'uncategorized') === targetType
      );
      
      const multiplierToAdd = Math.max(1, sourceFood.multiplier || 1);
      if (existing) {
        existing.multiplier = (existing.multiplier || 1) + multiplierToAdd;
      } else {
        database.value[tomorrowStr].foods.push({ 
          ...sourceFood, 
          multiplier: multiplierToAdd 
        });
      }
    });
  };

  return {
    userProfile, githubToken, gistId, database, commonFoods, recipeCombos, selectedDate, activeDay,
    isConfigured, 
    age, bmr, baseCalories, stepCalories, workoutCalories, tdee, totalConsumed, dailyDeficit, summary,
    changeDate, goToToday, clearDayData, copyYesterdayDiet, copyMealToTomorrow
  };
});
