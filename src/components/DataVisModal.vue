<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';
import { calculateDailySummary } from '../utils/formulas';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const store = useTdeeStore();
const emit = defineEmits(['close']);

const timeRange = ref<'7' | '30' | 'all'>('7');

// 过滤和排序数据
const rawRecords = computed(() => {
  const records = [];
  for (const [date, data] of Object.entries(store.database)) {
    // 只有真正在记账的日子才算进去
    if (data.weight > 0 || data.steps > 0 || data.foods.length > 0 || data.workouts.length > 0) {
      const summary = calculateDailySummary(data, store.userProfile, store.age);
      records.push({ date, weight: data.weight, tdee: summary.tdee, intake: summary.intake, deficit: summary.deficit });
    }
  }
  // 按日期正序排列（图表从左到右依次为旧到新）
  return records.sort((a, b) => a.date.localeCompare(b.date));
});

const chartRecords = computed(() => {
  const data = rawRecords.value;
  if (timeRange.value === '7') return data.slice(-7);
  if (timeRange.value === '30') return data.slice(-30);
  return data;
});

// 图标通用选项
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { labels: { color: '#888' } }
  },
  scales: {
    x: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { color: '#888' } },
    y: { grid: { color: 'rgba(150, 150, 150, 0.1)' }, ticks: { color: '#888' } }
  }
};

// 体重走势数据
const weightChartData = computed(() => {
  const labels = chartRecords.value.map(r => r.date.slice(5));
  const data = chartRecords.value.map(r => r.weight);
  return {
    labels,
    datasets: [{
      label: '体重走势 (kg)',
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
        label: '摄入 (Intake)',
        data: chartRecords.value.map(r => r.intake),
        backgroundColor: '#f97316', // orange-500
        borderRadius: 4
      },
      {
        label: '消耗 (TDEE)',
        data: chartRecords.value.map(r => r.tdee),
        backgroundColor: '#22c55e', // green-500
        borderRadius: 4
      }
    ]
  };
});

// 统计大盘
const summaryStats = computed(() => {
  const totalDeficit = chartRecords.value.reduce((sum, r) => sum + r.deficit, 0);
  const avgIntake = chartRecords.value.reduce((sum, r) => sum + r.intake, 0) / (chartRecords.value.length || 1);
  return { deficit: totalDeficit, fat: totalDeficit / 7.7, avgIntake };
});

const setRange = (val: '7' | '30' | 'all') => { timeRange.value = val; };
</script>

<template>
  <div class="fixed inset-0 bg-black/60 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-md" @click.self="emit('close')">
    <div class="bg-white dark:bg-[#121212] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-[#333] w-full max-w-5xl shadow-2xl transition-colors flex flex-col h-[95vh] md:h-[90vh]">
      
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-4">
        <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          📊 动态数据观测站
        </h2>
        <div class="flex gap-2 items-center bg-gray-100 dark:bg-[#252525] p-1 rounded-lg">
          <button @click="setRange('7')" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-colors', timeRange === '7' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500']">近 7 天</button>
          <button @click="setRange('30')" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-colors', timeRange === '30' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500']">近 30 天</button>
          <button @click="setRange('all')" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-colors', timeRange === 'all' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500']">全部</button>
        </div>
        <button @click="emit('close')" class="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg font-bold">关闭 面板</button>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-3 gap-3 md:gap-6 mb-6 shrink-0">
        <div class="bg-blue-50 dark:bg-[#0f172a] p-3 md:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center transition-colors">
          <div class="text-xs text-blue-600 dark:text-blue-400 mb-1 font-bold">区间累计热量缺口</div>
          <div :class="['text-2xl md:text-3xl font-black', summaryStats.deficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
            {{ summaryStats.deficit > 0 ? '-' : '+' }}{{ Math.abs(summaryStats.deficit).toFixed(0) }} <span class="text-sm font-normal">kcal</span>
          </div>
        </div>
        <div class="bg-green-50 dark:bg-[#064e3b]/30 p-3 md:p-5 rounded-2xl border border-green-100 dark:border-green-900/50 text-center transition-colors">
          <div class="text-xs text-green-700 dark:text-green-500 mb-1 font-bold">理论脂肪变动</div>
          <div :class="['text-2xl md:text-3xl font-black', summaryStats.deficit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400']">
            {{ summaryStats.deficit > 0 ? '消耗' : '反弹' }} {{ Math.abs(summaryStats.fat).toFixed(1) }} <span class="text-sm font-normal">g</span>
          </div>
        </div>
        <div class="bg-orange-50 dark:bg-[#431407]/30 p-3 md:p-5 rounded-2xl border border-orange-100 dark:border-orange-900/50 text-center transition-colors">
          <div class="text-xs text-orange-700 dark:text-orange-500 mb-1 font-bold">日均摄入</div>
          <div class="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400">
            {{ summaryStats.avgIntake.toFixed(0) }} <span class="text-sm font-normal">kcal</span>
          </div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
        
        <div v-if="chartRecords.length === 0" class="text-center py-20 text-gray-400">暂无数据记录</div>
        
        <template v-else>
          <!-- Weight Trend Chart -->
          <div class="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-gray-200 dark:border-[#333] transition-colors relative min-h-[250px] shadow-sm">
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">📉 纯净化体重趋势</h3>
            <div class="h-56 relative w-full">
              <Line :data="weightChartData" :options="{...commonOptions, layout: {padding: 0}}" />
            </div>
          </div>

          <!-- Energy Bar Chart -->
          <div class="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-gray-200 dark:border-[#333] transition-colors relative min-h-[250px] shadow-sm">
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">🔥 热量对抗赛 (消耗 vs 摄入)</h3>
            <div class="h-56 relative w-full">
              <Bar :data="energyChartData" :options="{...commonOptions, layout: {padding: 0}}" />
            </div>
          </div>
          
          <!-- Detailed List fallback -->
          <div class="mt-4">
             <h3 class="text-xs text-gray-500 mb-2">明细参考 (近期 7 条)</h3>
             <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <div v-for="r in chartRecords.slice(-7).reverse()" :key="r.date" class="bg-gray-50 dark:bg-[#252525] p-2 rounded-lg text-[10px] min-w-[120px] shrink-0 border border-gray-200 dark:border-[#444]">
                  <div class="text-gray-500">{{ r.date }}</div>
                  <div class="font-bold my-1 text-gray-800 dark:text-gray-200">{{ Math.abs(r.deficit).toFixed(0) }} kcal {{ r.deficit > 0 ? '🟢' : '🔴' }}</div>
                  <div class="text-gray-400">{{ r.weight }} kg</div>
                </div>
             </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>
