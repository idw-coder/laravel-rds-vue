<template>
  <div class="shared-document">
    <div class="header-section">
      <h2>共同編集エディタ</h2>
      <div class="url-copy-section">
        <button @click="copyUrl" class="copy-url-btn" type="button">
          <i class="fas fa-link"></i> URLをコピー
        </button>
        <span v-if="urlCopied" class="url-copied-message">コピーしました</span>
      </div>
    </div>

    <!-- ロック状態の表示 -->
    <div v-if="isLocked && !isMyLock" class="lock-notice lock-notice-warning">
      <i class="fas fa-lock"></i>
      他のユーザーが編集中です。編集が完了するまでお待ちください。
    </div>
    <div v-if="isMyLock" class="lock-notice lock-notice-success">
      <i class="fas fa-edit"></i>
      編集中
    </div>

    <!-- 保存状態の表示 -->
    <div v-if="isMyLock" class="save-status">
      <span v-if="isSaving" class="save-status-saving">
        <i class="fas fa-spinner fa-spin"></i> 保存中...
      </span>
      <span v-else-if="lastSavedAt" class="save-status-saved">
        <i class="fas fa-check"></i> 保存済み ({{ formatTime(lastSavedAt) }})
      </span>
      <span v-else-if="saveError" class="save-status-error">
        <i class="fas fa-exclamation-triangle"></i> 保存エラー
      </span>
    </div>

    <div class="content-section">
      <label>内容（Markdown対応）</label>
      <div 
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          style="display: none"
          @change="handleFileSelect"
        />
        <div v-if="isUploading" class="upload-status">
          <div class="spinner"></div>
          <p>画像をアップロード中...</p>
        </div>
        <div v-else class="drop-zone-content">
          <p><i class="fas fa-image"></i> 画像をドラッグ&ドロップまたはクリックして選択</p>
          <p class="drop-zone-hint">（最大5MB、JPEG/PNG/GIF/WebP）</p>
        </div>
      </div>
      <div class="content-editor">
        <!-- テキストエリア
          isLocked: ロックがかかっているかどうか
          isMyLock: 自分がロックを保持しているかどうか
          disabled: ロックがかかっている場合は、テキストエリアを無効化
          focus: テキストエリアにフォーカスが当たった時の処理
          blur: テキストエリアからフォーカスが外れた時の処理
          input: テキストエリアに入力された時の処理
        -->
        <textarea 
          ref="textareaRef"
          v-model="content" 
          :placeholder="isLocked && !isMyLock ? '他のユーザーが編集中です' : 'Markdown を入力...'"
          :disabled="isLocked && !isMyLock"
          class="markdown-input"
          @focus="handleEditorFocus"
          @blur="handleEditorBlur"
          @input="handleInput"
        ></textarea>
        <div class="content-preview-wrapper">
          <div class="content-preview" v-html="parsedContent" @click="handleImageClick"></div>
          <div v-if="extractedImages.length > 0" class="image-list">
            <h4>アップロード済み画像</h4>
            <div class="image-items">
              <div v-for="imageUrl in extractedImages" :key="imageUrl" class="image-item">
                <img :src="imageUrl" alt="Preview" class="image-thumbnail" />
                <button 
                  @click="deleteImageFromList(imageUrl)" 
                  class="delete-image-btn"
                  type="button"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" :class="isSuccessMessage ? 'success' : 'error'">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getDocument, updateDocument, uploadImage, deleteImage, acquireLock, releaseLock } from '@/api/sharedDocument'
import echo from '@/api/echo'

// ============================================
// 定数定義
// ============================================
const AUTO_SAVE_DELAY = 2000 // 2秒
const AUTO_UNLOCK_TIMEOUT = 5000 // 5秒
const ERROR_MESSAGE_DISPLAY_TIME = 5000 // 5秒

// ============================================
// ルート情報
// ============================================
const route = useRoute()
const roomId = route.params.roomId as string

// ============================================
// リアクティブ変数
// ============================================
// コンテンツ関連
const content = ref('')
let lastContent = '' // 変更検知用（自動保存の判定に使用）

// UI状態
const isSaving = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const errorMessage = ref('')
const urlCopied = ref(false)

// ロック状態
const isLocked = ref(false) // 誰かがロック中かどうか
const isMyLock = ref(false) // 自分がロックを保持しているかどうか
const lastSavedAt = ref<Date | null>(null)
const saveError = ref(false)

// 参照
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// タイマー
let autoSaveTimer: number | null = null // デバウンス付き自動保存用タイマー
let autoUnlockTimer: number | null = null // 操作がない場合の自動ロック解除用タイマー

// WebSocket
let channel: any = null

// beforeunloadイベント用のラッパー関数
const handleBeforeUnload = () => {
  handleReleaseLock()
}

// ============================================
// Computed Properties
// ============================================
// Markdownをパースしてプレビュー表示用のHTMLに変換
const parsedContent = computed(() => {
  const parsed = marked.parse(content.value)
  return typeof parsed === 'string' ? parsed : String(parsed)
})

// contentから画像URLを抽出（アップロード済み画像リストの表示用）
const extractedImages = computed(() => {
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const images: string[] = []
  let match
  
  while ((match = imageRegex.exec(content.value)) !== null) {
    const imageUrl = match[1]
    // 共有ドキュメントの画像のみ抽出
    if (imageUrl && imageUrl.includes('/shared-documents/') && !images.includes(imageUrl)) {
      images.push(imageUrl)
    }
  }
  
  return images
})

// エラーメッセージが成功メッセージかどうかを判定
const isSuccessMessage = computed(() => {
  return errorMessage.value.includes('削除しました') || 
         errorMessage.value.includes('保存しました') || 
         errorMessage.value.includes('ロックを自動解除')
})

// ============================================
// ユーティリティ関数
// ============================================
const showErrorMessage = (message: string, duration: number = ERROR_MESSAGE_DISPLAY_TIME) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, duration)
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

// ============================================
// ロック管理
// ============================================
// 編集開始時にロックを取得
const handleAcquireLock = async (): Promise<boolean> => {
  try {
    await acquireLock(roomId)
    isLocked.value = true
    isMyLock.value = true
    lastContent = content.value // 初期状態を保存（変更検知用）
    resetAutoUnlockTimer(AUTO_UNLOCK_TIMEOUT) // 自動ロック解除タイマーを開始
    return true
  } catch (error: any) {
    if (error.status === 409) {
      // 他のユーザーが編集中（競合エラー）
      isLocked.value = true
      isMyLock.value = false
      const errorData = error.data || {}
      showErrorMessage(errorData.message || '他のユーザーが編集中です')
      return false
    }
    console.error('ロック取得エラー:', error)
    showErrorMessage(error.message || 'ロックの取得に失敗しました')
    return false
  }
}

// ロックを解放（編集終了時）
const handleReleaseLock = async (skipSave: boolean = false): Promise<void> => {
  if (!isMyLock.value) return

  stopAutoUnlockTimer()

  // 変更があれば最終保存を実行（スキップフラグがfalseの場合のみ）
  if (!skipSave && content.value !== lastContent) {
    await autoSave()
  }

  try {
    await releaseLock(roomId)
  } catch (error: any) {
    console.error('ロック解放エラー:', error)
  } finally {
    isLocked.value = false
    isMyLock.value = false
    
    // 自動保存タイマーをクリア
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }
}

// 自動ロック解除タイマーをリセット（操作がない場合に自動的にロックを解除）
const resetAutoUnlockTimer = (timeout: number = AUTO_UNLOCK_TIMEOUT): void => {
  // 既存のタイマーをクリア
  if (autoUnlockTimer) {
    clearTimeout(autoUnlockTimer)
    autoUnlockTimer = null
  }

  if (!isMyLock.value) return

  // タイマーを設定（操作がない場合、指定時間後にロックを自動解除）
  autoUnlockTimer = window.setTimeout(async () => {
    if (isMyLock.value) {
      // 最終保存を実行してからロック解除（保存はhandleReleaseLockで行うためスキップ）
      if (content.value !== lastContent) {
        await autoSave()
      }
      await handleReleaseLock(true) // 既に保存済みなのでスキップ
      showErrorMessage('操作がないため、ロックを自動解除しました', 3000)
    }
  }, timeout)
}

const stopAutoUnlockTimer = (): void => {
  if (autoUnlockTimer) {
    clearTimeout(autoUnlockTimer)
    autoUnlockTimer = null
  }
}

// ============================================
// 保存処理
// ============================================
// 自動保存処理（変更があった場合のみ保存）
const autoSave = async () => {
  if (!isMyLock.value || content.value === lastContent) return
  
  try {
    isSaving.value = true
    saveError.value = false
    await updateDocument(roomId, content.value)
    lastContent = content.value // 保存済み状態を更新
    lastSavedAt.value = new Date()
  } catch (error: any) {
    console.error('自動保存エラー:', error)
    saveError.value = true
    showErrorMessage('自動保存に失敗しました')
  } finally {
    isSaving.value = false
  }
}

// 入力時の処理（デバウンス付き自動保存）
const handleInput = async () => {

  // ロックがかかっていない場合は、取得を試みる
  if (!isMyLock.value) {
    const success = await handleAcquireLock()
    if (!success) {
      return // ロック取得に失敗した場合は、処理を中断
    }
    lastContent = content.value // 初期状態を保存
  }
  
  // デバウンスタイマーをリセット
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // 操作があったので、自動ロック解除タイマーをリセット
  resetAutoUnlockTimer()
  
  // 2秒後に自動保存（デバウンス）
  autoSaveTimer = window.setTimeout(() => {
    autoSave()
  }, AUTO_SAVE_DELAY)
}

// ============================================
// エディタイベントハンドラー
// ============================================
// エディタフォーカス時の処理（ロックを取得）
const handleEditorFocus = async () => {
  // 自動ロック解除タイマーをキャンセル
  stopAutoUnlockTimer()
  
  // 他のユーザーがロック中の場合、フォーカスを外す
  if (isLocked.value && !isMyLock.value) {
    textareaRef.value?.blur()
    return
  }

  if (!isMyLock.value) {
    // ロックを取得
    const success = await handleAcquireLock()
    if (success) {
      lastContent = content.value // 初期状態を保存
      resetAutoUnlockTimer(AUTO_UNLOCK_TIMEOUT)
    } else {
      textareaRef.value?.blur()
    }
  } else {
    // 既にロックを持っている場合も、操作なしタイマーをリセット
    resetAutoUnlockTimer(AUTO_UNLOCK_TIMEOUT)
  }
}

// エディタからフォーカスが外れた時の処理
const handleEditorBlur = () => {
  if (!isMyLock.value) return
  
  // 最終保存を実行
  if (content.value !== lastContent) {
    autoSave()
  }
  
  // フォーカスが外れたので、5秒後に自動ロック解除
  resetAutoUnlockTimer(AUTO_UNLOCK_TIMEOUT)
}

// ============================================
// 画像アップロード処理
// ============================================
// ファイル選択をトリガー
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// ファイル選択時の処理
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadImageFile(file)
    target.value = '' // ファイル選択をリセット（同じファイルを再度選択できるように）
  }
}

// ドロップ時の処理
const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await uploadImageFile(file)
  }
}

// 画像アップロード処理
const uploadImageFile = async (file: File) => {
  // 他のユーザーがロックしている場合はアップロードできない
  if (isLocked.value && !isMyLock.value) {
    showErrorMessage('編集権限がありません。他のユーザーが編集中です。', 2000)
    return
  }

  // ロックがかかっていない場合は、自動的にロックを取得
  if (!isMyLock.value) {
    const lockAcquired = await handleAcquireLock()
    if (!lockAcquired) {
      showErrorMessage('ロックの取得に失敗しました', 2000)
      return
    }
  }

  try {
    isUploading.value = true
    errorMessage.value = ''
    const result = await uploadImage(roomId, file)
    
    // Markdown形式で画像を挿入
    const imageMarkdown = `![${file.name}](${result.url})`
    const textarea = textareaRef.value
    
    if (textarea) {
      // カーソル位置を取得
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBefore = content.value.substring(0, start)
      const textAfter = content.value.substring(end)
      
      // カーソル位置に画像を挿入（改行を適切に追加）
      const insertText = textBefore.length > 0 && !textBefore.endsWith('\n') ? '\n' + imageMarkdown : imageMarkdown
      content.value = textBefore + insertText + (textAfter.length > 0 && !textAfter.startsWith('\n') ? '\n' : '') + textAfter
      
      // カーソル位置を画像の後に移動
      await nextTick()
      const newCursorPos = start + insertText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
      
      // 画像挿入後に自動保存
      if (isMyLock.value) {
        await autoSave()
      }
    } else {
      // テキストエリアが取得できない場合は末尾に追加
      content.value += (content.value.length > 0 ? '\n' : '') + imageMarkdown
      
      // 画像挿入後に自動保存
      if (isMyLock.value) {
        await autoSave()
      }
    }
  } catch (error: any) {
    console.error('Image upload error:', error)
    showErrorMessage(error.message || '画像のアップロードに失敗しました')
  } finally {
    isUploading.value = false
  }
}

// 画像リストからの削除処理
const deleteImageFromList = async (imageUrl: string) => {
  // 他のユーザーがロックしている場合は削除できない
  if (isLocked.value && !isMyLock.value) {
    showErrorMessage('編集権限がありません。他のユーザーが編集中です。', 2000)
    return
  }

  // ロックがかかっていない場合は、自動的にロックを取得
  if (!isMyLock.value) {
    const lockAcquired = await handleAcquireLock()
    if (!lockAcquired) {
      showErrorMessage('ロックの取得に失敗しました', 2000)
      return
    }
  }

  if (!confirm('この画像を削除しますか？')) {
    return
  }

  try {
    errorMessage.value = ''
    
    // URLからファイル名を抽出
    const urlParts = imageUrl.split('/')
    const filename = urlParts[urlParts.length - 1]
    
    if (!filename) {
      throw new Error('ファイル名を取得できませんでした')
    }
    
    // APIで画像を削除
    await deleteImage(roomId, filename)
    
    // contentから画像のMarkdownを削除（正規表現でエスケープ）
    const escapedUrl = imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const imageMarkdownRegex = new RegExp(`!\\[.*?\\]\\(${escapedUrl}\\)`, 'g')
    content.value = content.value.replace(imageMarkdownRegex, '').trim()
    
    showErrorMessage('画像を削除しました', 3000)
  } catch (error: any) {
    console.error('Image delete error:', error)
    showErrorMessage(error.message || '画像の削除に失敗しました')
  }
}

const handleImageClick = async (event: Event) => {
  // 将来の拡張用
}

// ============================================
// URL操作
// ============================================
const copyUrl = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('URLのコピーに失敗しました:', error)
    showErrorMessage('URLのコピーに失敗しました', 3000)
  }
}

// ============================================
// WebSocket設定
// ============================================
// WebSocketチャンネルに接続してリアルタイム更新を受信
const setupWebSocket = () => {
  channel = echo.channel(`document.${roomId}`)

  // ドキュメント更新イベント（他のユーザーが保存した場合）
  channel.listen('.document.updated', (data: { roomId: string; content: string }) => {
    // 自分のロック中は他のユーザーの更新を無視（競合を避ける）
    if (!isMyLock.value) {
      content.value = data.content
    }
  })

  // ロック取得イベント（他のユーザーが編集を開始した場合）
  channel.listen('.document.locked', (data: { room_id: string; session_id: string; locked_at: string }) => {
    // 自分のロックの場合は無視
    if (isMyLock.value) return
    
    isLocked.value = true
    isMyLock.value = false
    textareaRef.value?.setAttribute('disabled', 'true')
    showErrorMessage('他のユーザーが編集中です')
    stopAutoUnlockTimer()
  })

  // ロック解放イベント（他のユーザーが編集を終了した場合）
  channel.listen('.document.unlocked', (data: { room_id: string; session_id: string }) => {
    isLocked.value = false
    isMyLock.value = false
    textareaRef.value?.removeAttribute('disabled')
  })
}

// ============================================
// ライフサイクル
// ============================================
onMounted(async () => {
  // 初期データを取得
  try {
    const doc = await getDocument(roomId)
    content.value = doc.content || ''
    lastContent = content.value // 初期状態を保存
  } catch (error) {
    console.error('Failed to load document:', error)
  }

  // WebSocketチャンネルに接続（ロック状態はWebSocketで受信）
  setupWebSocket()
  
  // ページ離脱時の処理（ロックを解放）
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // ロックを解放
  handleReleaseLock()

  // タイマーをクリア
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (autoUnlockTimer) clearTimeout(autoUnlockTimer)

  // イベントリスナーを削除
  window.removeEventListener('beforeunload', handleBeforeUnload)

  // WebSocketチャンネルから切断
  if (channel) {
    echo.leave(`document.${roomId}`)
  }
})
</script>

<style scoped>
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-section h2 {
  flex-shrink: 0;
}

h2 {
  font-size: 1rem;
  margin: 0;
}

.shared-document {
  border: 1px solid #ddd;
  padding: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  box-sizing: border-box;
  min-height: 200px;
  resize: vertical;
}

.content-section {
  display: flex;
  flex-direction: column;
}

.content-editor {
  display: flex;
  gap: 1rem;
}

.content-editor textarea {
  flex: 1;
  flex-shrink: 0;
  min-width: 0;
  font-family: 'Noto Sans JP', monospace;
  font-size: 0.875rem;
}

.content-preview-wrapper {
  flex: 1;
  flex-shrink: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-preview {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background: #f9f9f9;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.875rem;
}

.image-list {
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  padding: 0.75rem;
  background: #f9f9f9;
}

.image-list h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: bold;
  color: #666;
}

.image-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.image-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background: white;
}

.image-thumbnail {
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
  border-radius: 0.25rem;
}

.delete-image-btn {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  background-color: #e74c3c;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: opacity 0.2s;
}

.delete-image-btn:hover {
  opacity: 0.8;
}

.content-preview :deep(h1),
.content-preview :deep(h2),
.content-preview :deep(h3) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.content-preview :deep(p) {
  margin: 0.5rem 0;
}

.content-preview :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0.5rem 0;
}

.content-preview :deep(code) {
  background: #e8e8e8;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
  font-size: 0.8rem;
}

.content-preview :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 0.75rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}

.content-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.content-preview :deep(ul),
.content-preview :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.content-preview :deep(blockquote) {
  border-left: 3px solid #41B883;
  margin: 0.5rem 0;
  padding-left: 1rem;
  color: #666;
}

@media (max-width: 768px) {
  .content-editor {
    flex-direction: column;
  }

  .content-preview {
    min-height: 150px;
  }

  .image-items {
    justify-content: center;
  }

  .image-thumbnail {
    max-width: 100px;
    max-height: 100px;
  }
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

button[type="button"] {
  background-color: #41B883;
  color: white;
}

button[type="button"]:hover:not(:disabled) {
  opacity: 0.8;
}

button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}

.success {
  color: #27ae60;
  margin-top: 0.5rem;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 0.25rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.drop-zone:hover {
  border-color: #41B883;
  background: #f0f9f5;
}

.drop-zone.drag-over {
  border-color: #41B883;
  background: #e8f5e9;
  border-style: solid;
}

.drop-zone.uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

.drop-zone-content p {
  margin: 0.5rem 0;
  color: #666;
}

.drop-zone-hint {
  font-size: 0.875rem;
  color: #999;
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #41B883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lock-notice {
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.lock-notice i {
  font-size: 1rem;
}

.lock-notice-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.lock-notice-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 保存状態のスタイル */
.save-status {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  background-color: #f8f9fa;
}

.save-status-saving {
  color: #007bff;
}

.save-status-saved {
  color: #28a745;
}

.save-status-error {
  color: #dc3545;
}

.save-status i {
  margin-right: 0.25rem;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

.url-copy-section {
  position: relative;
  flex-shrink: 0;
}

.copy-url-btn {
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-url-btn:hover {
  background-color: #f5f5f5;
  border-color: #41B883;
  color: #41B883;
}

.copy-url-btn i {
  margin-right: 0.25rem;
}

.url-copied-message {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  color: #41B883;
  font-size: 0.875rem;
  white-space: nowrap;
  pointer-events: none;
}
</style>


