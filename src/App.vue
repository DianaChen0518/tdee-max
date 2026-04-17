<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTdeeStore } from './store/useTdeeStore';
import { exportTdeeData } from './utils/export';
import { useNotification } from './composables/useNotification';

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

// UI State
const showSettings = ref(false);
const showAudit = ref(false);

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
  notify.success(`已安全保存 ${store.selectedDate} 的数据到本地`);
  
  // 2. Cloud Sync (Conditional & Async)
  if (store.isCloudSyncEnabled) {
    const syncId = notify.syncing('正在同步到云端 Gist...');
    
    const result = await store.syncToCloud();
    
    notify.remove(syncId);
    if (result.success) {
      notify.success('云端备份同步成功！');
    } else {
      notify.error(`云端同步失败: ${result.message}`);
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
        @open-audit="showAudit = true" 
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
          @reset="notify.info('已重置当日数据')" 
          @export="handleExport" 
        />

      </main>
    </div>
    
    <!-- Modals -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
    <DataVisModal v-if="showAudit" @close="showAudit = false" />
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
