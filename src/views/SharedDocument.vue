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

    <p v-if="errorMessage" :class="errorMessage.includes('削除しました') || errorMessage.includes('保存しました') || errorMessage.includes('ロックを自動解除') ? 'success' : 'error'">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getDocument, updateDocument, uploadImage, deleteImage, acquireLock, releaseLock, checkLockStatus, refreshLock } from '@/api/sharedDocument'
import echo from '@/api/echo'

const route = useRoute()
const roomId = route.params.roomId as string

const content = ref('')
const isSaving = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const errorMessage = ref('')
const urlCopied = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ロック状態管理
const isLocked = ref(false)
const isMyLock = ref(false)
let mySessionId: string | null = null // 自分のセッションIDを保存
let heartbeatInterval: number | null = null
let lockStatusCheckInterval: number | null = null

// 自動保存・自動ロック解除用の状態管理
const lastSavedAt = ref<Date | null>(null)
const saveError = ref(false)
let autoSaveTimer: number | null = null
let autoUnlockTimer: number | null = null
let lastContent = '' // 変更検知用

// Markdownをパースしてプレビュー表示
const parsedContent = computed(() => {
  const parsed = marked.parse(content.value)
  const html = typeof parsed === 'string' ? parsed : String(parsed)
  return html
})

// contentから画像URLを抽出
const extractedImages = computed(() => {
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const images: string[] = []
  let match
  
  while ((match = imageRegex.exec(content.value)) !== null) {
    const imageUrl = match[1]
    if (imageUrl && imageUrl.includes('/shared-documents/') && !images.includes(imageUrl)) {
      images.push(imageUrl)
    }
  }
  
  return images
})

// WebSocketでリアルタイム更新を受信
let channel: any = null

// 編集開始、自分のセッションでロック
const handleAcquireLock = async (): Promise<boolean> => {
  try {
    const response = await acquireLock(roomId)
    isLocked.value = true
    isMyLock.value = true
    lastContent = content.value // 初期状態を保存
    startHeartbeat()
    // ロック取得後、操作なしタイマーを開始（5秒）
    resetAutoUnlockTimer(5000)
    return true
  } catch (error: any) {
    if (error.status === 409) {
      // 他のユーザーが編集中
      isLocked.value = true
      isMyLock.value = false
      const errorData = error.data || {}
      errorMessage.value = errorData.message || '他のユーザーが編集中です'
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
      return false
    }
    console.error('ロック取得エラー:', error)
    errorMessage.value = error.message || 'ロックの取得に失敗しました'
    return false
  }
}

// ロック解放
const handleReleaseLock = async (): Promise<void> => {
  console.log('handleReleaseLockが呼び出されました')
  if (!isMyLock.value) return

  // タイマーを停止
  stopAutoUnlockTimer()

  // 最終保存を実行
  if (content.value !== lastContent) {
    await autoSave()
  }

  try {
    console.log('releaseLock APIを呼び出しました')
    await releaseLock(roomId)
  } catch (error: any) {
    console.error('ロック解放エラー:', error)
  } finally {
    isLocked.value = false
    isMyLock.value = false
    stopHeartbeat()
    
    // 自動保存タイマーをクリア
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    console.log('タイマーをクリアしました')
  }
}

// ハートビート開始
const startHeartbeat = (): void => {
  stopHeartbeat() // 既存のハートビートを停止

  heartbeatInterval = setInterval(async () => {
    try {
      await refreshLock(roomId)
      
      // ハートビート時に変更があれば自動保存
      if (isMyLock.value && content.value !== lastContent) {
        await autoSave()
      }
    } catch (error: any) {
      console.error('ハートビートエラー:', error)
      // ロックが失われた場合
      if (error.status === 404) {
        isLocked.value = false
        isMyLock.value = false
        stopHeartbeat()
        errorMessage.value = 'ロックが失われました'
        setTimeout(() => {
          errorMessage.value = ''
        }, 5000)
      }
    }
  }, 5000) // 5秒ごと
}

// ハートビート停止
const stopHeartbeat = (): void => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

// ロック状態確認
const handleCheckLockStatus = async (): Promise<void> => {
  try {
    const status = await checkLockStatus(roomId)
    isLocked.value = status.is_locked
    // 自分のロックかどうかはWebSocketイベントで判断
  } catch (error) {
    console.error('ロック状態確認エラー:', error)
  }
}

// 自動ロック解除タイマーをリセット（フォーカス状態に応じてタイムアウト時間を変更）
const resetAutoUnlockTimer = (timeout?: number): void => {
  // 既存のタイマーをクリア
  if (autoUnlockTimer) {
    clearTimeout(autoUnlockTimer)
    autoUnlockTimer = null
  }

  // 自分のロックを持っていない場合はタイマーを設定しない
  if (!isMyLock.value) return

  // タイムアウト時間を決定（フォーカスがある場合も外れた場合も5秒）
  const unlockTimeout = timeout ?? 5000

  // タイマーを設定
  autoUnlockTimer = window.setTimeout(async () => {
    if (isMyLock.value) {
      // 最終保存を実行してからロック解除
      if (content.value !== lastContent) {
        await autoSave()
      }
      await handleReleaseLock()
      errorMessage.value = '操作がないため、ロックを自動解除しました'
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  }, unlockTimeout)
}

// 自動ロック解除タイマーを停止
const stopAutoUnlockTimer = (): void => {
  if (autoUnlockTimer) {
    clearTimeout(autoUnlockTimer)
    autoUnlockTimer = null
  }
}

// 入力時の処理（デバウンス付き自動保存）
const handleInput = () => {
  if (!isMyLock.value) return
  
  // デバウンスタイマーをリセット
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // 操作があったので、自動ロック解除タイマーをリセット（フォーカスがある場合は30秒）
  resetAutoUnlockTimer()
  
  // 2秒後に自動保存
  autoSaveTimer = window.setTimeout(() => {
    autoSave()
  }, 2000)
}

// 自動保存処理
const autoSave = async () => {
  if (!isMyLock.value || content.value === lastContent) return
  
  try {
    isSaving.value = true
    saveError.value = false
    await updateDocument(roomId, content.value)
    lastContent = content.value
    lastSavedAt.value = new Date()
  } catch (error) {
    console.error('自動保存エラー:', error)
    saveError.value = true
    errorMessage.value = '自動保存に失敗しました'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    isSaving.value = false
  }
}

// エディタからフォーカスが外れた時の処理
const handleEditorBlur = () => {
  console.log('エディタからフォーカスが外れた時の処理')
  if (!isMyLock.value) return
  
  // 最終保存を実行
  if (content.value !== lastContent) {
    autoSave()
  }
  
  // フォーカスが外れたので、5秒後に自動ロック解除
  resetAutoUnlockTimer(5000)
}

// エディタフォーカス時の処理
const handleEditorFocus = async () => {
  // 自動ロック解除タイマーをキャンセル
  stopAutoUnlockTimer()
  
  if (isLocked.value && !isMyLock.value) {
    // 他のユーザーがロック中の場合、フォーカスを外す
    textareaRef.value?.blur()
    return
  }

  if (!isMyLock.value) {
    // ロックを取得
    const success = await handleAcquireLock()
    if (success) {
      lastContent = content.value // 初期状態を保存
      // ロック取得後、操作なしタイマーを開始（5秒）
      resetAutoUnlockTimer(5000)
    } else {
      textareaRef.value?.blur()
    }
  } else {
    // 既にロックを持っている場合も、操作なしタイマーをリセット（5秒）
    resetAutoUnlockTimer(5000)
  }
}

onMounted(async () => {
  // 初期データを取得
  try {
    const doc = await getDocument(roomId)
    content.value = doc.content || ''
    lastContent = content.value // 初期状態を保存
  } catch (error) {
    console.error('Failed to load document:', error)
  }

  // ロック状態を確認
  await handleCheckLockStatus()

  // 定期的にロック状態を確認（10秒ごと）
  lockStatusCheckInterval = setInterval(() => {
    handleCheckLockStatus()
  }, 10000)

  // WebSocketチャンネルに接続
  // document.{roomId} チャンネルをリッスン
  channel = echo.channel(`document.${roomId}`)

  // document.updated イベントを受信したら内容を更新
  channel.listen('.document.updated', (data: { roomId: string; content: string }) => {
    console.log('WebSocket受信:', data)
    // 自分のロック中は他のユーザーの更新を無視（競合を避ける）
    if (!isMyLock.value) {
      content.value = data.content
    }
  })

  // document.locked イベントを受信
  channel.listen('.document.locked', (data: { room_id: string; session_id: string; locked_at: string }) => {
    console.log('ロック取得イベント受信:', data)
    // 自分のロックの場合は既にisMyLockがtrueになっているはずなので、状態を変更しない
    if (isMyLock.value) {
      console.log('自分のロックです')
      return
    }
    // 他のユーザーがロックした場合のみ、エディタを無効化
    isLocked.value = true
    console.log('他のユーザーが編集中です')
    textareaRef.value?.setAttribute('disabled', 'true')
    errorMessage.value = '他のユーザーが編集中です'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
    stopHeartbeat()
  })

  // document.unlocked イベントを受信
  channel.listen('.document.unlocked', (data: { room_id: string; session_id: string }) => {
    console.log('ロック解放イベント受信:', data)
    isLocked.value = false
    isMyLock.value = false
    textareaRef.value?.removeAttribute('disabled')
    stopHeartbeat()
  })

  // ページ離脱時の処理
  window.addEventListener('beforeunload', handleReleaseLock)
})

// 時間フォーマット
const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => {
  // ロックを解放
  handleReleaseLock()

  // タイマーをクリア
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }
  if (lockStatusCheckInterval) {
    clearInterval(lockStatusCheckInterval)
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  if (autoUnlockTimer) {
    clearTimeout(autoUnlockTimer)
  }

  // イベントリスナーを削除
  window.removeEventListener('beforeunload', handleReleaseLock)

  // コンポーネント破棄時にチャンネルから切断
  if (channel) {
    echo.leave(`document.${roomId}`)
  }
})

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
    // ファイル選択をリセット（同じファイルを再度選択できるように）
    target.value = ''
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
  // ロックを保持していない場合はアップロードできない
  if (!isMyLock.value) {
    errorMessage.value = '編集権限がありません。他のユーザーが編集中です。'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
    return
  }

  try {
    isUploading.value = true
    errorMessage.value = ''
    const result = await uploadImage(roomId, file)
    
    // Markdown形式で画像を挿入
    const imageMarkdown = `![${file.name}](${result.url})`
    
    // テキストエリアのカーソル位置を取得
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBefore = content.value.substring(0, start)
      const textAfter = content.value.substring(end)
      
      // カーソル位置に画像を挿入（改行を追加）
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
    errorMessage.value = error.message || '画像のアップロードに失敗しました'
  } finally {
    isUploading.value = false
  }
}

// プレビュー内の画像クリック処理（現在は使用しないが、将来の拡張用に残す）
const handleImageClick = async (event: Event) => {
  // 必要に応じて実装
}

// 画像リストからの削除処理
const deleteImageFromList = async (imageUrl: string) => {
  // 他のユーザーがロックしている場合は削除できない
  if (isLocked.value && !isMyLock.value) {
    errorMessage.value = '編集権限がありません。他のユーザーが編集中です。'
    setTimeout(() => {
      errorMessage.value = ''
    }, 2000)
    return
  }

  // ロックがかかっていない場合は、自動的にロックを取得
  if (!isMyLock.value) {
    const lockAcquired = await handleAcquireLock()
    if (!lockAcquired) {
      errorMessage.value = 'ロックの取得に失敗しました'
      setTimeout(() => {
        errorMessage.value = ''
      }, 2000)
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
    
    // contentから画像のMarkdownを削除
    const escapedUrl = imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const imageMarkdownRegex = new RegExp(`!\\[.*?\\]\\(${escapedUrl}\\)`, 'g')
    content.value = content.value.replace(imageMarkdownRegex, '').trim()
    
    // 成功メッセージ
    errorMessage.value = '画像を削除しました'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Image delete error:', error)
    errorMessage.value = error.message || '画像の削除に失敗しました'
  }
}

// URLをコピーする関数
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
    errorMessage.value = 'URLのコピーに失敗しました'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 保存ボタンは削除（自動保存に置き換え）
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

