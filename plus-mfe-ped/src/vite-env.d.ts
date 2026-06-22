/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MS_AUTH_URL: string;
  readonly VITE_MS_PED_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
