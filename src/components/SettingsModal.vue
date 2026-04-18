<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';
import { GistService } from '../services/GistService';
import { DataValidator } from '../utils/DataValidator';
import { Database, Food, RecipeCombo } from '../types';
import { useI18n } from 'vue-i18n';
import { HapticUtils } from '../utils/HapticUtils';
import { useDialog } from '../composables/useDialog';

const store = useTdeeStore();
const { t, locale } = useI18n();
const emit = defineEmits(['close']);
const dialog = useDialog();

const currentLang = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    localStorage.setItem('user-lang', val);
  }
});

const isValid = computed(() => {
  return store.userProfile.birthDate !== '' && store.userProfile.heightCm > 0;
});

const handleClose = () => {
  if (isValid.value) {
    emit('close');
  }
};

const syncInProgress = ref(false);
const syncError = ref('');
const syncSuccess = ref('');

const backupData = async () => {
    HapticUtils.lightTick();
    if (!store.githubToken) {
        syncError.value = t('settings.messages.tokenRequired');
        return;
    }
    syncInProgress.value = true;
    syncError.value = '';
    syncSuccess.value = '';
    
    try {
        const result = await store.syncToCloud();
        if (result.success) {
            syncSuccess.value = t('settings.messages.backupSuccess') + ' (' + new Date().toLocaleTimeString() + ')';
        } else {
            syncError.value = result.message;
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        syncError.value = t('settings.messages.syncError', { message: msg });
    } finally {
        syncInProgress.value = false;
    }
};

const restoreData = async () => {
    HapticUtils.lightTick();
    if (!store.githubToken || !store.gistId) {
        syncError.value = t('settings.messages.tokenGistRequired');
        return;
    }
    const confirmed = await dialog.confirm({
      title: '⚠️ ' + t('settings.actions.restore'),
      message: t('settings.messages.restoreConfirm'),
      confirmText: t('settings.actions.restore'),
      danger: true
    });
    if (!confirmed) return;
    
    syncInProgress.value = true;
    syncError.value = '';
    syncSuccess.value = '';

    try {
        const result = await GistService.pullFromCloud(store.githubToken, store.gistId);
        if (result.success && result.data) {
            const parsed = result.data;

            // P1 Fix: validate cloud data before writing to store
            const validation = DataValidator.validateCloudData(parsed);
            if (!validation.valid) {
              syncError.value = t('notifications.cloudDataInvalid', { errors: validation.errors.join('; ') });
              return;
            }

            if (parsed.userProfile) Object.assign(store.userProfile, parsed.userProfile);
            if (parsed.database) store.database = parsed.database as Database;
            if (parsed.commonFoods) store.commonFoods = parsed.commonFoods as Food[];
            if (parsed.recipeCombos) store.recipeCombos = parsed.recipeCombos as RecipeCombo[];
            syncSuccess.value = t('settings.messages.restoreSuccess');
        } else {
            syncError.value = result.message;
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        syncError.value = t('settings.messages.restoreError', { message: msg });
    } finally {
        syncInProgress.value = false;
    }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4 overflow-y-auto" @click.self="HapticUtils.lightTick(); handleClose()">
    <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-card border border-gray-100 dark:border-[#333] w-full max-w-md shadow-premium transition-colors">
      <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white flex items-center gap-2">⚙️ {{ t('settings.title') }}</h2>
      
      <p v-if="!store.isConfigured" class="text-xs text-orange-600 dark:text-orange-400 mb-4 bg-orange-100 dark:bg-orange-900/20 p-3 rounded-inner border border-orange-200 dark:border-orange-800/50 font-medium">
        {{ t('settings.firstTimeTip') }}
      </p>
      <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-4">{{ t('settings.changeTip') }}</p>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{{ t('settings.labels.birthDate') }}</label>
          <input type="date" v-model="store.userProfile.birthDate" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2.5 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all font-bold">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{{ t('settings.labels.height') }}</label>
          <input type="number" v-model.number="store.userProfile.heightCm" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2.5 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all font-bold">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{{ t('settings.labels.rhr') }}</label>
          <input type="number" v-model.number="store.userProfile.rhr" :placeholder="t('settings.labels.rhr')" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2.5 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all font-bold">
          <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed italic">
            {{ t('settings.rhrTip') }}
          </p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{{ t('settings.labels.gender') }}</label>
          <select v-model="store.userProfile.gender" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2.5 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all font-bold cursor-pointer">
            <option value="M">{{ t('settings.genders.M') }}</option>
            <option value="F">{{ t('settings.genders.F') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{{ t('settings.labels.language') }}</label>
          <select v-model="currentLang" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2.5 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-all font-bold cursor-pointer">
            <option value="zh-CN">{{ t('settings.languages.zh') }}</option>
            <option value="en-US">{{ t('settings.languages.en') }}</option>
          </select>
        </div>
      </div>

      <div class="mt-6 border-t border-gray-100 dark:border-[#333] pt-4">
        <h3 class="text-sm font-bold mb-3 text-gray-800 dark:text-white flex items-center gap-2">☁️ {{ t('settings.gist.title') }}</h3>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-4 leading-normal">{{ t('settings.gist.tip') }}</p>
        
        <div class="space-y-3 mb-4">
          <div>
            <label class="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{{ t('settings.labels.token') }}</label>
            <input type="password" v-model="store.githubToken" placeholder="ghp_xxx..." class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2 text-xs text-gray-800 dark:text-white outline-none focus:border-blue-500 transition-all">
            <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 leading-relaxed">
              {{ t('settings.tokenWarning') }}
            </p>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{{ t('settings.labels.gistId') }}</label>
            <input type="text" v-model="store.gistId" placeholder="..." class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-200 dark:border-[#444] rounded-inner p-2 text-xs text-gray-800 dark:text-white outline-none focus:border-blue-500 transition-all">
          </div>
        </div>
        
        <div class="flex gap-2">
          <button @click="backupData" :disabled="syncInProgress" class="flex-1 bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white rounded-btn p-3 text-xs font-bold transition-all disabled:opacity-50 shadow-md">
            📤 {{ t('settings.actions.backup') }}
          </button>
          <button @click="restoreData" :disabled="syncInProgress" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-btn p-3 text-xs font-bold transition-all disabled:opacity-50 shadow-md">
            📥 {{ t('settings.actions.restore') }}
          </button>
        </div>
        
        <div v-if="syncSuccess" class="text-[11px] text-green-600 dark:text-green-400 mt-3 font-medium bg-green-50 dark:bg-green-900/10 p-2 rounded-inner border border-green-100 dark:border-green-900/30">{{ syncSuccess }}</div>
        <div v-if="syncError" class="text-[11px] text-red-500 dark:text-red-400 mt-3 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-inner border border-red-100 dark:border-red-900/30">{{ syncError }}</div>
      </div>
      
      <button 
        @click="HapticUtils.lightTick(); handleClose()" 
        :disabled="!isValid" 
        :class="['w-full py-3 mt-6 rounded-btn font-bold transition-all shadow-lg', isValid ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer transform active:scale-95' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none']"
      >
        {{ store.isConfigured ? t('settings.actions.saveClose') : t('settings.actions.saveStart') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>
