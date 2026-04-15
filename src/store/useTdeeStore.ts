import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food, RecipeCombo } from '../types';
import { calculateAge, calcBMR, calcNEAT, calcEAT } from '../utils/formulas';

export const getLocalYYYYMMDD = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

export const useTdeeStore = defineStore('tdee', () => {
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

  const selectedDate = ref(getLocalYYYYMMDD(new Date()));

  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  const activeDay = computed((): DayData => {
    return database.value[selectedDate.value] || { weight: 0, steps: 0, workouts: [], foods: [] };
  });

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

  watch(selectedDate, (newDate) => {
    initDayIfNotExists(newDate);
  }, { immediate: true });

  const age = computed(() => calculateAge(userProfile.value.birthDate));
  
  const bmr = computed(() => calcBMR(activeDay.value.weight, userProfile.value.heightCm, age.value, userProfile.value.gender));
  const baseCalories = computed(() => bmr.value * 1.1);
  const stepCalories = computed(() => calcNEAT(activeDay.value.weight, activeDay.value.steps));
  
  // 修正：调用 calcEAT 时传入性别
  const workoutCalories = computed(() => calcEAT(activeDay.value.workouts, activeDay.value.weight, age.value, userProfile.value.gender));
  
  const tdee = computed(() => baseCalories.value + stepCalories.value + workoutCalories.value);
  const totalConsumed = computed(() => activeDay.value.foods.reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0));
  const dailyDeficit = computed(() => tdee.value - totalConsumed.value);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + days);
    selectedDate.value = getLocalYYYYMMDD(d);
  };
  
  const goToToday = () => selectedDate.value = getLocalYYYYMMDD(new Date());

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
    
    // Merge foods to tomorrow exactly maintaining their source mealType
    foodsToCopy.forEach(sourceFood => {
      const targetType = sourceFood.mealType || 'uncategorized';
      const existing = database.value[tomorrowStr].foods.find(f => f.name === sourceFood.name && (f.mealType || 'uncategorized') === targetType);
      
      if (existing) {
        existing.multiplier = Math.max(1, existing.multiplier || 1) + Math.max(1, sourceFood.multiplier || 1);
      } else {
        database.value[tomorrowStr].foods.push({ ...sourceFood, multiplier: Math.max(1, sourceFood.multiplier || 1) });
      }
    });
  };

  return {
    userProfile, githubToken, gistId, database, commonFoods, recipeCombos, selectedDate, activeDay,
    isConfigured, 
    age, bmr, baseCalories, stepCalories, workoutCalories, tdee, totalConsumed, dailyDeficit,
    changeDate, goToToday, clearDayData, copyYesterdayDiet, copyMealToTomorrow
  };
});
