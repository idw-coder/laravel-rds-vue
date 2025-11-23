<template>
    <div class="post-detail" v-if="post">
      <div class="header">
        <h2>投稿詳細</h2>
      </div>
  
      <div class="post-content">
        <h3>{{ post.title }}</h3>
  
        <div class="post-body">
          <p>{{ post.content }}</p>
        </div>
  
        <div class="post-meta">
          <div class="post-meta-left">
            <span class="user-info">
              <img 
                v-if="post.user?.avatar" 
                :src="`data:image/png;base64,${post.user.avatar}`" 
                :alt="post.user?.name || 'ユーザー'"
                class="user-avatar"
                loading="lazy"
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
  
        <div class="button-group" v-if="isOwner">
          <button @click="goToEdit" class="edit-btn">編集</button>
          <button @click="handleDelete" class="delete-btn">削除</button>
        </div>

        <!-- Googleアドセンス -->
        <GoogleAdsense v-if="!isLocalhost" ad-slot="7947018211" />
      </div>
    </div>
    <p v-else>読み込み中...</p>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { postsApi, type Post } from '@/api/posts'
  import GoogleAdsense from '@/components/GoogleAdsense.vue'
  
  const router = useRouter()
  const route = useRoute()
  const post = ref<Post | null>(null)

  const isLocalhost = computed(() => {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
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

  // 現在のユーザーが投稿の所有者かどうか
  const isOwner = computed(() => {
    if (!post.value) return false
    const currentUserId = getCurrentUserId()
    const postUserId = getPostUserId(post.value)
    return currentUserId !== null && postUserId !== null && currentUserId === postUserId
  })
  
  onMounted(async () => {
    try {
      const id = Number(route.params.id)
      post.value = await postsApi.getById(id)
    } catch (error: any) {
      console.error('投稿の取得に失敗しました:', error)
      if (error.status === 403) {
        alert('この投稿にアクセスする権限がありません。')
      } else {
        alert(error.message || '投稿の取得に失敗しました。')
      }
      router.push('/posts')
    }
  })
  
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ja-JP')
  }
  
  const goToEdit = () => {
    router.push(`/posts/${post.value?.id}/edit`)
  }
  
  const handleDelete = async () => {
    if (confirm('本当に削除しますか？')) {
      await postsApi.delete(post.value!.id!)
      router.push('/posts')
    }
  }
  </script>
  
  <style scoped>
  .header {
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1rem;
    margin: 0;
  }
  
  .post-content {
    border: 1px solid #ddd;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  h3 {
    margin: 0;
  }
  
  .post-body {
    line-height: 1.6;
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

  @media (max-width: 768px) {
    .post-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }

  .post-meta-left,
  .post-meta-right {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .post-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .post-meta i {
    font-size: 0.5rem;
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
    border-radius: 0.25rem;
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
    border-radius: 0.25rem;
  }
  
  .delete-btn:hover {
    opacity: 0.8;
  }

  .status-label {
    background-color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  </style>