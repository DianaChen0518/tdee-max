import { ref, reactive } from 'vue';

/**
 * Dialog configuration options.
 */
export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type: 'confirm' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
  /** When true, the confirm button is styled as destructive (red). */
  danger?: boolean;
}

interface DialogState {
  visible: boolean;
  options: DialogOptions;
  resolve: ((value: boolean | string | null) => void) | null;
}

/**
 * Module-level singleton state — shared across all useDialog() callers.
 * This is intentional: there is only one dialog overlay in the app.
 */
const state = reactive<DialogState>({
  visible: false,
  options: { message: '', type: 'confirm' },
  resolve: null
});

const inputValue = ref('');

/**
 * Non-blocking dialog composable that replaces native `confirm()` and `prompt()`.
 * Returns Promises so callers can `await` the user's decision.
 *
 * @example
 * const dialog = useDialog();
 * const ok = await dialog.confirm({ message: 'Delete?', danger: true });
 * const name = await dialog.prompt({ message: 'Name:', defaultValue: 'Untitled' });
 */
export function useDialog() {
  const dismiss = (value: boolean | string | null) => {
    state.resolve?.(value);
    state.visible = false;
    state.resolve = null;
  };

  const confirm = (options: Omit<DialogOptions, 'type'> | string): Promise<boolean> => {
    // Auto-cancel any pending dialog
    if (state.resolve) dismiss(false);

    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise(resolve => {
      state.options = { ...opts, type: 'confirm' };
      state.resolve = val => resolve(val as boolean);
      inputValue.value = '';
      state.visible = true;
    });
  };

  const prompt = (
    options: Omit<DialogOptions, 'type'> & { defaultValue?: string; placeholder?: string }
  ): Promise<string | null> => {
    if (state.resolve) dismiss(null);

    return new Promise(resolve => {
      state.options = { ...options, type: 'prompt' };
      state.resolve = val => resolve(val as string | null);
      inputValue.value = options.defaultValue || '';
      state.visible = true;
    });
  };

  return { state, inputValue, confirm, prompt, dismiss };
}
