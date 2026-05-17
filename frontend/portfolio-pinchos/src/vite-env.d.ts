/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOAST_RESTAURANT_SLUG: string;
  readonly VITE_TOAST_RESTAURANT_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
