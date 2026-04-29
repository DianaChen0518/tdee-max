<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDailyStore } from '../store/useDailyStore';
import { useProfileStore } from '../store/useProfileStore';
import { ReportingService } from '../services/ReportingService';
import { useI18n } from 'vue-i18n';
import { HapticUtils } from '../utils/HapticUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const dailyStore = useDailyStore();
const profileStore = useProfileStore();
const emit = defineEmits(['close']);
const { t } = useI18n();

const timeRange = ref<'7' | '30' | 'all'>('7');

// 获取标准化处理后的所有记录
const rawRecords = computed(() => {
  return ReportingService.getProcessingRecords(dailyStore.database, profileStore.userProfile);
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
    legend: { display: false }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } },
    y: {
      grid: { color: 'rgba(150, 150, 150, 0.05)', borderDash: [5, 5] },
      ticks: { color: '#888', font: { size: 10 } }
    }
  }
}));

// 体重走势数据
const weightChartData = computed(() => {
  const labels = chartRecords.value.map(r => r.date.slice(5));
  const data = chartRecords.value.map(r => r.weight);
  return {
    labels,
    datasets: [
      {
        label: t('datavis.charts.weightLabel'),
        data,
        borderColor: '#3b82f6', // blue-500
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4, // 平滑曲线
        fill: true,
        pointRadius: chartRecords.value.length > 30 ? 0 : 4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2
      }
    ]
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
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: false,
        categoryPercentage: 0.8,
        barPercentage: 0.9
      },
      {
        label: t('datavis.charts.tdeeLabel'),
        data: chartRecords.value.map(r => r.tdee),
        backgroundColor: '#10b981', // emerald-500
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: false,
        categoryPercentage: 0.8,
        barPercentage: 0.9
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
  <div
    class="fixed inset-0 bg-black/60 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-md p-4"
    @click.self="
      HapticUtils.lightTick();
      emit('close');
    "
  >
    <div
      class="bg-gray-50 dark:bg-[#121212] p-6 rounded-card border border-gray-100 dark:border-[#333] w-full max-w-5xl shadow-premium transition-all flex flex-col h-[95vh] md:h-[90vh]"
    >
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-4">
        <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
          📊 {{ t('datavis.title') }}
        </h2>
        <div class="flex bg-gray-200/60 dark:bg-[#252525] p-1 rounded-full relative">
          <button
            @click="setRange('7')"
            :class="[
              'px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10',
              timeRange === '7'
                ? 'bg-white dark:bg-[#444] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            {{ t('datavis.ranges.7') }}
          </button>
          <button
            @click="setRange('30')"
            :class="[
              'px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10',
              timeRange === '30'
                ? 'bg-white dark:bg-[#444] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            {{ t('datavis.ranges.30') }}
          </button>
          <button
            @click="setRange('all')"
            :class="[
              'px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10',
              timeRange === 'all'
                ? 'bg-white dark:bg-[#444] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            {{ t('datavis.ranges.all') }}
          </button>
        </div>
        <button
          @click="
            HapticUtils.lightTick();
            emit('close');
          "
          class="text-gray-500 hover:text-red-500 transition-colors bg-white shadow-sm dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#333] px-5 py-2 rounded-btn font-bold text-sm"
        >
          {{ t('datavis.close') }}
        </button>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 shrink-0">
        <div
          class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card shadow-sm dark:shadow-none border border-transparent dark:border-[#333] transition-colors relative overflow-hidden flex flex-col items-center justify-center"
        >
          <div
            class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-black flex items-center gap-1"
          >
            <span class="text-blue-500 text-sm">🧊</span> {{ t('datavis.stats.totalDeficit') }}
          </div>
          <div
            :class="[
              'text-4xl font-black tracking-tighter',
              summaryStats.totalDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'
            ]"
          >
            {{ summaryStats.totalDeficit > 0 ? '-' : '+' }}{{ Math.abs(summaryStats.totalDeficit).toFixed(0) }}
            <span class="text-sm font-bold opacity-50 tracking-normal ml-0.5">kcal</span>
          </div>
        </div>

        <div
          class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card shadow-sm dark:shadow-none border border-transparent dark:border-[#333] transition-colors relative overflow-hidden flex flex-col items-center justify-center"
        >
          <div
            class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-black flex items-center gap-1"
          >
            <span class="text-emerald-500 text-sm">✨</span> {{ t('datavis.stats.fatChange') }}
          </div>
          <div
            :class="[
              'text-4xl font-black tracking-tighter',
              summaryStats.totalDeficit > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            ]"
          >
            <span class="text-xs font-bold mr-1 opacity-80 tracking-normal">{{
              summaryStats.totalDeficit > 0 ? t('datavis.stats.fatLost') : t('datavis.stats.fatGained')
            }}</span>
            {{ Math.abs(summaryStats.theoreticalFatChangeGrams).toFixed(1) }}
            <span class="text-sm font-bold opacity-50 tracking-normal ml-0.5">g</span>
          </div>
        </div>

        <div
          class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card shadow-sm dark:shadow-none border border-transparent dark:border-[#333] transition-colors relative overflow-hidden flex flex-col items-center justify-center"
        >
          <div
            class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-black flex items-center gap-1"
          >
            <span class="text-orange-500 text-sm">🍔</span> {{ t('datavis.stats.avgIntake') }}
          </div>
          <div class="text-4xl font-black tracking-tighter text-gray-800 dark:text-gray-100">
            {{ summaryStats.avgIntake.toFixed(0) }}
            <span class="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-normal ml-0.5">kcal</span>
          </div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
        <div v-if="chartRecords.length === 0" class="text-center py-20 text-gray-400 font-bold italic">
          {{ t('datavis.empty') }}
        </div>

        <template v-else>
          <!-- Weight Trend Chart -->
          <div
            class="bg-white dark:bg-[#1e1e1e] p-5 md:p-6 rounded-card border border-transparent dark:border-[#333] transition-colors relative min-h-[300px] shadow-sm"
          >
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                📉 {{ t('datavis.charts.weightTrend') }}
              </h3>
            </div>
            <div class="h-64 relative w-full">
              <Line :data="weightChartData" :options="{ ...commonOptions, layout: { padding: 0 } }" />
            </div>
          </div>

          <!-- Energy Bar Chart -->
          <div
            class="bg-white dark:bg-[#1e1e1e] p-5 md:p-6 rounded-card border border-transparent dark:border-[#333] transition-colors relative min-h-[300px] shadow-sm"
          >
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                🔥 {{ t('datavis.charts.energyAgainst') }}
              </h3>
              <div class="flex gap-4 text-[10px] font-bold">
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span class="text-gray-500">{{ t('datavis.charts.intakeLabel') }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span class="text-gray-500">{{ t('datavis.charts.tdeeLabel') }}</span>
                </div>
              </div>
            </div>
            <div class="h-64 relative w-full">
              <Bar :data="energyChartData" :options="{ ...commonOptions, layout: { padding: 0 } }" />
            </div>
          </div>

          <!-- Detailed List vertical -->
          <div class="mt-4 pb-4">
            <h3 class="text-sm font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              📝 {{ t('datavis.details') }}
            </h3>
            <div class="flex flex-col gap-3">
              <div
                v-for="r in chartRecords.slice(-7).reverse()"
                :key="r.date"
                class="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-transparent dark:border-[#333] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-default group"
              >
                <!-- Left: Date -->
                <div class="flex items-center gap-4 min-w-[120px]">
                  <div
                    class="w-1.5 h-10 rounded-full transition-colors"
                    :class="
                      r.deficit > 0
                        ? 'bg-emerald-500/20 group-hover:bg-emerald-500/80'
                        : 'bg-red-500/20 group-hover:bg-red-500/80'
                    "
                  ></div>
                  <div class="flex flex-col">
                    <span class="text-gray-800 dark:text-gray-200 font-bold">{{ r.date }}</span>
                    <span class="text-[10px] text-gray-400 font-bold tracking-tight">{{
                      r.deficit > 0 ? '缺口形成' : '超出预算'
                    }}</span>
                  </div>
                </div>

                <!-- Middle: Weight -->
                <div class="flex flex-col items-center flex-1">
                  <div class="text-[10px] text-gray-400 font-bold mb-0.5 tracking-tight">体重</div>
                  <div class="font-black text-gray-800 dark:text-gray-300">
                    {{ r.weight > 0 ? r.weight : '--' }} <span class="text-[10px] font-bold opacity-50">kg</span>
                  </div>
                </div>

                <!-- Right: Deficit -->
                <div class="flex flex-col items-end min-w-[100px]">
                  <div class="text-[10px] text-gray-400 font-bold mb-0.5 tracking-tight">当日缺口</div>
                  <div
                    :class="[
                      'font-black',
                      r.deficit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                    ]"
                  >
                    {{ r.deficit > 0 ? '-' : '+' }}{{ Math.abs(r.deficit).toFixed(0) }}
                    <span class="text-[10px] font-bold opacity-50">kcal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
