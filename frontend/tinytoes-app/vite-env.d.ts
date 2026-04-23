/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.ttf?url' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
