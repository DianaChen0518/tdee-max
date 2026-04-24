<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useDailyStore } from '../../../store/useDailyStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { useI18n } from 'vue-i18n';

const dailyStore = useDailyStore();
const profileStore = useProfileStore();
const { t } = useI18n();

const isEditingWeight = ref(false);
const isEditingSteps = ref(false);
const weightInput = ref<HTMLInputElement | null>(null);
const stepsInput = ref<HTMLInputElement | null>(null);

const editWeight = async () => {
  isEditingWeight.value = true;
  await nextTick();
  weightInput.value?.focus();
};

const editSteps = async () => {
  isEditingSteps.value = true;
  await nextTick();
  stepsInput.value?.focus();
};

const previousWeight = computed(() => {
  const dates = Object.keys(dailyStore.database).sort();
  const currentIndex = dates.indexOf(dailyStore.selectedDate);
  if (currentIndex > 0) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const w = dailyStore.database[dates[i]].weight;
      if (w > 0) return w;
    }
  }
  return null;
});

const weightDiff = computed(() => {
  if (previousWeight.value === null || dailyStore.activeDay.weight === 0) return null;
  return (dailyStore.activeDay.weight - previousWeight.value).toFixed(2);
});

const stepProgress = computed(() => {
  const goal = profileStore.userProfile.stepGoal || 6000;
  return Math.min(100, Math.round((dailyStore.activeDay.steps / goal) * 100));
});
</script>

<template>
  <div
    class="bg-white dark:bg-[#1e1e1e] p-5 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none shrink-0 transition-colors"
  >
    <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
      ⚡ {{ t('dashboard.title') }}
    </h2>
    <div class="grid grid-cols-2 gap-4">
      <!-- Weight Card -->
      <div
        class="bg-gray-50 dark:bg-[#2c2c2c] rounded-inner p-4 border border-gray-200 dark:border-[#444] transition-all relative group cursor-pointer hover:border-green-500/50 flex flex-col justify-between min-h-[100px]"
        @click="!isEditingWeight && editWeight()"
      >
        <div>
          <div class="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">
            {{ t('dashboard.weight') }} (KG)
          </div>
          <div v-if="!isEditingWeight" class="text-2xl font-bold text-gray-800 dark:text-white leading-none">
            {{ dailyStore.activeDay.weight > 0 ? dailyStore.activeDay.weight : '--' }}
          </div>
          <div v-else>
            <input
              ref="weightInput"
              type="number"
              v-model.number="dailyStore.activeDay.weight"
              step="0.1"
              @blur="isEditingWeight = false"
              @keyup.enter="isEditingWeight = false"
              class="w-full bg-transparent border-none text-2xl font-bold text-gray-800 dark:text-white outline-none p-0 focus:ring-0 leading-none h-[24px]"
            />
          </div>
        </div>
        <div
          v-if="weightDiff !== null"
          class="mt-3 text-[11px] font-bold"
          :class="Number(weightDiff) <= 0 ? 'text-green-500' : 'text-red-500'"
        >
          较上次 {{ Number(weightDiff) > 0 ? '+' : '' }}{{ weightDiff }}
        </div>
      </div>

      <!-- Steps Card -->
      <div
        class="bg-gray-50 dark:bg-[#2c2c2c] rounded-inner p-4 border border-gray-200 dark:border-[#444] transition-all relative group cursor-pointer hover:border-green-500/50 flex flex-col justify-between min-h-[100px]"
        @click="!isEditingSteps && editSteps()"
      >
        <div>
          <div class="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">
            {{ t('dashboard.steps') }}
          </div>
          <div v-if="!isEditingSteps" class="text-2xl font-bold text-gray-800 dark:text-white leading-none">
            {{ dailyStore.activeDay.steps }}
          </div>
          <div v-else>
            <input
              ref="stepsInput"
              type="number"
              v-model.number="dailyStore.activeDay.steps"
              min="0"
              @blur="isEditingSteps = false"
              @keyup.enter="isEditingSteps = false"
              class="w-full bg-transparent border-none text-2xl font-bold text-gray-800 dark:text-white outline-none p-0 focus:ring-0 leading-none h-[24px]"
            />
          </div>
        </div>

        <div v-if="profileStore.userProfile.enableStepGoal" class="mt-3">
          <div class="flex justify-between items-end text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
            <span>目标 {{ profileStore.userProfile.stepGoal || 6000 }}</span>
            <span class="text-green-500">{{ stepProgress }}%</span>
          </div>
          <div class="w-full h-[5px] bg-gray-200 dark:bg-[#1e1e1e] rounded-full overflow-hidden">
            <div
              class="h-full bg-green-500 transition-all duration-500 ease-out"
              :style="{ width: stepProgress + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
