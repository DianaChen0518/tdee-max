<script setup lang="ts">
import { computed } from 'vue';
import { useTdeeStore } from '../../store/useTdeeStore';
import { useDark, useToggle } from '@vueuse/core';
import { DateUtils } from '../../utils/DateUtils';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['open-settings', 'open-datavis', 'open-monthly']);

const store = useTdeeStore();
const { t, locale } = useI18n();
const isDark = useDark();
const toggleDark = useToggle(isDark);

const toggleLang = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  localStorage.setItem('user-lang', locale.value);
};

const isToday = computed(() => store.selectedDate === DateUtils.getLocalYYYYMMDD());
</script>

<template>
  <header class="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-[#1e1e1e] p-4 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none transition-colors">
    <h1 class="text-xl font-bold flex flex-wrap items-center gap-2 mb-4 md:mb-0 text-gray-800 dark:text-white">
      📅 {{ t('header.title') }}
      <div class="flex flex-wrap gap-1 ml-1 items-center">
        <button @click="emit('open-datavis')" class="text-[10px] bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-btn transition-colors font-black hover:scale-105 transform uppercase tracking-tighter">
          📊 {{ t('header.datavis') }}
        </button>
        <button @click="emit('open-monthly')" class="text-[10px] bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-btn transition-colors font-black hover:scale-105 transform uppercase tracking-tighter">
          📋 {{ t('header.monthly') }}
        </button>
        <button @click="emit('open-settings')" class="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-btn transition-colors opacity-80 hover:opacity-100 font-black uppercase tracking-tighter">
          ⚙️ {{ t('header.settings') }}
        </button>
      </div>
      <button @click="toggleLang()" class="text-sm bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-btn transition-colors font-bold">
        {{ locale === 'zh-CN' ? '🇨🇳 ZH' : '🇺🇸 EN' }}
      </button>
      <button @click="toggleDark()" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-btn transition-colors">
        {{ isDark ? '☀️ ' + t('header.light') : '🌙 ' + t('header.dark') }}
      </button>
    </h1>

    <div class="flex items-center gap-3">
      <button 
        @click="store.changeDate(-1)" 
        class="bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c] px-4 py-2 rounded-btn transition-colors"
      >
        ←
      </button>
      
      <input 
        type="date" 
        v-model="store.selectedDate" 
        class="bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#444] rounded-btn px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-green-500 font-bold text-center transition-colors"
      >
      
      <button 
        @click="store.changeDate(1)" 
        :disabled="isToday" 
        :class="['px-4 py-2 rounded-btn transition-colors', isToday ? 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']"
      >
        →
      </button>
      
      <button 
        @click="store.goToToday" 
        v-if="!isToday" 
        class="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 ml-2 font-bold transition-colors"
      >
        {{ t('header.backToToday') }}
      </button>
    </div>
  </header>
</template>
