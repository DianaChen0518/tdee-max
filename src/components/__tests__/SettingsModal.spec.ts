import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SettingsModal from '../SettingsModal.vue';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import enUS from '../../i18n/locales/en-US';

describe('SettingsModal.vue', () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    setActivePinia(createPinia());
    i18n = createI18n({
      legacy: false,
      locale: 'en-US',
      messages: { 'en-US': enUS }
    });
  });

  it('renders settings fields properly', () => {
    const wrapper = mount(SettingsModal, {
      global: {
        plugins: [i18n]
      }
    });

    // It should render the modal title from i18n
    expect(wrapper.text()).toContain(enUS.settings.title);

    // It should contain input for Github PAT
    const patInput = wrapper.find('input[type="password"]');
    expect(patInput.exists()).toBe(true);
  });
});
