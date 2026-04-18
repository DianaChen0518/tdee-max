/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
