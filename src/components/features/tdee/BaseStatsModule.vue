<script setup lang="ts">
import { useDailyStore } from '../../../store/useDailyStore';
import { useI18n } from 'vue-i18n';

const dailyStore = useDailyStore();
const { t } = useI18n();
</script>

<template>
  <div
    class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none shrink-0 transition-colors"
  >
    <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">⚡ {{ t('dashboard.title') }}</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-tight"
          >{{ t('dashboard.weight') }} (kg)</label
        >
        <input
          type="number"
          v-model.number="dailyStore.activeDay.weight"
          step="0.1"
          class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all font-bold"
        />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-tight">{{
          t('dashboard.steps')
        }}</label>
        <input
          type="number"
          v-model.number="dailyStore.activeDay.steps"
          min="0"
          class="w-full bg-gray-50/50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-3 font-semibold text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all font-bold"
        />
      </div>
    </div>
  </div>
</template>
