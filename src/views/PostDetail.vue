<template>
    <div class="post-detail" v-if="post">
      <div class="header">
        <h2>投稿詳細</h2>
      </div>
  
      <div class="post-content">
        <h3>{{ post.title }}</h3>
  
        <div class="post-body markdown-content" v-html="parsedContent"></div>
  
        <div class="post-meta">
          <div class="post-meta-left">
            <span class="user-info">
              <img 
                v-if="post.user?.id && !avatarError" 
                :src="`${API_BASE}/avatar/${post.user.id}`" 
                :alt="post.user?.name || 'ユーザー'"
                class="user-avatar"
                loading="lazy"
                @error="handleAvatarError"
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

      </div>
    </div>
    <p v-else>読み込み中...</p>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { marked } from 'marked'
  import { postsApi, type Post } from '@/api/posts'
  
  const router = useRouter()
  const route = useRoute()
  const post = ref<Post | null>(null)
  const avatarError = ref(false)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api"


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

  // マークダウンをHTMLに変換
  const parsedContent = computed(() => {
    if (!post.value?.content) return ''
    return marked(post.value.content)
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

  // アバター画像の読み込みエラー（404など）を処理
  const handleAvatarError = () => {
    avatarError.value = true
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

  .markdown-content :deep(h1),
  .markdown-content :deep(h2),
  .markdown-content :deep(h3) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .markdown-content :deep(h1):first-child,
  .markdown-content :deep(h2):first-child,
  .markdown-content :deep(h3):first-child {
    margin-top: 0;
  }

  .markdown-content :deep(p) {
    margin: 0.5rem 0;
  }

  .markdown-content :deep(code) {
    background: #e8e8e8;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-size: 0.85rem;
  }

  .markdown-content :deep(pre) {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 0.25rem;
    overflow-x: auto;
  }

  .markdown-content :deep(pre code) {
    background: none;
    padding: 0;
    color: inherit;
  }

  .markdown-content :deep(ul),
  .markdown-content :deep(ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  .markdown-content :deep(blockquote) {
    border-left: 3px solid #41B883;
    margin: 0.5rem 0;
    padding-left: 1rem;
    color: #666;
  }

  .markdown-content :deep(a) {
    color: #41B883;
  }

  .markdown-content :deep(table) {
    border-collapse: collapse;
    margin: 0.5rem 0;
  }

  .markdown-content :deep(th),
  .markdown-content :deep(td) {
    border: 1px solid #ddd;
    padding: 0.5rem;
  }

  .markdown-content :deep(th) {
    background: #f5f5f5;
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