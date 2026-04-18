import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DietModule from '../features/diet/DietModule.vue';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import enUS from '../../i18n/locales/en-US';

// We must mock resize observer as it's not present in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DietModule.vue', () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    setActivePinia(createPinia());
    i18n = createI18n({
      legacy: false,
      locale: 'en-US',
      messages: { 'en-US': enUS }
    });
  });

  it('renders correctly', () => {
    const wrapper = mount(DietModule, {
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain(enUS.diet.title);
  });
});
