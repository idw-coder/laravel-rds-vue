<template>
  <div class="editor-container">
    <div class="editor-header">
      <span class="room-id">Room: {{ roomId }}</span>
      <button @click="saveDocument" :disabled="isSaving" class="save-btn">
        {{ isSaving ? '保存中...' : '保存' }}
      </button>
      <span v-if="saveMessage" class="save-message">{{ saveMessage }}</span>
    </div>
    <div class="editor-body">
      <textarea
        v-model="content"
        class="editor-input"
        placeholder="Markdown を入力..."
      ></textarea>
      <div class="editor-preview" v-html="parsedContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { documentApi } from '@/api/sharedDocument'

const route = useRoute()
const roomId = route.params.roomId as string

const content = ref('')
const isSaving = ref(false)
const saveMessage = ref('')

const parsedContent = computed(() => {
  return marked(content.value)
})

// 初回読み込み
onMounted(async () => {
  try {
    const doc = await documentApi.get(roomId)
    content.value = doc.content || ''
  } catch (error) {
    console.error('Failed to load document:', error)
  }
})

// 保存
const saveDocument = async () => {
  isSaving.value = true
  saveMessage.value = ''
  try {
    await documentApi.save(roomId, content.value)
    saveMessage.value = '保存しました'
    setTimeout(() => {
      saveMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed to save document:', error)
    saveMessage.value = '保存に失敗しました'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.editor-header {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.room-id {
  font-size: 0.8rem;
  color: #666;
  background: #f9f9f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #ddd;
}

.save-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  background-color: #35495e;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.save-btn:hover {
  background-color: #13283c;
}

.save-btn:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.save-message {
  font-size: 0.8rem;
  color: #27ae60;
}

.editor-body {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.editor-input {
  flex: 1;
  padding: 1rem;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  resize: none;
  color: #35495e;
}

.editor-input:focus {
  outline: none;
  border-color: #35495e;
}

.editor-input::placeholder {
  color: #999;
}

.editor-preview {
  flex: 1;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  overflow-y: auto;
  background: #f9f9f9;
  color: #35495e;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .editor-body {
    flex-direction: column;
  }

  .editor-input,
  .editor-preview {
    flex: none;
    height: 40vh;
  }
}
</style>
