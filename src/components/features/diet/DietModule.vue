<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTdeeStore } from '../../../store/useTdeeStore';
import { MealType, Food } from '../../../types';
import { useNotification } from '../../../composables/useNotification';
import { useI18n } from 'vue-i18n';

const store = useTdeeStore();
const notify = useNotification();
const { t } = useI18n();

const getAutoMealType = (): MealType => {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 10) return 'breakfast';
  if (hr >= 10 && hr < 14) return 'lunch';
  if (hr >= 17 && hr < 21) return 'dinner';
  return 'snack';
};

const currentMealType = ref<MealType>(getAutoMealType());
const mealTypeLabels = computed<Record<MealType, string>>(() => ({
  breakfast: t('diet.mealLabels.breakfast'),
  lunch: t('diet.mealLabels.lunch'),
  dinner: t('diet.mealLabels.dinner'),
  snack: t('diet.mealLabels.snack'),
  uncategorized: t('diet.mealLabels.uncategorized')
}));

const customFood = ref<{ name: string; cals: number | null; unit: 'kcal' | 'kJ' }>({ 
  name: '', cals: null, unit: 'kcal' 
});

const addFoodItemHelper = (name: string, cals: number) => {
  const existing = store.activeDay.foods.find(f => 
    f.name === name && (f.mealType || 'uncategorized') === currentMealType.value
  );
  if (existing) {
    existing.multiplier = (existing.multiplier || 1) + 1;
  } else {
    store.activeDay.foods.push({ name, cals, multiplier: 1, mealType: currentMealType.value });
  }
};

const addFood = () => {
  const cals = customFood.value.cals;
  if (customFood.value.name && cals !== null && !isNaN(cals) && cals >= 0) {
    const finalCals = customFood.value.unit === 'kJ' ? (cals / 4.184) : cals;
    addFoodItemHelper(customFood.value.name, finalCals);
    customFood.value.name = ''; 
    customFood.value.cals = null;
  }
};

const saveQuickFood = () => {
  const cals = customFood.value.cals;
  if (customFood.value.name && cals !== null && !isNaN(cals) && cals >= 0) {
    const finalCals = customFood.value.unit === 'kJ' ? (cals / 4.184) : cals;
    store.commonFoods.push({ name: customFood.value.name, cals: finalCals });
    customFood.value.name = ''; 
    customFood.value.cals = null;
    notify.success(t('notifications.quickFoodSaved'));
  }
};

const saveCombo = (mealType: string) => {
  const foods = store.activeDay.foods.filter(f => (f.mealType || 'uncategorized') === mealType);
  if (foods.length === 0) {
    notify.error(t('notifications.comboEmptyError'));
    return;
  }
  const comboName = prompt(
    t('diet.comboPrompt', { count: foods.length }), 
    t('diet.comboDefaultName', { meal: mealTypeLabels.value[mealType as MealType] })
  );
  if (comboName) {
    store.recipeCombos.push({
      id: Date.now().toString(),
      name: comboName,
      foods: foods.map(f => ({ ...f }))
    });
    notify.success(t('notifications.comboSaved', { name: comboName }));
  }
};

const applyCombo = (combo: any) => {
  combo.foods.forEach((cf: Food) => {
    const existing = store.activeDay.foods.find((f: Food) => 
      f.name === cf.name && (f.mealType || 'uncategorized') === currentMealType.value
    );
    if (existing) {
      existing.multiplier = (existing.multiplier || 1) + (cf.multiplier || 1);
    } else {
      store.activeDay.foods.push({ ...cf, mealType: currentMealType.value });
    }
  });
  notify.success(t('notifications.comboLoaded', { name: combo.name }));
};

const handleCopyMeal = (mealType: string) => {
  store.copyMealToTomorrow(mealType);
  notify.success(t('notifications.copyTomorrowSuccess', { name: mealTypeLabels.value[mealType as MealType] }));
};

const groupedFoods = computed(() => {
  const groups: Record<MealType, Food[]> = {
    breakfast: [], lunch: [], dinner: [], snack: [], uncategorized: []
  };
  store.activeDay.foods.forEach((f: Food) => {
    const type = (f.mealType || 'uncategorized') as MealType;
    if (groups[type]) groups[type].push(f);
  });
  return groups;
});
</script>

<template>
  <div class="bg-white dark:bg-[#1e1e1e] p-4 md:p-5 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none flex flex-col transition-colors max-h-[100vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
    <h2 class="text-lg font-bold mb-3 shrink-0 text-gray-800 dark:text-white">🍽️ {{ t('diet.title') }}</h2>
    
    <!-- Tab Selector -->
    <div class="flex gap-1.5 mb-3 bg-gray-100/80 dark:bg-[#2c2c2c] p-1.5 rounded-inner shrink-0">
      <button 
        v-for="kind in (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])" 
        :key="kind"
        @click="currentMealType = kind" 
        :class="['flex-1 py-1.5 text-[13px] font-bold rounded-btn transition-all', currentMealType === kind ? 'bg-white dark:bg-[#1e1e1e] text-blue-600 dark:text-blue-400 shadow-sm transform scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']"
      >
        {{ mealTypeLabels[kind] }}
      </button>
    </div>

    <!-- Quick Entry Panel -->
    <div class="flex flex-col gap-2.5 mb-3 bg-gray-50/80 dark:bg-[#252525] p-3 rounded-inner border border-gray-100 dark:border-[#333] shrink-0 transition-colors">
      <div class="flex gap-2 w-full">
        <input type="text" v-model="customFood.name" :placeholder="t('diet.placeholderFood')" class="flex-1 min-w-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-btn p-2 text-sm font-medium text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500">
        <input type="number" v-model.number="customFood.cals" min="0" :placeholder="t('diet.placeholderCals')" class="w-[72px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-btn p-2 text-sm font-semibold text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500">
        <select v-model="customFood.unit" class="w-[68px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-btn p-2 text-sm font-medium text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500 cursor-pointer">
          <option value="kcal">{{ t('diet.unitKcal') }}</option>
          <option value="kJ">{{ t('diet.unitKj') }}</option>
        </select>
      </div>
      <div class="flex gap-2 w-full">
        <button @click="addFood" class="bg-blue-600 hover:bg-blue-500 text-white flex-1 py-2 rounded-btn text-sm font-bold transition-colors shadow-md">{{ t('diet.eat') }}</button>
        <button @click="saveQuickFood" class="bg-purple-600 hover:bg-purple-500 text-white flex-1 py-2 rounded-btn text-sm font-bold transition-colors shadow-md">{{ t('diet.saveQuick') }}</button>
      </div>
    </div>
    
    <!-- Recipe Combos -->
    <div v-if="store.recipeCombos.length > 0" class="mb-2 shrink-0">
      <div class="text-[11px] text-gray-500 dark:text-gray-400 mb-1 font-bold">
        <span>🍱 {{ t('diet.comboTitle') }}</span>
      </div>
      <div class="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
        <div v-for="(combo, i) in store.recipeCombos" :key="combo.id" class="flex items-center bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-btn overflow-hidden transition-colors hover:shadow-sm">
          <button @click="applyCombo(combo)" class="text-[11px] font-bold px-3 py-1.5 hover:bg-white dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 transition-colors">
            {{ combo.name }}
          </button>
          <button @click="store.recipeCombos.splice(i,1)" class="px-2 py-1.5 text-purple-400 dark:text-purple-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-[10px] border-l border-purple-200 dark:border-purple-800/50">✕</button>
        </div>
      </div>
    </div>
    
    <!-- Common Foods Library -->
    <div class="mb-3 shrink-0">
      <div class="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1 custom-scrollbar">
        <div v-for="(f, i) in store.commonFoods" :key="i" class="flex items-center bg-gray-100/80 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-full overflow-hidden transition-colors hover:shadow-sm">
          <button @click="addFoodItemHelper(f.name, f.cals)" class="text-[11px] font-medium px-3 py-1.5 hover:bg-white dark:hover:bg-[#3c3c3c] text-gray-700 dark:text-gray-200">
            {{ f.name }} <span class="opacity-60 ml-0.5">{{ Math.round(f.cals) }}</span>
          </button>
          <button @click="store.commonFoods.splice(i,1)" class="px-2 py-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-[10px] border-l border-gray-200 dark:border-[#444]">✕</button>
        </div>
      </div>
    </div>

    <!-- Grouped Food List -->
    <div class="flex-1 border-t border-gray-200 dark:border-[#333] pt-3 flex flex-col transition-colors">
      <div class="space-y-4 flex-1">
        <template v-for="kind in (['breakfast', 'lunch', 'dinner', 'snack', 'uncategorized'] as MealType[])" :key="kind">
          <div v-if="groupedFoods[kind].length > 0" class="mb-5 last:mb-0">
            <div class="flex items-center justify-between mb-2.5 px-1">
              <span class="text-[14px] font-bold tracking-wider text-slate-700 dark:text-slate-200">{{ mealTypeLabels[kind] }}</span>
              <div class="flex gap-1">
                <button @click="saveCombo(kind)" class="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-2 py-1 rounded-btn transition-colors font-bold">
                  💾 {{ t('diet.saveCombo') }}
                </button>
                <button @click="handleCopyMeal(kind)" class="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded-btn transition-colors font-bold">
                  🚀 {{ t('diet.copyTomorrow') }}
                </button>
              </div>
            </div>
            
            <transition-group name="list" tag="div">
              <div v-for="f in groupedFoods[kind]" :key="f.name" class="flex justify-between items-center bg-white dark:bg-[#252525] p-3 rounded-inner border border-slate-100/80 dark:border-[#333] shadow-sm mb-2 w-full gap-2">
                <span class="text-[15px] font-semibold truncate text-slate-800 dark:text-white flex-1 tracking-tight">{{ f.name }}</span>
                
                <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#444] rounded-full px-2 py-1 shrink-0">
                  <button @click="() => { if((f.multiplier || 1) > 1) { f.multiplier = (f.multiplier || 1) - 1; } else { store.activeDay.foods.splice(store.activeDay.foods.indexOf(f), 1); } }" class="text-slate-400 hover:bg-white hover:text-red-500 w-6 h-6 flex items-center justify-center font-bold transition-all">-</button>
                  <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200 w-5 text-center">{{ f.multiplier || 1 }}</span>
                  <button @click="f.multiplier = (f.multiplier || 1) + 1" class="text-slate-400 hover:bg-white hover:text-emerald-500 w-6 h-6 flex items-center justify-center font-bold transition-all">+</button>
                </div>

                <div class="flex items-center justify-end min-w-[50px] shrink-0">
                  <div class="flex items-baseline gap-0.5">
                    <span class="text-emerald-600 dark:text-emerald-400 font-extrabold tracking-tight text-[16px]">
                      {{ Math.round(f.cals * (f.multiplier || 1)) }}
                    </span>
                    <span class="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">kcal</span>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </template>

        <!-- Empty State -->
        <div v-if="store.activeDay.foods.length === 0" class="flex flex-col items-center justify-center py-6">
          <div class="text-gray-400 dark:text-gray-500 text-sm mb-3 font-medium">{{ t('diet.empty') }}</div>
          <button @click="store.copyYesterdayDiet" class="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-btn transition-colors font-bold">
            🔄 {{ t('diet.copyYesterday') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
