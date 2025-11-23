<template>
  <div>
    <div class="header">
      <h2>投稿一覧</h2>
      <!-- <button @click="goToCreate" class="create-btn">新規作成</button> -->
    </div>

    <ul v-if="displayedPosts.length">
      <li v-for="post in displayedPosts" :key="post.id" @click="goToDetail(post.id!)" class="post-item">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>

        <div class="post-meta">
          <div class="post-meta-left">
            <span class="user-info">
              <img 
                v-if="post.user?.avatar" 
                :src="`data:image/png;base64,${post.user.avatar}`" 
                :alt="post.user?.name || 'ユーザー'"
                class="user-avatar"
              />
              <i v-else class="fas fa-user"></i>
              {{ post.user?.name || (post.user?.id ?? post.user_id ?? '不明') }}
            </span>
            <span class="status-label">{{ post.status }}</span>
          </div>
          <div class="post-meta-right">
            <span><i class="fas fa-edit"></i> {{ formatDate(post.created_at) }}</span>
            <span><i class="fas fa-sync-alt"></i> {{ formatDate(post.updated_at) }}</span>
          </div>
        </div>
      </li>
    </ul>
    <p v-else>投稿がありません</p>

    <!-- ページネーション -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        前へ
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        次へ
      </button>
    </div>

    <!-- Googleアドセンスをページ最下部に表示 -->
    <div v-if="!isLocalhost && posts.length > 0" class="ad-container">
      <GoogleAdsense ad-slot="7947018211" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi, type Post } from '../api/posts'
import GoogleAdsense from '@/components/GoogleAdsense.vue'

const router = useRouter()
const posts = ref<Post[]>([])
const currentPage = ref(1)
const itemsPerPage = 10 // 1ページあたりの表示件数

const isLocalhost = computed(() => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost'
})

// ページネーション計算
const totalPages = computed(() => {
  return Math.ceil(posts.value.length / itemsPerPage)
})

const displayedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return posts.value.slice(start, end)
})

// 日付フォーマット
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ja-JP')
}

// 初期データ取得
onMounted(async () => {
  posts.value = await postsApi.getAll()
  // デバッグ用: isLocalhost の値を確認
  console.log('isLocalhost:', isLocalhost.value, 'hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A')
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  object-fit: cover;
}

.status-label {
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.ad-container {
  margin: 2rem 0;
  width: 100%;
  min-width: 300px;
  display: block;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 0.25rem;
}

.page-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
}
</style>