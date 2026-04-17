import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'syncing' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

const notifications = ref<AppNotification[]>([]);

/**
 * useNotification composable provides a centralized API for triggering UI feedback.
 */
export function useNotification() {
  const notify = (message: string, type: NotificationType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: AppNotification = { id, message, type, duration };
    
    // Logic for exclusive 'syncing' notifications (replace existing syncing if any)
    if (type === 'syncing') {
      notifications.value = notifications.value.filter(n => n.type !== 'syncing');
    }

    notifications.value.push(newNotif);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  };

  const remove = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  return {
    notifications,
    success: (msg: string) => notify(msg, 'success', 2500),
    error: (msg: string) => notify(msg, 'error', 4000),
    info: (msg: string) => notify(msg, 'info', 3000),
    syncing: (msg: string) => notify(msg, 'syncing', 0), // Duration 0 means manual remove or replace
    remove
  };
}
