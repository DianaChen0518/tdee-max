import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile } from '../types';

export const useProfileStore = defineStore('profile', () => {
  const userProfile = useStorage<UserProfile>('tdee_user_v2', {
    birthDate: '',
    heightCm: 0,
    gender: 'M',
    rhr: 70
  });

  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  return {
    userProfile,
    isConfigured
  };
});
