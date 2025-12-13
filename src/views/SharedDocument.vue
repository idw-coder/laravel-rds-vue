<template>
  <div class="editor-container">
    <h1>共同編集エディタ</h1>
    <p>ルームID: {{ roomId }}</p>

    <div class="editor-layout">
      <!-- Markdown入力エリア -->
      <textarea
        v-model="content"
        class="markdown-input"
        placeholder="Markdownを入力..."
      />

      <!-- プレビューエリア -->
      <div class="markdown-preview" v-html="parsedContent" />
    </div>

    <button @click="handleSave" :disabled="isSaving" class="save-button">
      {{ isSaving ? '保存中...' : '保存' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getDocument, updateDocument } from '@/api/sharedDocument'
import echo from '@/api/echo'

const route = useRoute()
const roomId = route.params.roomId as string

const content = ref('')
const isSaving = ref(false)

// Markdownをパースしてプレビュー表示
const parsedContent = computed(() => {
  return marked(content.value)
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

// 保存ボタン押下時
// DBに保存 → WebSocketで他のユーザーに通知
const handleSave = async () => {
  isSaving.value = true
  try {
    await updateDocument(roomId, content.value)
    alert('保存しました')
  } catch (error) {
    console.error('Failed to save document:', error)
    alert('保存に失敗しました')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.editor-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.markdown-input {
  width: 100%;
  min-height: 400px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
}

.markdown-preview {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  min-height: 400px;
  overflow-y: auto;
}

.save-button {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

