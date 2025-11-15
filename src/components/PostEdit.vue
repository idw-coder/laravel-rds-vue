<template>
    <div class="post-edit" v-if="editingPost">
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
          <button type="button" @click="handleCancel">キャンセル</button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, watch } from 'vue'
  import type { Post } from '../api/posts'
  
  const props = defineProps<{
    editingPost: Post | null
  }>()
  
  const emit = defineEmits<{
    updated: [post: Post]
    cancel: []
  }>()
  
  const form = reactive({
    title: '',
    content: '',
    status: 'draft'
  })
  
  // 編集対象が変わったらフォームに反映
  watch(() => props.editingPost, (newPost) => {
    if (newPost) {
      form.title = newPost.title
      form.content = newPost.content
      form.status = newPost.status
    }
  }, { immediate: true })
  
  const handleSubmit = () => {
    if (props.editingPost) {
      emit('updated', { ...props.editingPost, ...form })
    }
  }
  
  const handleCancel = () => {
    emit('cancel')
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
    margin-bottom: 1rem;
    background-color: #fffbea;
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
    border-radius: 0.5rem;
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
    border-radius: 0.5rem;
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