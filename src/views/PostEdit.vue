<template>
  <div class="post-edit" v-if="form.title">
    <h2>投稿を編集</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label>タイトル</label>
        <input v-model="form.title" type="text" required />
      </div>
      <div>
        <label>内容</label>
        <textarea v-model="form.content" required></textarea>
      </div>
      <div>
        <label>ステータス</label>
        <select v-model="form.status" class="status-select">
          <option value="draft">下書き</option>
          <option value="published">公開</option>
        </select>
      </div>
      <div class="button-group">
        <button type="submit">更新</button>
        <button type="button" @click="goBack">キャンセル</button>
      </div>
    </form>
  </div>
  <p v-else>読み込み中...</p>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { postsApi, type Post } from '../api/posts'

const router = useRouter()
const route = useRoute()

const form = reactive({
  title: '',
  content: '',
  status: 'draft'
})

// 現在のユーザーIDを取得
const getCurrentUserId = (): number | null => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return user?.id || null
  } catch {
    return null
  }
}

// 投稿のユーザーIDを取得
const getPostUserId = (post: Post): number | null => {
  return post.user_id || post.user?.id || null
}

// 編集対象を取得
onMounted(async () => {
  const id = Number(route.params.id)
  const posts = await postsApi.getAll()
  const post = posts.find(p => p.id === id)
  
  if (post) {
    // ユーザーIDが異なる場合はリダイレクト
    const currentUserId = getCurrentUserId()
    const postUserId = getPostUserId(post)
    if (currentUserId === null || postUserId === null || currentUserId !== postUserId) {
      router.push('/posts')
      return
    }
    
    form.title = post.title
    form.content = post.content
    form.status = post.status
  }
})

const handleSubmit = async () => {
  console.log('handleSubmit called', { id: route.params.id, form })
  try {
    const id = Number(route.params.id)
    await postsApi.update(id, form)
    console.log('=== Update successful ===')
    router.push('/posts')
  } catch (error) {
    console.error('=== Update error ===', error)
    alert('更新に失敗しました: ' + (error instanceof Error ? error.message : String(error)))
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
  min-height: 100px;
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
</style>