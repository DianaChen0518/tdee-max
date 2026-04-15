<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTdeeStore, getLocalYYYYMMDD } from './store/useTdeeStore';
import SettingsModal from './components/SettingsModal.vue';
import DataVisModal from './components/DataVisModal.vue';
import { MealType } from './types';
import { exportTdeeData } from './utils/export';
import { useDark, useToggle } from '@vueuse/core';

const isDark = useDark();
const toggleDark = useToggle(isDark);

const store = useTdeeStore();
const showSettings = ref(false);
const showAudit = ref(false);

const getAutoMealType = (): MealType => {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 10) return 'breakfast';
  if (hr >= 10 && hr < 14) return 'lunch';
  if (hr >= 17 && hr < 21) return 'dinner';
  return 'snack';
};

const currentMealType = ref<MealType>(getAutoMealType());
const mealTypeLabels: Record<MealType, string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', uncategorized: '未分类'
};
const toastMsg = ref('✅ 保存成功');

onMounted(() => { if (!store.isConfigured) showSettings.value = true; });
watch(() => store.isConfigured, (configured) => { if (!configured) showSettings.value = true; });

const isToday = computed(() => store.selectedDate === getLocalYYYYMMDD(new Date()));
const customFood = ref<{ name: string; cals: number | null; unit: 'kcal' | 'kJ' }>({ name: '', cals: null, unit: 'kcal' });

const addFoodItemHelper = (name: string, cals: number) => {
  const existing = store.activeDay.foods.find(f => f.name === name && (f.mealType || 'uncategorized') === currentMealType.value);
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
    customFood.value.name = ''; customFood.value.cals = null;
  }
};

const saveQuickFood = () => {
  const cals = customFood.value.cals;
  if (customFood.value.name && cals !== null && !isNaN(cals) && cals >= 0) {
    const finalCals = customFood.value.unit === 'kJ' ? (cals / 4.184) : cals;
    store.commonFoods.push({ name: customFood.value.name, cals: finalCals });
    customFood.value.name = ''; customFood.value.cals = null;
  }
};

const saveCombo = (mealType: string) => {
  const foods = store.activeDay.foods.filter(f => (f.mealType || 'uncategorized') === mealType);
  if (foods.length === 0) {
    showToast('❌ 本餐没有食物可以保存！');
    return;
  }
  const comboName = prompt(`请输入组合名称 (将保存 ${foods.length} 种食物):`, mealTypeLabels[mealType as MealType] + " 常用组合");
  if (comboName) {
    store.recipeCombos.push({
      id: Date.now().toString(),
      name: comboName,
      foods: foods.map(f => ({ ...f }))
    });
    showToast(`✅ 套餐【${comboName}】已保存`);
  }
};

const applyCombo = (combo: any) => { // Using any for local bypass but ideally RecipeCombo
  combo.foods.forEach((cf: any) => {
    const existing = store.activeDay.foods.find(f => f.name === cf.name && (f.mealType || 'uncategorized') === currentMealType.value);
    if (existing) {
      existing.multiplier = (existing.multiplier || 1) + (cf.multiplier || 1);
    } else {
      store.activeDay.foods.push({ ...cf, mealType: currentMealType.value });
    }
  });
  showToast(`🍱 已加载套餐【${combo.name}】`);
};

// 默认添加一个空运动结构
const addWorkoutRecord = () => {
  store.activeDay.workouts.push({
    type: 'aerobic', hr: 0, mins: 0, secs: 0, intensity: 'med', kcal: 0
  });
};

const showSaveToast = ref(false);
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showSaveToast.value = true;
  setTimeout(() => showSaveToast.value = false, 2000);
};

const handleSave = () => {
  showToast(`✅ 已安全保存 ${store.selectedDate} 的数据到本地`);
};

const handleCopyMeal = (mealType: string) => {
  store.copyMealToTomorrow(mealType);
  showToast(`🚀 ${mealTypeLabels[mealType as MealType]} 已成功投递至明日`);
};

const groupedFoods = computed(() => {
  const groups: Record<MealType, typeof store.activeDay.foods> = {
    breakfast: [], lunch: [], dinner: [], snack: [], uncategorized: []
  };
  store.activeDay.foods.forEach(f => {
    const type = f.mealType || 'uncategorized';
    if (groups[type]) groups[type].push(f);
  });
  return groups;
});

const handleDelete = () => {
  if (confirm(`⚠️ 危险操作：\n确定要清空 ${store.selectedDate} 这天的所有数据吗？\n此操作不可逆！`)) {
    store.clearDayData();
  }
};

const exportToExcel = () => {
  exportTdeeData(store.database, store.userProfile, store.age);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300 relative">
    
    <transition enter-active-class="transition ease-out duration-300 transform" enter-from-class="-translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showSaveToast" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
        <span>{{ toastMsg }}</span>
      </div>
    </transition>

    <div class="w-full max-w-[1400px]">
      
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-[#1e1e1e] p-4 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <h1 class="text-xl font-bold flex flex-wrap items-center gap-2 mb-4 md:mb-0 text-gray-800 dark:text-white">
          📅 科学 TDEE 管理
          <button @click="showAudit = true" class="text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg transition-colors ml-1 font-bold">📊 报表</button>
          <button @click="showSettings = true" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">⚙️ 设置</button>
          <button @click="toggleDark()" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">
            {{ isDark ? '☀️ 白天' : '🌙 黑夜' }}
          </button>
        </h1>
        <div class="flex items-center gap-3">
          <button @click="store.changeDate(-1)" class="bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c] px-4 py-2 rounded-lg transition-colors">←</button>
          <input type="date" v-model="store.selectedDate" class="bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#444] rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-green-500 font-bold text-center transition-colors">
          <button @click="store.changeDate(1)" :disabled="isToday" :class="['px-4 py-2 rounded-lg transition-colors', isToday ? 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']">→</button>
          <button @click="store.goToToday" v-if="!isToday" class="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 ml-2 font-bold transition-colors">回今日</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start relative">
        
        <!-- 左侧：基础与运动 -->
        <div class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors max-h-[100vh] lg:max-h-[calc(100vh-40px)] overflow-y-auto custom-scrollbar pr-1 pb-4">
          <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none shrink-0 transition-colors">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">⚡ 基础消耗</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">体重 (kg)</label>
                <input type="number" v-model.number="store.activeDay.weight" step="0.1" class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-[16px] p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all">
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">手环步数 (步)</label>
                <input type="number" v-model.number="store.activeDay.steps" min="0" class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-[16px] p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all">
              </div>
            </div>
          </div>

          <!-- 运动记录模块 -->
          <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex-1 flex flex-col transition-colors">
            <div class="flex justify-between items-center mb-4 shrink-0">
              <h2 class="text-lg font-bold text-gray-800 dark:text-white">🏋️ 运动记录</h2>
              <button @click="addWorkoutRecord" class="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-md transition-colors">+ 添加</button>
            </div>
            
            <div class="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <transition-group name="list" tag="div" enter-active-class="transition-all duration-300" leave-active-class="transition-all duration-300 absolute" enter-from-class="opacity-0 -translate-y-4" leave-to-class="opacity-0 scale-95" move-class="transition-transform duration-300">
                <div v-for="(wo, i) in store.activeDay.workouts" :key="i" class="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg border border-gray-200 dark:border-[#333] mb-3 relative transition-all duration-300 w-full overflow-hidden">
                  <button @click="store.activeDay.workouts.splice(i,1)" class="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors z-10 p-1">✕</button>
                
                <div class="flex flex-col gap-3">
                  <!-- 类型选择器 -->
                  <div class="w-full pr-6">
                    <select v-model="wo.type" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-xs font-bold text-gray-800 dark:text-white transition-colors outline-none">
                      <option value="aerobic">🏃 有氧运动 (心率计算)</option>
                      <option value="anaerobic">🏋️ 无氧力量 (METs计算)</option>
                      <option value="manual">⚡ 手动录入 (手环/App直出)</option>
                    </select>
                  </div>

                  <!-- 动态输入区：有氧 -->
                  <div v-if="!wo.type || wo.type === 'aerobic'" class="grid grid-cols-3 gap-3">
                    <div><label class="text-xs text-gray-500 dark:text-gray-400">平均心率</label><input type="number" v-model.number="wo.hr" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                    <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                    <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" min="0" max="59" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                  </div>

                  <!-- 动态输入区：无氧 -->
                  <div v-else-if="wo.type === 'anaerobic'" class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="text-xs text-gray-500 dark:text-gray-400">训练强度</label>
                      <select v-model="wo.intensity" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors">
                        <option value="low">低 (热身/恢复)</option>
                        <option value="med">中 (常规增肌)</option>
                        <option value="high">高 (大重量复合)</option>
                      </select>
                    </div>
                    <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                    <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" min="0" max="59" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                  </div>

                  <!-- 动态输入区：手动 -->
                  <div v-else-if="wo.type === 'manual'" class="w-full">
                    <label class="text-xs text-gray-500 dark:text-gray-400">直接填入手环/App显示的消耗热量 (kcal)</label>
                    <input type="number" v-model.number="wo.kcal" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors">
                  </div>
                </div>
                </div>
              </transition-group>
              <div v-if="store.activeDay.workouts.length === 0" class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">当日无运动记录</div>
            </div>
          </div>
        </div>

        <!-- 中间：饮食 -->
        <div class="bg-white dark:bg-[#1e1e1e] p-4 md:p-5 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col transition-colors max-h-[100vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
          <h2 class="text-lg font-bold mb-3 shrink-0 text-gray-800 dark:text-white">🍽️ 饮食摄入</h2>
          
          <div class="flex gap-1.5 mb-3 bg-gray-100/80 dark:bg-[#2c2c2c] p-1.5 rounded-[16px] shrink-0">
            <button v-for="kind in (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])" :key="kind"
                @click="currentMealType = kind" 
                :class="['flex-1 py-1.5 text-[13px] font-bold rounded-[12px] transition-all', currentMealType === kind ? 'bg-white dark:bg-[#1e1e1e] text-blue-600 dark:text-blue-400 shadow-sm transform scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']">
              {{ mealTypeLabels[kind] }}
            </button>
          </div>

          <!-- 超高密度食物输入栏 -->
          <div class="flex flex-col gap-2.5 mb-3 bg-gray-50/80 dark:bg-[#252525] p-3 rounded-[16px] border border-gray-100 dark:border-[#333] shrink-0 transition-colors">
            <div class="flex gap-2 w-full">
              <input type="text" v-model="customFood.name" placeholder="食物名称" class="flex-1 min-w-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-[12px] p-2 text-sm font-medium text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              <input type="number" v-model.number="customFood.cals" min="0" placeholder="热量" class="w-[72px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-[12px] p-2 text-sm font-semibold text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              <select v-model="customFood.unit" class="w-[68px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#444] rounded-[12px] p-2 text-sm font-medium text-gray-800 dark:text-white transition-colors outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer">
                <option value="kcal">千卡</option>
                <option value="kJ">千焦</option>
              </select>
            </div>
            <div class="flex gap-2 w-full">
              <button @click="addFood" class="bg-blue-600 hover:bg-blue-500 text-white flex-1 py-2 rounded-[12px] text-sm font-bold transition-colors shadow-sm">吃下肚</button>
              <button @click="saveQuickFood" class="bg-purple-600 hover:bg-purple-500 text-white flex-1 py-2 rounded-[12px] text-sm font-bold transition-colors shadow-sm">存快捷</button>
            </div>
          </div>
          
          <!-- 套餐库 -->
          <div v-if="store.recipeCombos.length > 0" class="mb-2 shrink-0">
            <div class="text-[11px] text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
              <span>🍱 我的极速套餐库</span>
            </div>
            <div class="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
              <div v-for="(combo, i) in store.recipeCombos" :key="combo.id" class="flex items-center bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-[12px] overflow-hidden transition-colors hover:shadow-sm">
                <button @click="applyCombo(combo)" class="text-[11px] font-bold px-3 py-1.5 hover:bg-white dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 transition-colors flex items-center gap-1">
                  {{ combo.name }}
                </button>
                <button @click="store.recipeCombos.splice(i,1)" class="px-2 py-1.5 text-purple-400 dark:text-purple-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-[10px] border-l border-purple-200 dark:border-purple-800/50 transition-colors">✕</button>
              </div>
            </div>
          </div>
          
          <div class="mb-3 shrink-0">
            <div class="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
              <div v-for="(f, i) in store.commonFoods" :key="i" class="flex items-center bg-gray-100/80 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-full overflow-hidden transition-colors hover:shadow-sm">
                <button @click="addFoodItemHelper(f.name, f.cals)" class="text-[11px] font-medium px-3 py-1.5 hover:bg-white dark:hover:bg-[#3c3c3c] text-gray-700 dark:text-gray-200 transition-colors">
                  {{ f.name }} <span class="opacity-60 ml-0.5">{{ Math.round(f.cals) }}</span>
                </button>
                <button @click="store.commonFoods.splice(i,1)" class="px-2 py-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-[10px] border-l border-gray-200 dark:border-[#444] transition-colors">✕</button>
              </div>
            </div>
          </div>

          <div class="flex-1 border-t border-gray-200 dark:border-[#333] pt-3 flex flex-col transition-colors">
            <div class="space-y-4 flex-1">
              
              <template v-for="(kind, idx) in (['breakfast', 'lunch', 'dinner', 'snack', 'uncategorized'] as MealType[])" :key="idx">
                <div v-if="groupedFoods[kind].length > 0" class="mb-5">
                  <div class="flex items-center justify-between mb-2.5 px-1">
                    <span class="text-[14px] font-bold tracking-wider text-slate-700 dark:text-slate-200">{{ mealTypeLabels[kind] }}</span>
                    <div class="flex gap-1">
                      <button @click="saveCombo(kind)" class="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1 font-bold">
                        💾 存为套餐
                      </button>
                      <button @click="handleCopyMeal(kind)" class="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1 font-bold">
                        🚀 复制至明日
                      </button>
                    </div>
                  </div>
                  <transition-group name="list" tag="div" enter-active-class="transition-all duration-300" leave-active-class="transition-all duration-300 absolute w-[calc(100%-8px)]" enter-from-class="opacity-0 translate-x-10" leave-to-class="opacity-0 -translate-x-10" move-class="transition-transform duration-300">
                    <div v-for="f in groupedFoods[kind]" :key="f.name" class="flex justify-between items-center bg-white dark:bg-[#252525] p-3 rounded-[16px] border border-slate-100/80 dark:border-[#333] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 mb-2 w-full gap-2">
                      <span class="text-[15px] font-semibold truncate text-slate-800 dark:text-white flex-1 tracking-tight">{{ f.name }}</span>
                      
                      <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#444] rounded-full px-2 py-1 shrink-0">
                        <button @click="() => { if((f.multiplier || 1) > 1) { f.multiplier = (f.multiplier || 1) - 1; } else { store.activeDay.foods.splice(store.activeDay.foods.indexOf(f), 1); } }" class="text-slate-400 hover:bg-white hover:shadow-sm rounded-full hover:text-red-500 w-6 h-6 flex items-center justify-center font-bold transition-all">-</button>
                        <span class="text-[13px] font-bold text-slate-700 dark:text-slate-200 w-5 text-center">{{ f.multiplier || 1 }}</span>
                        <button @click="f.multiplier = (f.multiplier || 1) + 1" class="text-slate-400 hover:bg-white hover:shadow-sm rounded-full hover:text-emerald-500 w-6 h-6 flex items-center justify-center font-bold transition-all">+</button>
                      </div>

                      <div class="flex items-center justify-end min-w-[50px] shrink-0">
                        <div class="flex items-baseline gap-0.5"><span class="text-emerald-600 dark:text-emerald-400 font-extrabold tracking-tight text-[16px]">{{ Math.round(f.cals * (f.multiplier || 1)) }}</span><span class="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">kcal</span></div>
                      </div>
                    </div>
                  </transition-group>
                </div>
              </template>

              <div v-if="store.activeDay.foods.length === 0" class="flex flex-col items-center justify-center py-6">
                <div class="text-gray-400 dark:text-gray-500 text-sm mb-3">当日未记录饮食</div>
                <button @click="store.copyYesterdayDiet" class="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-1">
                  <span class="text-base">🔄</span> 一键复制昨日全天
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：数据大盘及操作按钮 -->
        <div class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors">
          <div class="bg-green-50/50 dark:bg-[#183321] p-5 md:p-6 rounded-[24px] border border-green-100 dark:border-[#1f5030] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col justify-center transition-colors">
            <h2 class="text-xl font-black text-green-700 dark:text-green-400 border-b border-green-200 dark:border-[#1f5030] pb-2 mb-3 transition-colors">当日大盘</h2>
            <div class="space-y-1.5 mb-4 px-1">
              <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300"><span>BMR</span><span class="font-bold text-slate-800 dark:text-slate-100">{{ store.bmr.toFixed(0) }} <span class="text-[10px] text-slate-400 font-normal">kcal</span></span></div>
              <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300"><span>NEAT (步数)</span><span class="font-bold text-slate-800 dark:text-slate-100">{{ store.stepCalories.toFixed(0) }} <span class="text-[10px] text-slate-400 font-normal">kcal</span></span></div>
              <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300"><span>EAT (运动)</span><span class="font-bold text-emerald-600 dark:text-emerald-400">+ {{ store.workoutCalories.toFixed(0) }} <span class="text-[10px] text-emerald-600/60 font-normal">kcal</span></span></div>
              <div class="flex justify-between font-black text-base mt-2 pt-2 border-t border-emerald-200/50 dark:border-[#1f5030] transition-colors items-center">
                <span class="text-slate-800 dark:text-white">TDEE</span><span class="text-emerald-600 dark:text-emerald-400 text-lg">{{ store.tdee.toFixed(0) }} <span class="text-xs text-emerald-600/60 font-medium">kcal</span></span>
              </div>
            </div>

            <!-- TDEE Progress Bar -->
            <div class="mb-4 py-2 border-y border-green-200/50 dark:border-[#1f5030]/50">
              <div class="flex justify-between font-bold text-xs mb-1.5 transition-colors">
                <span class="text-gray-800 dark:text-gray-300">总摄入</span>
                <span :class="store.totalConsumed > store.tdee ? 'text-red-500 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'">{{ store.totalConsumed.toFixed(0) }} <span class="text-[10px] font-normal">/ {{ store.tdee.toFixed(0) }} kcal</span></span>
              </div>
              <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div 
                  class="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end"
                  :class="store.totalConsumed > store.tdee ? 'bg-gradient-to-r from-red-400 to-red-600' : (store.totalConsumed > store.tdee * 0.8 ? 'bg-gradient-to-r from-orange-300 to-orange-500' : 'bg-gradient-to-r from-green-300 to-green-500')"
                  :style="{ width: `${Math.min(100, (store.totalConsumed / Math.max(1, store.tdee)) * 100)}%` }"
                >
                </div>
              </div>
              <div v-if="store.totalConsumed > store.tdee" class="text-right text-[10px] text-red-500 mt-1 font-bold animate-pulse">
                已超出 {{ (store.totalConsumed - store.tdee).toFixed(0) }} kcal!
              </div>
            </div>
            <div class="bg-white dark:bg-[#121212] p-3 rounded-xl border border-green-100 dark:border-[#333] shadow-sm text-center mt-2 transition-colors">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">当日热量缺口</div>
              <div :class="['text-4xl font-black mb-2 transition-colors', store.dailyDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
                {{ store.dailyDeficit > 0 ? '-' : '+' }}{{ Math.abs(store.dailyDeficit).toFixed(0) }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300">等价于 {{ store.dailyDeficit > 0 ? '消耗' : '囤积' }} <span :class="store.dailyDeficit > 0 ? 'text-blue-500 dark:text-blue-300' : 'text-red-500 dark:text-red-400'" class="font-bold">{{ (Math.abs(store.dailyDeficit) / 7.7).toFixed(1) }}g</span> 脂肪</div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#1e1e1e] p-5 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none shrink-0 flex flex-col gap-3 transition-colors">
            <div class="flex gap-3">
              <button @click="handleSave" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1">
                💾 保存当日
              </button>
              <button @click="handleDelete" class="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1">
                🗑️ 清空重置
              </button>
            </div>
            <button @click="exportToExcel" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
              📊 导出全部历史记录为 Excel
            </button>
          </div>
        </div>

      </div>
    </div>
    
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
    <DataVisModal v-if="showAudit" @close="showAudit = false" />
  </div>
</template>
