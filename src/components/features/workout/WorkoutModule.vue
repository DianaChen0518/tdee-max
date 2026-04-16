<script setup lang="ts">
import { useTdeeStore } from '../../../store/useTdeeStore';

const store = useTdeeStore();

const addWorkoutRecord = () => {
  store.activeDay.workouts.push({
    type: 'aerobic', hr: 0, mins: 0, secs: 0, intensity: 'med', kcal: 0
  });
};
</script>

<template>
  <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-[24px] border border-gray-100 dark:border-[#333] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex-1 flex flex-col transition-colors">
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h2 class="text-lg font-bold text-gray-800 dark:text-white">🏋️ 运动记录</h2>
      <button @click="addWorkoutRecord" class="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-md transition-colors">
        + 添加
      </button>
    </div>
    
    <div class="overflow-y-auto custom-scrollbar flex-1 pr-1">
      <transition-group 
        name="list" 
        tag="div" 
        enter-active-class="transition-all duration-300" 
        leave-active-class="transition-all duration-300 absolute" 
        enter-from-class="opacity-0 -translate-y-4" 
        leave-to-class="opacity-0 scale-95" 
        move-class="transition-transform duration-300"
      >
        <div v-for="(wo, i) in store.activeDay.workouts" :key="i" class="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg border border-gray-200 dark:border-[#333] mb-3 relative transition-all duration-300 w-full overflow-hidden">
          <button @click="store.activeDay.workouts.splice(i,1)" class="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors z-10 p-1">✕</button>
        
          <div class="flex flex-col gap-3">
            <!-- Type Selector -->
            <div class="w-full pr-6">
              <select v-model="wo.type" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-xs font-bold text-gray-800 dark:text-white transition-colors outline-none">
                <option value="aerobic">🏃 有氧运动 (心率计算)</option>
                <option value="anaerobic">🏋️ 无氧力量 (METs计算)</option>
                <option value="manual">⚡ 手动录入 (手环/App直出)</option>
              </select>
            </div>

            <!-- Contextual Inputs: Aerobic -->
            <div v-if="!wo.type || wo.type === 'aerobic'" class="grid grid-cols-3 gap-3">
              <div><label class="text-xs text-gray-500 dark:text-gray-400">平均心率</label><input type="number" v-model.number="wo.hr" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
              <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
              <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" min="0" max="59" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
            </div>

            <!-- Contextual Inputs: Anaerobic -->
            <div v-else-if="wo.type === 'anaerobic'" class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-xs text-gray-500 dark:text-gray-400">训练强度</label>
                <select v-model="wo.intensity" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors">
                  <option value="low">低 (热身/恢复)</option>
                  <option value="med">中 (常规增肌)</option>
                  <option value="high">高 (大重量复合)</option>
                </select>
              </div>
              <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
              <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" min="0" max="59" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
            </div>

            <!-- Contextual Inputs: Manual -->
            <div v-else-if="wo.type === 'manual'" class="w-full">
              <label class="text-xs text-gray-500 dark:text-gray-400">直接填入手环/App显示的消耗热量 (kcal)</label>
              <input type="number" v-model.number="wo.kcal" min="0" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors">
            </div>
          </div>
        </div>
      </transition-group>
      <div v-if="store.activeDay.workouts.length === 0" class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">当日无运动记录</div>
    </div>
  </div>
</template>
