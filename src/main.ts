import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n from './i18n'
import './style.css'
import App from './App.vue'
import { Logger } from './utils/Logger'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

// P3: Global error boundary — prevents white-screen crashes
app.config.errorHandler = (err, instance, info) => {
  Logger.error('Unhandled Vue error', { err, info, component: instance?.$options?.name || 'unknown' });
  console.error('[TDEE-Max] Uncaught error:', err);
};

app.mount('#app')
