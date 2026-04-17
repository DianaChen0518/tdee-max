import { createI18n } from 'vue-i18n';
import zh from './locales/zh-CN';
import en from './locales/en-US';

const messages = {
  'zh-CN': zh,
  'en-US': en
};

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('user-lang') || 'zh-CN',
  fallbackLocale: 'en-US',
  messages
});

export default i18n;
