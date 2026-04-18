<script setup lang="ts">
import { useDailyStore } from '../../../store/useDailyStore';
import { useI18n } from 'vue-i18n';
import { HapticUtils } from '../../../utils/HapticUtils';

const dailyStore = useDailyStore();
const { t } = useI18n();

const addWorkoutRecord = () => {
  HapticUtils.lightTick();
  dailyStore.addWorkout();
};
</script>

<template>
  <div
    class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none flex-1 flex flex-col transition-colors"
  >
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h2 class="text-lg font-bold text-gray-800 dark:text-white">🏋️ {{ t('workout.title') }}</h2>
      <button
        @click="addWorkoutRecord"
        class="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-btn transition-colors font-bold shadow-sm"
      >
        + {{ t('workout.add') }}
      </button>
    </div>

    <div class="overflow-y-auto custom-scrollbar flex-1 pr-1">
      <transition-group name="list" tag="div">
        <div
          v-for="wo in dailyStore.activeDay.workouts"
          :key="wo.id"
          class="bg-gray-50 dark:bg-[#252525] p-4 rounded-inner border border-gray-200 dark:border-[#333] mb-3 relative transition-all duration-300 w-full overflow-hidden"
        >
          <button
            @click="
              HapticUtils.lightTick();
              dailyStore.removeWorkout(wo.id!);
            "
            class="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors z-10 p-1"
          >
            ✕
          </button>

          <div class="flex flex-col gap-3">
            <!-- Type Selector -->
            <div class="w-full pr-6">
              <select
                v-model="wo.type"
                class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-xs font-bold text-gray-800 dark:text-white transition-colors outline-none cursor-pointer"
              >
                <option value="aerobic">{{ t('workout.types.aerobic') }}</option>
                <option value="anaerobic">{{ t('workout.types.anaerobic') }}</option>
                <option value="manual">{{ t('workout.types.manual') }}</option>
              </select>
            </div>

            <!-- Contextual Inputs: Aerobic -->
            <div v-if="!wo.type || wo.type === 'aerobic'" class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.hr')
                }}</label
                ><input
                  type="number"
                  v-model.number="wo.hr"
                  min="0"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.mins')
                }}</label
                ><input
                  type="number"
                  v-model.number="wo.mins"
                  min="0"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.secs')
                }}</label
                ><input
                  type="number"
                  v-model.number="wo.secs"
                  min="0"
                  max="59"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
                />
              </div>
            </div>

            <!-- Contextual Inputs: Anaerobic -->
            <div v-else-if="wo.type === 'anaerobic'" class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.intensity')
                }}</label>
                <select
                  v-model="wo.intensity"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold cursor-pointer"
                >
                  <option value="low">{{ t('workout.intensities.low') }}</option>
                  <option value="med">{{ t('workout.intensities.med') }}</option>
                  <option value="high">{{ t('workout.intensities.high') }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.mins')
                }}</label
                ><input
                  type="number"
                  v-model.number="wo.mins"
                  min="0"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                  t('workout.labels.secs')
                }}</label
                ><input
                  type="number"
                  v-model.number="wo.secs"
                  min="0"
                  max="59"
                  class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
                />
              </div>
            </div>

            <!-- Contextual Inputs: Manual -->
            <div v-else-if="wo.type === 'manual'" class="w-full">
              <label class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{{
                t('workout.labels.kcal')
              }}</label>
              <input
                type="number"
                v-model.number="wo.kcal"
                min="0"
                class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-btn p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors font-bold"
              />
            </div>
          </div>
        </div>
      </transition-group>
      <div
        v-if="dailyStore.activeDay.workouts.length === 0"
        class="text-gray-400 dark:text-gray-500 text-sm text-center py-4 font-medium italic"
      >
        {{ t('workout.empty') }}
      </div>
    </div>
  </div>
</template>
