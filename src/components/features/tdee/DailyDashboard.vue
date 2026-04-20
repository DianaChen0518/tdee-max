<script setup lang="ts">
import { useDailyStore } from '../../../store/useDailyStore';
import { useI18n } from 'vue-i18n';
import { HapticUtils } from '../../../utils/HapticUtils';
import { useNotification } from '../../../composables/useNotification';
import { useDialog } from '../../../composables/useDialog';
import { KCAL_PER_GRAM_FAT } from '../../../constants/metabolic';

const dailyStore = useDailyStore();
const { t } = useI18n();
const notify = useNotification();
const dialog = useDialog();

const emit = defineEmits(['sync', 'export']);

const handleDelete = async () => {
  const confirmed = await dialog.confirm({
    title: '⚠️ ' + t('dashboard.reset'),
    message: t('dashboard.confirmReset', { date: dailyStore.selectedDate }),
    confirmText: t('dashboard.reset'),
    danger: true
  });
  if (confirmed) {
    HapticUtils.lightTick();
    dailyStore.clearDayData();
    notify.success(t('notifications.resetSuccess'));
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors">
    <!-- Metabolic Metrics Panel -->
    <div
      class="bg-green-50/50 dark:bg-[#183321] p-5 md:p-6 rounded-card border border-green-100 dark:border-[#1f5030] shadow-premium dark:shadow-none flex flex-col justify-center transition-colors"
    >
      <h2
        class="text-xl font-black text-green-700 dark:text-green-400 border-b border-green-200 dark:border-[#1f5030] pb-2 mb-3"
      >
        {{ t('dashboard.title') }}
      </h2>

      <div class="space-y-1.5 mb-4 px-1">
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{{ t('dashboard.metrics.bmr') }}</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            {{ dailyStore.bmr }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{{ t('dashboard.metrics.neat') }}</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            {{ dailyStore.stepCalories }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{{ t('dashboard.metrics.tef') }}</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">
            + {{ dailyStore.tefCalories }} <span class="text-[10px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{{ t('dashboard.metrics.eat') }}</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">
            + {{ dailyStore.workoutCalories }} <span class="text-[10px] text-emerald-600/60 font-normal">kcal</span>
          </span>
        </div>
        <div class="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <div class="flex items-center gap-1">
            <span>{{ t('dashboard.metrics.epoc') }}</span>
            <span class="text-[9px] text-slate-400 font-normal"> {{ t('dashboard.metrics.errorMargin') }}</span>
          </div>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">
            + {{ dailyStore.epocCalories }} <span class="text-[10px] text-emerald-600/60 font-normal">kcal</span>
          </span>
        </div>
        <div
          class="flex justify-between font-black text-base mt-2 pt-2 border-t border-emerald-200/50 dark:border-[#1f5030] items-center"
        >
          <span class="text-slate-800 dark:text-white">TDEE</span>
          <span class="text-emerald-600 dark:text-emerald-400 text-lg">
            {{ dailyStore.tdee }} <span class="text-xs text-emerald-600/60 font-medium">kcal</span>
          </span>
        </div>
      </div>

      <!-- TDEE Progress Bar -->
      <div class="mb-4 py-2 border-y border-green-200/50 dark:border-[#1f5030]/50">
        <div class="flex justify-between font-bold text-xs mb-1.5">
          <span class="text-gray-800 dark:text-gray-300">{{ t('dashboard.totalIntake') }}</span>
          <span
            :class="
              dailyStore.totalConsumed > dailyStore.tdee
                ? 'text-red-500 dark:text-red-400'
                : 'text-orange-600 dark:text-orange-400'
            "
          >
            {{ dailyStore.totalConsumed }} <span class="text-[10px] font-normal">/ {{ dailyStore.tdee }} kcal</span>
          </span>
        </div>
        <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="
              dailyStore.totalConsumed > dailyStore.tdee
                ? 'bg-gradient-to-r from-red-400 to-red-600'
                : dailyStore.totalConsumed > dailyStore.tdee * 0.8
                  ? 'bg-gradient-to-r from-orange-300 to-orange-500'
                  : 'bg-gradient-to-r from-green-300 to-green-500'
            "
            :style="{ width: `${Math.min(100, (dailyStore.totalConsumed / Math.max(1, dailyStore.tdee)) * 100)}%` }"
          ></div>
        </div>
        <div
          v-if="dailyStore.totalConsumed > dailyStore.tdee"
          class="text-right text-[10px] text-red-500 mt-1 font-bold animate-pulse"
        >
          {{ t('dashboard.overLimit', { val: dailyStore.totalConsumed - dailyStore.tdee }) }}
        </div>
      </div>

      <!-- Deficit Display -->
      <div
        class="bg-white dark:bg-[#121212] p-3 rounded-inner border border-green-100 dark:border-[#333] shadow-sm text-center mt-2"
      >
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ t('dashboard.dailyDeficit') }}</div>
        <div
          :class="[
            'text-4xl font-black mb-2',
            dailyStore.dailyDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'
          ]"
        >
          {{ dailyStore.dailyDeficit > 0 ? '-' : '+' }}{{ Math.abs(dailyStore.dailyDeficit) }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-300">
          {{
            t('dashboard.equivalentTo', {
              action: dailyStore.dailyDeficit > 0 ? t('dashboard.actionConsuming') : t('dashboard.actionStoring'),
              val: (Math.abs(dailyStore.dailyDeficit) / KCAL_PER_GRAM_FAT).toFixed(1)
            })
          }}
        </div>
      </div>
    </div>

    <!-- Persistent Actions -->
    <div
      class="bg-white dark:bg-[#1e1e1e] p-5 rounded-card border border-gray-100 dark:border-[#333] shadow-premium dark:shadow-none shrink-0 flex flex-col gap-3 transition-colors"
    >
      <div class="flex gap-3">
        <button
          @click="
            HapticUtils.lightTick();
            emit('sync');
          "
          class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-btn text-sm font-bold shadow-md transition-colors"
        >
          ☁️ {{ t('dashboard.sync') }}
        </button>
        <button
          @click="handleDelete"
          class="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 py-2.5 rounded-btn text-sm font-bold transition-colors"
        >
          🗑️ {{ t('dashboard.reset') }}
        </button>
      </div>
      <button
        @click="
          HapticUtils.lightTick();
          emit('export');
        "
        class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-btn text-sm font-bold shadow-md transition-colors"
      >
        📊 {{ t('dashboard.export') }}
      </button>
    </div>
  </div>
</template>
