import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food, RecipeCombo, DailySummaryMetrics } from '../types';
import { CalculatorService } from '../services/CalculatorService';
import { DayManager } from '../utils/day-manager';
import { DateUtils } from '../utils/DateUtils';
import { Logger } from '../utils/Logger';
import { GistService, GistSyncResult } from '../services/GistService';

/**
 * Main TDEE Store for managing user profile, food database, and daily logs.
 * Orchestrates state while delegating business logic to Services/Utils.
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
      gistId.value = result.data.id;
    }

    return result;
  };

  return {
    userProfile, githubToken, gistId, database, commonFoods, recipeCombos, selectedDate, activeDay,
    isConfigured, isCloudSyncEnabled,
    age, bmr, tefCalories, stepCalories, workoutCalories, epocCalories, tdee, totalConsumed, dailyDeficit, summary,
    changeDate, goToToday, clearDayData, copyYesterdayDiet, copyMealToTomorrow, syncToCloud
  };
});
