<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';
import { ReportingService } from '../services/ReportingService';
import { useI18n } from 'vue-i18n';

const store = useTdeeStore();
const emit = defineEmits(['close']);
const { t } = useI18n();

// 默认选中当前选定日期所在的月份
const selectedMonth = ref(store.selectedDate.slice(0, 7));

// 获取报表数据
const report = computed(() => {
  return ReportingService.getMonthlyReport(store.database, store.userProfile, selectedMonth.value);
});

const monthlyRecords = computed(() => report.value.records);
const monthlySummary = computed(() => report.value.stats);
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card border border-gray-100 dark:border-[#333] w-full max-w-2xl shadow-premium transition-colors flex flex-col max-h-[90vh] scale-in">
      
      <!-- Header & Month Picker -->
      <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-4">
        <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          📊 {{ t('monthly.title') }}
        </h2>
        <div class="flex gap-2 items-center">
          <input type="month" v-model="selectedMonth" class="bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-btn px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-blue-500 font-bold transition-all cursor-pointer">
          <button @click="emit('close')" class="text-gray-500 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-btn font-bold text-sm">
            {{ t('monthly.close') }}
          </button>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 shrink-0">
        <div class="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-inner border border-blue-100 dark:border-blue-900/30 text-center transition-colors shadow-sm">
          <div class="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 font-black">{{ t('monthly.deficit') }}</div>
          <div :class="['text-3xl font-black', monthlySummary.totalDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
            {{ monthlySummary.totalDeficit > 0 ? '-' : '+' }}{{ Math.abs(monthlySummary.totalDeficit).toFixed(0) }} <span class="text-sm font-normal opacity-70">kcal</span>
          </div>
        </div>
        <div class="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-inner border border-green-100 dark:border-green-900/30 text-center transition-colors shadow-sm">
          <div class="text-[10px] uppercase tracking-wider text-green-700 dark:text-green-500 mb-1 font-black">{{ t('monthly.fatChange') }}</div>
          <div :class="['text-3xl font-black', monthlySummary.totalDeficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
            <span class="text-xs font-bold mr-1">{{ monthlySummary.totalDeficit > 0 ? t('monthly.fatLost') : t('monthly.fatGained') }}</span>
            {{ Math.abs(monthlySummary.theoreticalFatChangeGrams).toFixed(1) }} <span class="text-sm font-normal opacity-70">g</span>
          </div>
        </div>
      </div>

      <!-- Detail List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-gray-100 dark:border-[#333] pt-4">
        <h3 class="text-xs font-black text-gray-400 dark:text-gray-500 mb-4 sticky top-0 bg-white dark:bg-[#1e1e1e] pb-2 z-10 uppercase tracking-widest">
          🗓️ {{ t('monthly.details', { count: monthlyRecords.length }) }}
        </h3>
        
        <div v-if="monthlyRecords.length === 0" class="text-center py-20 text-gray-400 dark:text-gray-500 font-bold italic">
          {{ t('monthly.empty') }}
        </div>
        
        <div class="space-y-3">
          <div v-for="day in monthlyRecords" :key="day.date" class="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50/50 dark:bg-[#252525] p-4 rounded-inner border border-gray-100 dark:border-[#333] hover:border-blue-400 dark:hover:border-blue-900/50 transition-all shadow-sm">
            <div class="flex items-center gap-4 mb-3 sm:mb-0">
              <span class="font-black text-lg text-gray-700 dark:text-gray-300 w-12">{{ day.date.slice(5) }}</span>
              <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-white dark:bg-[#1e1e1e] px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                {{ t('monthly.weight') }}: {{ day.weight }} kg
              </span>
            </div>
            
            <div class="flex items-center gap-6 justify-between sm:justify-end">
              <div class="text-[10px] font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 text-right">
                <p>{{ t('monthly.tdee') }}: <span class="text-green-600 dark:text-green-400 ml-1">{{ day.tdee.toFixed(0) }}</span></p>
                <p>{{ t('monthly.intake') }}: <span class="text-orange-500 dark:text-orange-400 ml-1">{{ day.intake.toFixed(0) }}</span></p>
              </div>
              <div :class="['text-2xl font-black w-24 text-right', day.deficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
                {{ day.deficit > 0 ? '-' : '+' }}{{ Math.abs(day.deficit).toFixed(0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
