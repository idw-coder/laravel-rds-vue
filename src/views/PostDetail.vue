<template>
    <div class="post-detail" v-if="post">
      <div class="header">
        <h2>投稿詳細</h2>
      </div>
  
      <div class="post-content">
        <div class="status-box">
          <span class="status-label">{{ post.status }}</span>
        </div>
        
        <h3>{{ post.title }}</h3>
  
        <div class="post-body">
          <p>{{ post.content }}</p>
        </div>
  
        <div class="post-meta">
          <p><strong>作成者:</strong> {{ post.user?.name || '不明' }}</p>
          <p><strong>作成日:</strong> {{ formatDate(post.created_at) }}</p>
          <p><strong>更新日:</strong> {{ formatDate(post.updated_at) }}</p>
        </div>
  
        <div class="button-group">
          <button @click="goToEdit" class="edit-btn">編集</button>
          <button @click="handleDelete" class="delete-btn">削除</button>
        </div>
      </div>
    </div>
    <p v-else>読み込み中...</p>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { postsApi, type Post } from '@/api/posts'
  
  const router = useRouter()
  const route = useRoute()
  const post = ref<Post | null>(null)
  
  onMounted(async () => {
    const id = Number(route.params.id)
    post.value = await postsApi.getById(id)
  })
  
  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('ja-JP')
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
  
  .status-label {
    background-color: #f0f0f0;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    display: inline-block;
    font-size: 0.8rem;
  }
  
  .post-body {
    line-height: 1.6;
  }
  
  h3, p {
    margin: 0;
  }
  
  .post-meta {
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 0.5rem;
  }
  
  .post-meta p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
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