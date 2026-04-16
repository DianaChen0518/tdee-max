<script setup lang="ts">
import { computed } from 'vue';
import { useTdeeStore, getLocalYYYYMMDD } from '../../store/useTdeeStore';
import { useDark, useToggle } from '@vueuse/core';

const emit = defineEmits(['open-settings', 'open-audit']);

const store = useTdeeStore();
const isDark = useDark();
const toggleDark = useToggle(isDark);

const isToday = computed(() => store.selectedDate === getLocalYYYYMMDD(new Date()));
</script>

<template>
  <header class="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-[#1e1e1e] p-4 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
    <h1 class="text-xl font-bold flex flex-wrap items-center gap-2 mb-4 md:mb-0 text-gray-800 dark:text-white">
      📅 科学 TDEE 管理
      <button @click="emit('open-audit')" class="text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg transition-colors ml-1 font-bold">
        📊 报表
      </button>
      <button @click="emit('open-settings')" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">
        ⚙️ 设置
      </button>
      <button @click="toggleDark()" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">
        {{ isDark ? '☀️ 白天' : '🌙 黑夜' }}
      </button>
    </h1>

    <div class="flex items-center gap-3">
      <button 
        @click="store.changeDate(-1)" 
        class="bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c] px-4 py-2 rounded-lg transition-colors"
      >
        ←
      </button>
      
      <input 
        type="date" 
        v-model="store.selectedDate" 
        class="bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#444] rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-green-500 font-bold text-center transition-colors"
      >
      
      <button 
        @click="store.changeDate(1)" 
        :disabled="isToday" 
        :class="['px-4 py-2 rounded-lg transition-colors', isToday ? 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']"
      >
        →
      </button>
      
      <button 
        @click="store.goToToday" 
        v-if="!isToday" 
        class="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 ml-2 font-bold transition-colors"
      >
        回今日
      </button>
    </div>
  </header>
</template>
