<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useDialog } from '../composables/useDialog';
import { useI18n } from 'vue-i18n';

const { state, inputValue, dismiss } = useDialog();
const { t } = useI18n();
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => state.visible, async (visible) => {
  if (visible && state.options.type === 'prompt') {
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
});

const onConfirm = () => {
  dismiss(state.options.type === 'prompt' ? inputValue.value : true);
};

const onCancel = () => {
  dismiss(state.options.type === 'prompt' ? null : false);
};
</script>

<template>
  <Transition name="dialog-fade">
    <div v-if="state.visible" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" @click.self="onCancel">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"></div>

      <!-- Dialog Card -->
      <div class="relative bg-white dark:bg-[#1e1e1e] rounded-card shadow-2xl max-w-md w-full border border-gray-200 dark:border-[#333] transform transition-all">
        <div class="p-6">
          <!-- Title -->
          <h3 v-if="state.options.title" class="text-lg font-bold text-gray-800 dark:text-white mb-2 leading-tight">
            {{ state.options.title }}
          </h3>

          <!-- Message -->
          <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line" :class="state.options.title ? 'mb-5' : 'mb-5 mt-1'">
            {{ state.options.message }}
          </p>

          <!-- Prompt Input -->
          <input
            v-if="state.options.type === 'prompt'"
            ref="inputRef"
            v-model="inputValue"
            :placeholder="state.options.placeholder || ''"
            class="w-full px-4 py-2.5 rounded-btn border border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#2a2a2a] text-gray-800 dark:text-white text-sm mb-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            @keyup.enter="onConfirm"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex border-t border-gray-100 dark:border-[#333]">
          <button
            @click="onCancel"
            class="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors rounded-bl-card"
          >
            {{ state.options.cancelText || t('dialog.cancel') }}
          </button>
          <button
            @click="onConfirm"
            class="flex-1 px-4 py-3 text-sm font-bold transition-colors rounded-br-card border-l border-gray-100 dark:border-[#333]"
            :class="state.options.danger
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
          >
            {{ state.options.confirmText || t('dialog.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
/* Dialog transition */
.dialog-fade-enter-active {
  transition: opacity 0.2s ease-out;
}
.dialog-fade-enter-active > div:last-child {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.dialog-fade-leave-active {
  transition: opacity 0.15s ease-in;
}
.dialog-fade-leave-active > div:last-child {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from > div:last-child,
.dialog-fade-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
