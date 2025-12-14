<template>
  <div class="post-edit" v-if="isLoaded">
    <h2>投稿を編集</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label>タイトル</label>
        <input v-model="form.title" type="text" required />
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
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
          />
          <div v-if="isUploading" class="upload-status">
            <div class="spinner"></div>
            <p>画像をアップロード中...</p>
          </div>
          <div v-else class="drop-zone-content">
            <p>📷 画像をドラッグ&ドロップまたはクリックして選択</p>
            <p class="drop-zone-hint">（最大5MB、JPEG/PNG/GIF/WebP）</p>
          </div>
        </div>
        <div class="content-editor">
          <textarea 
            ref="textareaRef"
            v-model="form.content" 
            required 
            placeholder="Markdown を入力..."
          ></textarea>
          <div class="content-preview" v-html="parsedContent"></div>
        </div>
      </div>
      <div>
        <label>ステータス</label>
        <select v-model="form.status" class="status-select">
          <option value="draft">下書き</option>
          <option value="published">公開</option>
        </select>
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <div class="button-group">
        <button type="submit">更新</button>
        <button type="button" @click="goBack">キャンセル</button>
      </div>
    </form>
  </div>
  <p v-else>読み込み中...</p>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import mermaid from 'mermaid'
import { postsApi, type Post } from '../api/posts'

const router = useRouter()
const route = useRoute()

const form = reactive({
  title: '',
  content: '',
  status: 'draft'
})

const isLoaded = ref(false)
const isDragOver = ref(false)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const parsedContent = computed(() => {
  const html = marked.parse(form.content) as string
  // mermaidコードブロックを検出して変換
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    '<div class="mermaid">$1</div>'
  )
})

// 現在のユーザー情報を取得
const getCurrentUser = (): { id: number; roles?: string[] } | null => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// 現在のユーザーがadminロールを持っているかチェック
const isAdmin = (): boolean => {
  const user = getCurrentUser()
  if (!user?.roles) return false
  return user.roles.includes('admin')
}

// 投稿のユーザーIDを取得
const getPostUserId = (post: Post): number | null => {
  return post.user_id || post.user?.id || null
}

// 投稿を管理できるかチェック（所有者またはadmin）
const canManagePost = (post: Post): boolean => {
  // adminは全投稿を管理可能
  if (isAdmin()) return true
  
  // 所有者は自分の投稿を管理可能
  const currentUser = getCurrentUser()
  const postUserId = getPostUserId(post)
  return currentUser?.id !== undefined && postUserId !== null && currentUser.id === postUserId
}

// Mermaidを初期化
mermaid.initialize({ startOnLoad: false })

// parsedContentが変更されたときにMermaidを再実行
watch(parsedContent, async () => {
  await nextTick()
  mermaid.run()
})

// 編集対象を取得
onMounted(async () => {
  const id = Number(route.params.id)
  const posts = await postsApi.getAll()
  const post = posts.find(p => p.id === id)
  
  if (post) {
    // 管理権限がない場合はリダイレクト
    if (!canManagePost(post)) {
      router.push('/posts')
      return
    }
    
    form.title = post.title
    form.content = post.content
    form.status = post.status
    isLoaded.value = true
    
    // 初期レンダリング後にMermaidを実行
    await nextTick()
    mermaid.run()
  }
})

const errorMessage = ref('')

const handleSubmit = async () => {
  console.log('handleSubmit called', { id: route.params.id, form })
  try {
    errorMessage.value = ''
    const id = Number(route.params.id)
    await postsApi.update(id, form)
    console.log('=== Update successful ===')
    router.push('/posts')
  } catch (error: any) {
    console.error('=== Update error ===', error)
    errorMessage.value = error.message || '更新に失敗しました'
  }
}

const goBack = () => {
  router.push('/posts')
}

// ファイル選択をトリガー
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// ファイル選択時の処理
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadImage(file)
    // ファイル選択をリセット（同じファイルを再度選択できるように）
    target.value = ''
  }
}

// ドロップ時の処理
const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await uploadImage(file)
  }
}

// 画像アップロード処理
const uploadImage = async (file: File) => {
  try {
    isUploading.value = true
    errorMessage.value = ''
    
    const result = await postsApi.uploadImage(file)
    
    // Markdown形式で画像を挿入
    const imageMarkdown = `![${file.name}](${result.url})`
    
    // テキストエリアのカーソル位置を取得
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBefore = form.content.substring(0, start)
      const textAfter = form.content.substring(end)
      
      // カーソル位置に画像を挿入（改行を追加）
      const insertText = textBefore.length > 0 && !textBefore.endsWith('\n') ? '\n' + imageMarkdown : imageMarkdown
      form.content = textBefore + insertText + (textAfter.length > 0 && !textAfter.startsWith('\n') ? '\n' : '') + textAfter
      
      // カーソル位置を画像の後に移動
      await nextTick()
      const newCursorPos = start + insertText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    } else {
      // テキストエリアが取得できない場合は末尾に追加
      form.content += (form.content.length > 0 ? '\n' : '') + imageMarkdown
    }
  } catch (error: any) {
    console.error('Image upload error:', error)
    errorMessage.value = error.message || '画像のアップロードに失敗しました'
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  margin-top: 0;
}

.post-edit {
  border: 1px solid #ddd;
  padding: 1rem;
}

.post-edit form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

textarea {
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
  font-family: 'Noto Sans JP', monospace;
  font-size: 0.875rem;
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

.content-preview :deep(h1),
.content-preview :deep(h2),
.content-preview :deep(h3) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.content-preview :deep(p) {
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

.content-preview :deep(.mermaid) {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .content-editor {
    flex-direction: column;
  }

  .content-preview {
    min-height: 150px;
  }
}

.status-select {
  width: auto;
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

button[type="submit"] {
  background-color: #41B883;
  color: white;
}

button[type="submit"]:hover {
  opacity: 0.8;
}

button[type="button"] {
  background-color: #95a5a6;
  color: white;
}

button[type="button"]:hover {
  opacity: 0.8;
}

.error {
  color: #e74c3c;
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