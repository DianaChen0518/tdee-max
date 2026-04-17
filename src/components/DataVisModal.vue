<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';
import { ReportingService } from '../services/ReportingService';
import { useI18n } from 'vue-i18n';
import { HapticUtils } from '../utils/HapticUtils';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const store = useTdeeStore();
const emit = defineEmits(['close']);
const { t } = useI18n();

const timeRange = ref<'7' | '30' | 'all'>('7');

// 获取标准化处理后的所有记录
const rawRecords = computed(() => {
  return ReportingService.getProcessingRecords(store.database, store.userProfile);
});

const chartRecords = computed(() => {
  const data = rawRecords.value;
  if (timeRange.value === '7') return data.slice(-7);
  if (timeRange.value === '30') return data.slice(-30);
  return data;
});

// 图标通用选项
const commonOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { labels: { color: '#888', font: { weight: 'bold' as const } } }
  },
  scales: {
    x: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { color: '#888' } },
    y: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { color: '#888' } }
  }
}));

// 体重走势数据
const weightChartData = computed(() => {
  const labels = chartRecords.value.map(r => r.date.slice(5));
  const data = chartRecords.value.map(r => r.weight);
  return {
    labels,
    datasets: [{
      label: t('datavis.charts.weightLabel'),
      data,
      borderColor: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.4, // 平滑曲线
      fill: true,
      pointRadius: chartRecords.value.length > 30 ? 0 : 3
    }]
  };
});

// 摄入 VS 消耗数据
const energyChartData = computed(() => {
  const labels = chartRecords.value.map(r => r.date.slice(5));
  return {
    labels,
    datasets: [
      {
        label: t('datavis.charts.intakeLabel'),
        data: chartRecords.value.map(r => r.intake),
        backgroundColor: '#f97316', // orange-500
        borderRadius: 4
      },
      {
        label: t('datavis.charts.tdeeLabel'),
        data: chartRecords.value.map(r => r.tdee),
        backgroundColor: '#22c55e', // green-500
        borderRadius: 4
      }
    ]
  };
});

// 统计大盘
const summaryStats = computed(() => {
  return ReportingService.aggregateStats(chartRecords.value);
});

const setRange = (val: '7' | '30' | 'all') => { 
  HapticUtils.lightTick();
  timeRange.value = val; 
};
</script>

<template>
  <div class="fixed inset-0 bg-black/60 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-md p-4" @click.self="HapticUtils.lightTick(); emit('close')">
    <div class="bg-white dark:bg-[#121212] p-6 rounded-card border border-gray-100 dark:border-[#333] w-full max-w-5xl shadow-premium transition-all flex flex-col h-[95vh] md:h-[90vh]">
      
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-4">
        <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          📊 {{ t('datavis.title') }}
        </h2>
        <div class="flex gap-2 items-center bg-gray-100 dark:bg-[#252525] p-1 rounded-btn">
          <button @click="setRange('7')" :class="['px-4 py-1.5 text-xs font-bold rounded-btn transition-all', timeRange === '7' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']">
            {{ t('datavis.ranges.7') }}
          </button>
          <button @click="setRange('30')" :class="['px-4 py-1.5 text-xs font-bold rounded-btn transition-all', timeRange === '30' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']">
            {{ t('datavis.ranges.30') }}
          </button>
          <button @click="setRange('all')" :class="['px-4 py-1.5 text-xs font-bold rounded-btn transition-all', timeRange === 'all' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']">
            {{ t('datavis.ranges.all') }}
          </button>
        </div>
        <button @click="HapticUtils.lightTick(); emit('close')" class="text-gray-500 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-btn font-bold text-sm">
          {{ t('datavis.close') }}
        </button>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 shrink-0">
        <div class="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-inner border border-blue-100 dark:border-blue-900/30 text-center transition-colors shadow-sm">
          <div class="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 font-black">{{ t('datavis.stats.totalDeficit') }}</div>
          <div :class="['text-3xl font-black', summaryStats.totalDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
            {{ summaryStats.totalDeficit > 0 ? '-' : '+' }}{{ Math.abs(summaryStats.totalDeficit).toFixed(0) }} <span class="text-sm font-normal opacity-70">kcal</span>
          </div>
        </div>
        <div class="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-inner border border-green-100 dark:border-green-900/30 text-center transition-colors shadow-sm">
          <div class="text-[10px] uppercase tracking-wider text-green-700 dark:text-green-500 mb-1 font-black">{{ t('datavis.stats.fatChange') }}</div>
          <div :class="['text-3xl font-black', summaryStats.totalDeficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
            <span class="text-xs font-bold mr-1">{{ summaryStats.totalDeficit > 0 ? t('datavis.stats.fatLost') : t('datavis.stats.fatGained') }}</span>
            {{ Math.abs(summaryStats.theoreticalFatChangeGrams).toFixed(1) }} <span class="text-sm font-normal opacity-70">g</span>
          </div>
        </div>
        <div class="bg-orange-50/50 dark:bg-orange-900/10 p-5 rounded-inner border border-orange-100 dark:border-orange-900/30 text-center transition-colors shadow-sm">
          <div class="text-[10px] uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-1 font-black">{{ t('datavis.stats.avgIntake') }}</div>
          <div class="text-3xl font-black text-orange-600 dark:text-orange-400">
            {{ summaryStats.avgIntake.toFixed(0) }} <span class="text-sm font-normal opacity-70">kcal</span>
          </div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
        
        <div v-if="chartRecords.length === 0" class="text-center py-20 text-gray-400 font-bold italic">{{ t('datavis.empty') }}</div>
        
        <template v-else>
          <!-- Weight Trend Chart -->
          <div class="bg-gray-50/30 dark:bg-[#1e1e1e] p-5 rounded-card border border-gray-100 dark:border-[#333] transition-colors relative min-h-[300px] shadow-sm">
            <h3 class="text-xs font-black text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest">{{ t('datavis.charts.weightTrend') }}</h3>
            <div class="h-64 relative w-full">
              <Line :data="weightChartData" :options="{...commonOptions, layout: {padding: 0}}" />
            </div>
          </div>

          <!-- Energy Bar Chart -->
          <div class="bg-gray-50/30 dark:bg-[#1e1e1e] p-5 rounded-card border border-gray-100 dark:border-[#333] transition-colors relative min-h-[300px] shadow-sm">
            <h3 class="text-xs font-black text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest">{{ t('datavis.charts.energyAgainst') }}</h3>
            <div class="h-64 relative w-full">
              <Bar :data="energyChartData" :options="{...commonOptions, layout: {padding: 0}}" />
            </div>
          </div>
          
          <!-- Detailed List fallback -->
          <div class="mt-4 pb-4">
             <h3 class="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{{ t('datavis.details') }}</h3>
             <div class="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                <div v-for="r in chartRecords.slice(-7).reverse()" :key="r.date" class="bg-white dark:bg-[#252525] p-3 rounded-inner text-[10px] min-w-[140px] shrink-0 border border-gray-100 dark:border-[#444] shadow-sm hover:border-blue-400 transition-colors cursor-default">
                  <div class="text-gray-400 font-bold">{{ r.date }}</div>
                  <div class="font-black my-2 text-lg text-gray-800 dark:text-gray-200">
                    {{ Math.abs(r.deficit).toFixed(0) }} <span class="text-[10px] font-normal">kcal</span>
                    <span class="ml-1">{{ r.deficit > 0 ? '🟢' : '🔴' }}</span>
                  </div>
                  <div class="text-gray-500 font-bold tracking-tight">{{ r.weight }} <span class="font-normal opacity-70">kg</span></div>
                </div>
             </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<style scoped>
</style>
