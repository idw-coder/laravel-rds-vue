/**
 * Laravel Echo WebSocket 接続設定モジュール
 * 
 * このファイルは、リアルタイム通信（WebSocket）を実現するためのLaravel Echoインスタンスを
 * 初期化・設定し、アプリケーション全体で再利用可能な形でエクスポートします。
 * 
 * 【主な役割】
 * 1. Laravel ReverbサーバーへのWebSocket接続を確立
 * 2. リアルタイムイベントの受信・送信の基盤を提供
 * 3. 共同編集機能など、複数ユーザー間の同期通信を可能にする
 * 
 * 【関連ファイル】
 * - src/views/SharedDocument.vue: 共同編集エディタで使用
 *   → document.{roomId} チャンネルを購読し、document.updated イベントを受信
 *   → 他のユーザーが編集した内容をリアルタイムで反映
 * 
 * - src/api/sharedDocument.ts: REST API経由でのドキュメント操作
 *   → echo.tsと組み合わせて、保存時にWebSocketで他のユーザーに通知
 * 
 * 【環境変数】
 * 以下の環境変数が .env ファイルに設定されている必要があります：
 * - VITE_REVERB_APP_KEY: Reverbアプリケーションキー
 * - VITE_REVERB_HOST: WebSocketサーバーのホスト名
 * - VITE_REVERB_PORT: WebSocketサーバーのポート番号（デフォルト: 8080）
 * - VITE_REVERB_SCHEME: プロトコル（https/http、デフォルト: https）
 * 
 * 【使用例】
 * ```typescript
 * import echo from '@/api/echo'
 * 
 * // チャンネルに接続
 * const channel = echo.channel('document.room123')
 * 
 * // イベントをリッスン
 * channel.listen('.document.updated', (data) => {
 *   console.log('更新を受信:', data)
 * })
 * 
 * // チャンネルから切断
 * echo.leave('document.room123')
 * ```
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Pusherをwindowオブジェクトにセット（Laravel Echoが内部で使用）
// Laravel Echoは内部的にPusher.jsを使用するため、グローバルに設定が必要
window.Pusher = Pusher;

/**
 * Laravel Echo インスタンスを作成
 * 
 * Laravel Reverbサーバーに接続してWebSocketを確立します。
 * ReverbはLaravel公式のWebSocketサーバーで、Pusherプロトコル互換です。
 */
const echo = new Echo({
  // ブロードキャスタ: Laravel Reverbを使用
  broadcaster: 'reverb',
  
  // アプリケーションキー（Reverbサーバー側の設定と一致させる必要がある）
  key: import.meta.env.VITE_REVERB_APP_KEY,
  
  // WebSocketサーバーのホスト名
  wsHost: import.meta.env.VITE_REVERB_HOST,
  
  // WebSocketポート番号（非暗号化接続用）
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  
  // セキュアWebSocketポート番号（暗号化接続用）
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  
  // TLS強制: httpsスキームの場合はtrue
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  
  // 有効なトランスポート: WebSocket（ws）とセキュアWebSocket（wss）を許可
  enabledTransports: ['ws', 'wss'],
});

// 設定済みのEchoインスタンスをエクスポート
// アプリケーション全体でこのインスタンスを共有して使用
export default echo;