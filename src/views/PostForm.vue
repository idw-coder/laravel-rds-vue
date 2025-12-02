<template>
    <div class="post-form">
      <h2>新規投稿</h2>
      <form @submit.prevent="handleSubmit">
        <div>
          <label>タイトル</label>
          <input v-model="form.title" type="text" required />
        </div>
        <div class="content-section">
          <label>内容（Markdown対応）</label>
          <div class="content-editor">
            <textarea 
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
          <button type="submit">投稿</button>
          <button type="button" @click="goBack">キャンセル</button>
        </div>
      </form>
    </div>
  </template>
  
<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { postsApi } from '../api/posts'

const router = useRouter()
const errorMessage = ref('')

const form = reactive({
  title: '',
  content: '',
  status: 'draft'
})

const parsedContent = computed(() => {
  return marked(form.content)
})
  
  const handleSubmit = async () => {
    try {
      errorMessage.value = ''
      await postsApi.create(form)
      router.push('/posts')
    } catch (error: any) {
      console.error('Create error:', error)
      errorMessage.value = error.message || '投稿の作成に失敗しました'
    }
  }
  
  const goBack = () => {
    router.push('/posts')
  }
  </script>
  
  <style scoped>
  h2 {
    font-size: 1rem;
    margin-top: 0;
  }
  
  .post-form {
    border: 1px solid #ddd;
    padding: 1rem;
  }
  
  .post-form form {
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
  box-sizing: border-box;
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
</style>