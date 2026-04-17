<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';
import { ReportingService } from '../services/ReportingService';

const store = useTdeeStore();
const emit = defineEmits(['close']);

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
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] w-full max-w-2xl shadow-2xl transition-colors flex flex-col max-h-[90vh]">
      
      <!-- 头部与月份选择 -->
      <div class="flex justify-between items-center mb-6 shrink-0">
        <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          📊 月度审计报告
        </h2>
        <div class="flex gap-3 items-center">
          <input type="month" v-model="selectedMonth" class="bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg px-3 py-2 text-gray-800 dark:text-white outline-none focus:border-blue-500 font-bold transition-colors">
          <button @click="emit('close')" class="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">关闭</button>
        </div>
      </div>
      
      <!-- 当月数据总结卡片 -->
      <div class="grid grid-cols-2 gap-4 mb-6 shrink-0">
        <div class="bg-blue-50 dark:bg-[#0f172a] p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center transition-colors">
          <div class="text-xs text-blue-600 dark:text-blue-400 mb-1 font-bold">本月累计热量缺口</div>
          <div :class="['text-3xl font-black', monthlySummary.totalDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
            {{ monthlySummary.totalDeficit > 0 ? '-' : '+' }}{{ Math.abs(monthlySummary.totalDeficit).toFixed(0) }} <span class="text-sm font-normal">kcal</span>
          </div>
        </div>
        <div class="bg-green-50 dark:bg-[#064e3b]/30 p-4 rounded-xl border border-green-100 dark:border-green-900/50 text-center transition-colors">
          <div class="text-xs text-green-700 dark:text-green-500 mb-1 font-bold">本月理论脂肪变动</div>
          <div :class="['text-3xl font-black', monthlySummary.totalDeficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
            {{ monthlySummary.totalDeficit > 0 ? '消耗' : '囤积' }} {{ Math.abs(monthlySummary.theoreticalFatChangeGrams).toFixed(1) }} <span class="text-sm font-normal">g</span>
          </div>
        </div>
      </div>

      <!-- 每日数据明细列表 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-gray-200 dark:border-[#333] pt-4">
        <h3 class="text-sm text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-white dark:bg-[#1e1e1e] pb-2 z-10">🗓️ 每日明细 (共 {{ monthlyRecords.length }} 天记录)</h3>
        
        <div v-if="monthlyRecords.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500">
          该月份暂无任何记录
        </div>
        
        <div class="space-y-2">
          <div v-for="day in monthlyRecords" :key="day.date" class="flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-[#252525] p-3 rounded-xl border border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
            <div class="flex items-center gap-4 mb-2 sm:mb-0 w-full sm:w-auto">
              <span class="font-bold text-gray-700 dark:text-gray-300">{{ day.date.slice(5) }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-[#1e1e1e] px-2 py-1 rounded">体重: {{ day.weight }} kg</span>
            </div>
            
            <div class="flex items-center gap-4 text-xs w-full sm:w-auto justify-between sm:justify-end">
              <div class="text-gray-500 dark:text-gray-400 text-right">
                <p>消耗: <span class="text-green-600 dark:text-green-400 font-bold">{{ day.tdee.toFixed(0) }}</span></p>
                <p>摄入: <span class="text-orange-500 dark:text-orange-400 font-bold">{{ day.intake.toFixed(0) }}</span></p>
              </div>
              <div :class="['text-xl w-24 text-right font-black', day.deficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
                {{ day.deficit > 0 ? '-' : '+' }}{{ Math.abs(day.deficit).toFixed(0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
