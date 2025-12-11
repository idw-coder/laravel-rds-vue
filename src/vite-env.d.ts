/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // Reverb WebSocket接続用の環境変数
  readonly VITE_REVERB_APP_KEY?: string;
  readonly VITE_REVERB_HOST?: string;
  readonly VITE_REVERB_PORT?: string;
  readonly VITE_REVERB_SCHEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    // Googleアドセンスの型定義
    adsbygoogle: any[]
    // Pusherの型定義
    Pusher: any;
    // Laravel Echoの型定義
    Echo: any;
  }
}

export {}

