<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTdeeStore } from './store/useTdeeStore';
import { exportTdeeData } from './utils/export';

// Extracted Components
import AppHeader from './components/layout/AppHeader.vue';
import DailyDashboard from './components/features/tdee/DailyDashboard.vue';
import BaseStatsModule from './components/features/tdee/BaseStatsModule.vue';
import WorkoutModule from './components/features/workout/WorkoutModule.vue';
import DietModule from './components/features/diet/DietModule.vue';

// Existing Modals
import SettingsModal from './components/SettingsModal.vue';
import DataVisModal from './components/DataVisModal.vue';

const store = useTdeeStore();

// UI State
const showSettings = ref(false);
const showAudit = ref(false);
const showSaveToast = ref(false);
const toastMsg = ref('');

/**
 * Shared notification handler.
 */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showSaveToast.value = true;
  setTimeout(() => {
    showSaveToast.value = false;
  }, 2000);
};

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
const handleSave = () => {
  showToast(`✅ 已安全保存 ${store.selectedDate} 的数据到本地`);
};

const handleExport = () => {
  exportTdeeData(store.database, store.userProfile);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300 relative">
    
    <!-- Toast Notification -->
    <transition 
      enter-active-class="transition ease-out duration-300 transform" 
      enter-from-class="-translate-y-10 opacity-0" 
      enter-to-class="translate-y-0 opacity-100" 
      leave-active-class="transition ease-in duration-200" 
      leave-from-class="opacity-100" 
      leave-to-class="opacity-0"
    >
      <div v-if="showSaveToast" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
        <span>{{ toastMsg }}</span>
      </div>
    </transition>

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
        <DietModule @toast="showToast" />

        <!-- Right Column: Dashboard & Actions -->
        <DailyDashboard 
          @save="handleSave" 
          @reset="showToast('🧹 已重置当日数据')" 
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
