<script setup lang="ts">
import { useNotification } from '../../composables/useNotification';

const { notifications } = useNotification();
</script>

<template>
  <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
    <transition-group 
      enter-active-class="transition ease-out duration-300 transform" 
      enter-from-class="-translate-y-10 opacity-0 scale-95" 
      enter-to-class="translate-y-0 opacity-100 scale-100" 
      leave-active-class="transition ease-in duration-200 absolute" 
      leave-from-class="opacity-100 scale-100" 
      leave-to-class="opacity-0 scale-90"
      move-class="transition duration-300"
    >
      <div 
        v-for="notif in notifications" 
        :key="notif.id"
        :class="[
          'px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-3 pointer-events-auto border backdrop-blur-md transition-all duration-300 min-w-[280px] justify-center text-center',
          notif.type === 'success' ? 'bg-green-600/90 border-green-400 text-white' : 
          notif.type === 'error' ? 'bg-red-600/90 border-red-400 text-white' : 
          notif.type === 'syncing' ? 'bg-indigo-600/90 border-indigo-400 text-white' :
          'bg-gray-800/90 border-gray-600 text-white'
        ]"
      >
        <!-- Loading Spinner for Syncing -->
        <div v-if="notif.type === 'syncing'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
        
        <!-- Status Icon -->
        <span v-else-if="notif.type === 'success'" class="shrink-0 text-lg">✅</span>
        <span v-else-if="notif.type === 'error'" class="shrink-0 text-lg">❌</span>
        
        <span class="text-sm tracking-tight">{{ notif.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
/* Transition group needs a container for move animations to work smoothly */
.v-move {
  transition: transform 0.3s ease;
}
</style>
