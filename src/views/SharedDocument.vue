<template>
  <div class="shared-document">
    <h2>共同編集エディタ</h2>
    <p>ルームID: {{ roomId }}</p>

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
          placeholder="Markdown を入力..."
          class="markdown-input"
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

    <p v-if="errorMessage" :class="errorMessage.includes('削除しました') || errorMessage.includes('保存しました') ? 'success' : 'error'">{{ errorMessage }}</p>
    <div class="button-group">
      <button @click="handleSave" :disabled="isSaving" type="button">
        {{ isSaving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getDocument, updateDocument, uploadImage, deleteImage } from '@/api/sharedDocument'
import echo from '@/api/echo'

const route = useRoute()
const roomId = route.params.roomId as string

const content = ref('')
const isSaving = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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
// 他のユーザーが編集した内容をリアルタイムで反映
let channel: any = null

onMounted(async () => {
  // 初期データを取得
  try {
    const doc = await getDocument(roomId)
    content.value = doc.content || ''
  } catch (error) {
    console.error('Failed to load document:', error)
  }

  // WebSocketチャンネルに接続
  // document.{roomId} チャンネルをリッスン
  channel = echo.channel(`document.${roomId}`)

  // document.updated イベントを受信したら内容を更新
  channel.listen('.document.updated', (data: { roomId: string; content: string }) => {
    console.log('WebSocket受信:', data)
    content.value = data.content
  })
})

onUnmounted(() => {
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
    } else {
      // テキストエリアが取得できない場合は末尾に追加
      content.value += (content.value.length > 0 ? '\n' : '') + imageMarkdown
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

// 保存ボタン押下時
// DBに保存 → WebSocketで他のユーザーに通知
const handleSave = async () => {
  isSaving.value = true
  errorMessage.value = ''
  try {
    await updateDocument(roomId, content.value)
    errorMessage.value = '保存しました'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to save document:', error)
    errorMessage.value = '保存に失敗しました'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  margin-top: 0;
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
</style>

