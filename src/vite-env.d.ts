/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // 他の環境変数をここに追加できます
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Googleアドセンスの型定義
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export {}

