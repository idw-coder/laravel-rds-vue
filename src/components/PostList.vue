<template>
  <div>
    <div class="header">
      <h2>投稿一覧</h2>
      <button @click="goToCreate" class="create-btn">新規作成</button>
    </div>

    <ul v-if="posts.length">
      <li v-for="post in posts" :key="post.id">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>

        <div class="status-box">
          <span class="status-label">{{ post.status }}</span>
        </div>
        <div class="button-group">
          <button @click="goToEdit(post.id!)" class="edit-btn">
            編集
          </button>
          <button @click="handleDelete(post.id!)" class="delete-btn">
            削除
          </button>
        </div>
      </li>
    </ul>
    <p v-else>投稿がありません</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi, type Post } from '../api/posts'

const router = useRouter()
const posts = ref<Post[]>([])

// 初期データ取得
onMounted(async () => {
  posts.value = await postsApi.getAll()
})

// 新規作成ページへ
const goToCreate = () => {
  router.push('/posts/create')
}

// 編集ページへ
const goToEdit = (id: number) => {
  router.push(`/posts/${id}/edit`)
}

// 削除処理
const handleDelete = async (id: number) => {
  if (confirm('本当に削除しますか？')) {
    await postsApi.delete(id)
    posts.value = posts.value.filter(post => post.id !== id)
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.create-btn {
  background-color: #41B883;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.create-btn:hover {
  opacity: 0.8;
}

ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

li {
  border: 1px solid #ddd;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  font-size: 1rem;
  margin: 0;
}

h3, p {
  margin: 0;
}

.status-label {
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: inline-block;
  font-size: 0.8rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background-color: #35495E;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
}

.edit-btn:hover {
  opacity: 0.8;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
}

.delete-btn:hover {
  opacity: 0.8;
}
</style>