<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTdeeStore } from './store/useTdeeStore';
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

// Existing Modals
import SettingsModal from './components/SettingsModal.vue';
import DataVisModal from './components/DataVisModal.vue';

const store = useTdeeStore();
const notify = useNotification();
const { t } = useI18n();

// UI State
const showSettings = ref(false);
const showDataVis = ref(false);

// Initialization and configuration checks
onMounted(() => {
  if (!store.isConfigured) {
    showSettings.value = true;
  }
});

watch(() => store.isConfigured, (configured) => {
  if (!configured) {
    showSettings.value = true;
  }
});

// Event Handlers
const handleSave = async () => {
  // 1. Local Save (Immediate feedback via the new notification system)
  notify.success(t('notifications.saveSuccess', { date: store.selectedDate }));
  
  // 2. Cloud Sync (Conditional & Async)
  if (store.isCloudSyncEnabled) {
    const syncId = notify.syncing(t('notifications.syncing'));
    
    const result = await store.syncToCloud();
    
    notify.remove(syncId);
    if (result.success) {
      notify.success(t('notifications.syncSuccess'));
    } else {
      notify.error(t('notifications.syncError', { message: result.message }));
    }
  }
};

const handleExport = () => {
  exportTdeeData(store.database, store.userProfile);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300 relative">
    
    <!-- Centralized Notification System -->
    <AppNotification />

    <div class="w-full max-w-[1400px]">
      
      <!-- Layout Header -->
      <AppHeader 
        @open-settings="showSettings = true" 
        @open-datavis="showDataVis = true"
      />

      <main class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start relative">
        
        <!-- Left Column: Base Stats & Workouts -->
        <div class="flex flex-col gap-4 lg:sticky lg:top-6 transition-colors max-h-[100vh] lg:max-h-[calc(100vh-40px)] overflow-y-auto custom-scrollbar pr-1 pb-4">
          <BaseStatsModule />
          <WorkoutModule />
        </div>

        <!-- Middle Column: Diet Intake -->
        <DietModule />

        <!-- Right Column: Dashboard & Actions -->
        <DailyDashboard 
          @save="handleSave" 
          @reset="notify.info(t('notifications.resetSuccess'))" 
          @export="handleExport" 
        />

      </main>
    </div>
    
    <!-- Modals -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
    <DataVisModal v-if="showDataVis" @close="showDataVis = false" />
  </div>
</template>

<style>
/* Custom scrollbar for better professional feel */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}
</style>
