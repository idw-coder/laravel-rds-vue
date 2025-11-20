<template>
  <div>
    <div class="header">
      <h2>投稿一覧</h2>
      <!-- <button @click="goToCreate" class="create-btn">新規作成</button> -->
    </div>

    <ul v-if="posts.length">
      <template v-for="(post, index) in posts" :key="post.id">
        <li @click="goToDetail(post.id!)" class="post-item">
          <h3>{{ post.title }}</h3>
          <p>{{ post.content }}</p>

          <div class="post-meta">
            <div class="post-meta-left">
              <span><i class="fas fa-user"></i> {{ post.user?.name || (post.user?.id ?? post.user_id ?? '不明') }}</span>
              <span class="status-label">{{ post.status }}</span>
            </div>
            <div class="post-meta-right">
              <span><i class="fas fa-calendar-plus"></i> {{ formatDate(post.created_at) }}</span>
              <span><i class="fas fa-calendar-check"></i> {{ formatDate(post.updated_at) }}</span>
            </div>
          </div>
        </li>
        <!-- 4記事ごとにGoogleアドセンスを表示 -->
        <li v-if="(index + 1) % 4 === 0 && !isLocalhost" class="ad-item">
          <GoogleAdsense ad-slot="7947018211" />
        </li>
      </template>
    </ul>
    <p v-else>投稿がありません</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi, type Post } from '../api/posts'
import GoogleAdsense from '@/components/GoogleAdsense.vue'

const router = useRouter()
const posts = ref<Post[]>([])

const isLocalhost = computed(() => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost'
})

// 日付フォーマット
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ja-JP')
}

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
  transition: background-color 0.3s;
}

.post-item:hover {
  background-color: rgba(53, 73, 94, 0.1);
}

h2 {
  font-size: 1rem;
  margin: 0;
}

h3, p {
  margin: 0;
}

.post-meta {
  font-size: 0.75rem;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.post-meta-left,
.post-meta-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 768px) {
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.post-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.post-meta i {
  color: #999;
}

.status-label {
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.ad-item {
  border: none;
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>