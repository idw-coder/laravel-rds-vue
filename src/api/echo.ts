import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Pusherをwindowオブジェクトにセット（Laravel Echoが内部で使用）
window.Pusher = Pusher;

// Laravel Echo インスタンスを作成
// Reverbサーバーに接続してWebSocketを確立
const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
});

export default echo;