<script setup lang="ts">
import { useTdeeStore } from '../../../store/useTdeeStore';

const store = useTdeeStore();

const emit = defineEmits(['save', 'reset', 'export']);

const handleDelete = () => {
  if (confirm(`⚠️ 危险操作：\n确定要清空 ${store.selectedDate} 这天的所有数据吗？\n此操作不可逆！`)) {
    store.clearDayData();
    emit('reset');
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors">
    <!-- Metabolic Metrics Panel -->
    <div class="bg-green-50/50 dark:bg-[#183321] p-5 md:p-6 rounded-[24px] border border-green-100 dark:border-[#1f5030] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col justify-center transition-colors">
      <h2 class="text-xl font-black text-green-700 dark:text-green-400 border-b border-green-200 dark:border-[#1f5030] pb-2 mb-3">
        当日大盘
      </h2>
      
      <div class="space-y-1.5 mb-4 px-1">
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>BMR</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            {{ store.bmr }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>NEAT (步数)</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            {{ store.stepCalories }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>TEF (食物热效应)</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            + {{ store.tefCalories }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>EAT (运动)</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">
            + {{ store.workoutCalories }} <span class="text-[10px] text-emerald-600/60 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <div class="flex items-center gap-1">
            <span>EPOC (后燃效应)</span>
            <span class="text-[9px] text-slate-400 font-normal"> (±20%~25% 误差)</span>
          </div>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">
            + {{ store.epocCalories }} <span class="text-[10px] text-emerald-600/60 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between font-black text-base mt-2 pt-2 border-t border-emerald-200/50 dark:border-[#1f5030] items-center">
          <span class="text-slate-800 dark:text-white">TDEE</span>
          <span class="text-emerald-600 dark:text-emerald-400 text-lg">
            {{ store.tdee }} <span class="text-xs text-emerald-600/60 font-medium">kcal</span>
          </span>
        </div>
      </div>

      <!-- TDEE Progress Bar -->
      <div class="mb-4 py-2 border-y border-green-200/50 dark:border-[#1f5030]/50">
        <div class="flex justify-between font-bold text-xs mb-1.5">
          <span class="text-gray-800 dark:text-gray-300">总摄入</span>
          <span :class="store.totalConsumed > store.tdee ? 'text-red-500 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'">
            {{ store.totalConsumed }} <span class="text-[10px] font-normal">/ {{ store.tdee }} kcal</span>
          </span>
        </div>
        <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div 
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="store.totalConsumed > store.tdee ? 'bg-gradient-to-r from-red-400 to-red-600' : (store.totalConsumed > store.tdee * 0.8 ? 'bg-gradient-to-r from-orange-300 to-orange-500' : 'bg-gradient-to-r from-green-300 to-green-500')"
            :style="{ width: `${Math.min(100, (store.totalConsumed / Math.max(1, store.tdee)) * 100)}%` }"
          ></div>
        </div>
        <div v-if="store.totalConsumed > store.tdee" class="text-right text-[10px] text-red-500 mt-1 font-bold animate-pulse">
          已超出 {{ store.totalConsumed - store.tdee }} kcal!
        </div>
      </div>

      <!-- Deficit Display -->
      <div class="bg-white dark:bg-[#121212] p-3 rounded-xl border border-green-100 dark:border-[#333] shadow-sm text-center mt-2">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">当日热量缺口</div>
        <div :class="['text-4xl font-black mb-2', store.dailyDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
          {{ store.dailyDeficit > 0 ? '-' : '+' }}{{ Math.abs(store.dailyDeficit) }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-300">
          等价于 {{ store.dailyDeficit > 0 ? '消耗' : '囤积' }} 
          <span :class="store.dailyDeficit > 0 ? 'text-blue-500 dark:text-blue-300' : 'text-red-500 dark:text-red-400'" class="font-bold">
            {{ (Math.abs(store.dailyDeficit) / 7.7).toFixed(1) }}g
          </span> 脂肪
        </div>
      </div>
    </div>

    <!-- Persistent Actions -->
    <div class="bg-white dark:bg-[#1e1e1e] p-5 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none shrink-0 flex flex-col gap-3">
      <div class="flex gap-3">
        <button @click="emit('save')" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors">
          💾 保存当日
        </button>
        <button @click="handleDelete" class="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 py-2.5 rounded-lg text-sm font-bold transition-colors">
          🗑️ 清空重置
        </button>
      </div>
      <button @click="emit('export')" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold shadow-md transition-colors">
        📊 导出全部历史记录为 Excel
      </button>
    </div>
  </div>
</template>
