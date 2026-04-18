import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { GistService, GistSyncResult } from '../services/GistService';
import { TokenVault } from '../utils/TokenVault';
import { Database } from '../types';

export const useCloudStore = defineStore('cloud', () => {
  const githubToken = ref(TokenVault.migrateLegacy() || TokenVault.retrieve());

  // Watcher handled via computed setter or we can just provide an update action
  const setGithubToken = (val: string) => {
    githubToken.value = val;
    TokenVault.store(val);
  };

  const gistId = useStorage<string>('tdee_gist_id', '');

  const isCloudSyncEnabled = computed(() => {
    return !!(githubToken.value && githubToken.value.trim().length > 0);
  });

  // Requires Database dependency from caller or import it.
  // Actually, since useCloudStore syncs all states, we need to gather them.
  // A cleaner approach is to have arguments injected or depend directly.
  const syncToCloud = async (
    database: Database,
    userProfile: any,
    commonFoods: any,
    recipeCombos: any
  ): Promise<GistSyncResult> => {
    if (!isCloudSyncEnabled.value) {
      return { success: false, message: 'Cloud sync not configured' };
    }

    const payload = {
      userProfile,
      database,
      commonFoods,
      recipeCombos
    };

    const result = await GistService.pushToCloud(githubToken.value, gistId.value, payload);

    if (result.success && result.data?.id && !gistId.value) {
      gistId.value = result.data.id as string;
    }

    return result;
  };

  return {
    githubToken,
    gistId,
    setGithubToken,
    isCloudSyncEnabled,
    syncToCloud
  };
});
