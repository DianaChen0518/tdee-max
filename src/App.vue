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

const showCloudToast = ref(false);
const cloudToastMsg = ref('');
const cloudSyncStatus = ref<'success' | 'error' | 'syncing'>('syncing');

/**
 * Shared notification handler for local actions.
 */
const showToast = (msg: string) => {
  toastMsg.value = msg;
  showSaveToast.value = true;
  setTimeout(() => {
    showSaveToast.value = false;
  }, 2300);
};

/**
 * Cloud notification handler.
 */
const showCloudNotify = (msg: string, status: 'success' | 'error' | 'syncing') => {
  cloudToastMsg.value = msg;
  cloudSyncStatus.value = status;
  showCloudToast.value = true;
  
  if (status !== 'syncing') {
    setTimeout(() => {
      showCloudToast.value = false;
    }, 3500);
  }
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
const handleSave = async () => {
  // 1. Local Save (Immediate)
  showToast(`✅ 已安全保存 ${store.selectedDate} 的数据到本地`);
  
  // 2. Cloud Sync (Conditional & Async)
  if (store.isCloudSyncEnabled) {
    showCloudNotify('☁️ 正在同步到云端 Gist...', 'syncing');
    
    const result = await store.syncToCloud();
    
    if (result.success) {
      showCloudNotify('🚀 云端备份同步成功！', 'success');
    } else {
      showCloudNotify(`❌ 云端同步失败: ${result.message}`, 'error');
    }
  }
};

const handleExport = () => {
  exportTdeeData(store.database, store.userProfile);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300 relative">
    
    <!-- Notification System (Sequential Toasts) -->
    <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none">
      
      <!-- Local Save Toast -->
      <transition 
        enter-active-class="transition ease-out duration-300 transform" 
        enter-from-class="-translate-y-10 opacity-0" 
        enter-to-class="translate-y-0 opacity-100" 
        leave-active-class="transition ease-in duration-200" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
      >
        <div v-if="showSaveToast" class="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 pointer-events-auto">
          <span>{{ toastMsg }}</span>
        </div>
      </transition>

      <!-- Cloud Sync Toast -->
      <transition 
        enter-active-class="transition ease-out duration-300 transform" 
        enter-from-class="-translate-y-10 opacity-0" 
        enter-to-class="translate-y-0 opacity-100" 
        leave-active-class="transition ease-in duration-200" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
      >
        <div v-if="showCloudToast" 
          :class="[
            'px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-3 pointer-events-auto transition-colors duration-500 border',
            cloudSyncStatus === 'success' ? 'bg-blue-600 border-blue-400 text-white' : 
            cloudSyncStatus === 'error' ? 'bg-red-600 border-red-400 text-white' : 
            'bg-indigo-500/90 border-indigo-300 text-white'
          ]"
        >
          <div v-if="cloudSyncStatus === 'syncing'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>{{ cloudToastMsg }}</span>
        </div>
      </transition>
    </div>

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
