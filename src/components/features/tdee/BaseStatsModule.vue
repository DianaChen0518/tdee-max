<script setup lang="ts">
import { useTdeeStore } from '../../../store/useTdeeStore';

const store = useTdeeStore();
</script>

<template>
  <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none shrink-0 transition-colors">
    <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">⚡ 基础消耗</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">体重 (kg)</label>
        <input 
          type="number" 
          v-model.number="store.activeDay.weight" 
          step="0.1" 
          class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-[16px] p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
        >
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">手环步数 (步)</label>
        <input 
          type="number" 
          v-model.number="store.activeDay.steps" 
          min="0" 
          class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-[16px] p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
        >
      </div>
    </div>
  </div>
</template>
