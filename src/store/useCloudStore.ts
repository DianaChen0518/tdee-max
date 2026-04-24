import { defineStore } from 'pinia';
import { ref, computed, watch, toRaw } from 'vue';
import { useStorage } from '@vueuse/core';
import { GistService, GistSyncResult } from '../services/GistService';
import { TokenVault } from '../utils/TokenVault';
import { Database, UserProfile, Food, RecipeCombo } from '../types';

export const useCloudStore = defineStore('cloud', () => {
  const githubToken = ref(TokenVault.migrateLegacy() || TokenVault.retrieve());

  const setGithubToken = (val: string) => {
    githubToken.value = val;
    TokenVault.store(val);
  };

  watch(githubToken, (newVal: string) => {
    TokenVault.store(newVal);
  });

  const gistId = useStorage<string>('tdee_gist_id', '');

  const isCloudSyncEnabled = computed(() => {
    return !!(githubToken.value && githubToken.value.trim().length > 0);
  });

  /**
   * Synchronizes local state to GitHub Gist.
   * Uses toRaw to ensure data is stripped of Vue proxies before serialization.
   */
  const syncToCloud = async (
    database: Database,
    userProfile: UserProfile,
    commonFoods: Food[],
    recipeCombos: RecipeCombo[]
  ): Promise<GistSyncResult> => {
    if (!isCloudSyncEnabled.value) {
      return { success: false, message: 'Cloud sync not configured' };
    }

    // De-proxy objects to prevent serialization issues with nested reactive proxies
    const payload = {
      userProfile: toRaw(userProfile),
      database: toRaw(database),
      commonFoods: toRaw(commonFoods),
      recipeCombos: toRaw(recipeCombos)
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
