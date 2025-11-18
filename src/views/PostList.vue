<template>
  <div>
    <div class="header">
      <h2>投稿一覧</h2>
      <!-- <button @click="goToCreate" class="create-btn">新規作成</button> -->
    </div>

    <ul v-if="posts.length">
      <li v-for="post in posts" :key="post.id" @click="goToDetail(post.id!)" class="post-item">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>

        <div class="status-box">
          <span class="status-label">{{ post.status }}</span>
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

// 詳細ページへ（追加）
const goToDetail = (id: number) => {
  router.push(`/posts/${id}`)
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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

.post-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-item:hover {
  background-color: #f9f9f9;
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
</style>