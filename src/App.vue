<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useProfileStore } from './store/useProfileStore';
import { useDailyStore } from './store/useDailyStore';
import { useCloudStore } from './store/useCloudStore';
import { useDietStore } from './store/useDietStore';
import { exportTdeeData } from './utils/export';
import { useNotification } from './composables/useNotification';
import { useI18n } from 'vue-i18n';

// Extracted Components
import AppHeader from './components/layout/AppHeader.vue';
import DailyDashboard from './components/features/tdee/DailyDashboard.vue';
import BaseStatsModule from './components/features/tdee/BaseStatsModule.vue';
import WorkoutModule from './components/features/workout/WorkoutModule.vue';
import DietModule from './components/features/diet/DietModule.vue';
import AppNotification from './components/layout/AppNotification.vue';
import AppDialog from './components/AppDialog.vue';

// Existing Modals
import SettingsModal from './components/SettingsModal.vue';
import DataVisModal from './components/DataVisModal.vue';

const profileStore = useProfileStore();
const dailyStore = useDailyStore();
const cloudStore = useCloudStore();
const dietStore = useDietStore();
const notify = useNotification();
const { t } = useI18n();

// UI State
const showSettings = ref(false);
const showDataVis = ref(false);

// Initialization and configuration checks
onMounted(() => {
  if (!profileStore.isConfigured) {
    showSettings.value = true;
  }
});

watch(
  () => profileStore.isConfigured,
  configured => {
    if (!configured) {
      showSettings.value = true;
    }
  }
);

// Event Handlers
// Cloud Sync Handler (data auto-saves via useStorage; this button is for cloud backup only)
const handleSync = async () => {
  if (!cloudStore.isCloudSyncEnabled) {
    notify.error(t('notifications.syncNotConfigured'));
    return;
  }

  const syncId = notify.syncing(t('notifications.syncing'));

  const result = await cloudStore.syncToCloud(
    dailyStore.database,
    profileStore.userProfile,
    dietStore.commonFoods,
    dietStore.recipeCombos
  );

  notify.remove(syncId);
  if (result.success) {
    notify.success(t('notifications.syncSuccess'));
  } else {
    notify.error(t('notifications.syncError', { message: result.message }));
  }
};

const handleExport = () => {
  exportTdeeData(dailyStore.database, profileStore.userProfile);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300 relative">
    <!-- Centralized Notification System -->
    <AppNotification />
    <AppDialog />

    <div class="w-full max-w-[1400px]">
      <!-- Layout Header -->
      <AppHeader @open-settings="showSettings = true" @open-datavis="showDataVis = true" />

      <main class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start relative">
        <!-- Left Column: Base Stats & Workouts -->
        <div
          class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors max-h-[100vh] lg:max-h-[calc(100vh-40px)] overflow-y-auto custom-scrollbar pr-1 pb-4"
        >
          <BaseStatsModule />
          <WorkoutModule />
        </div>

        <!-- Middle Column: Diet Intake -->
        <DietModule />

        <!-- Right Column: Dashboard & Actions -->
        <DailyDashboard @sync="handleSync" @export="handleExport" />
      </main>
    </div>

    <!-- Modals -->
    <Transition name="fade-scale">
      <SettingsModal v-if="showSettings" @close="showSettings = false" />
    </Transition>
    <Transition name="fade-scale">
      <DataVisModal v-if="showDataVis" @close="showDataVis = false" />
    </Transition>
  </div>
</template>
