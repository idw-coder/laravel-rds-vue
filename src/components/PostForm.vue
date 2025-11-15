<template>
    <div class="post-form">
      <h2>投稿フォーム</h2>
      <!-- @submit.prevent: フォーム送信時のデフォルト動作を防止 -->
      <form @submit.prevent="handleSubmit">
        <div>
          <label>タイトル</label>
          <!-- v-modelは、ユーザーが入力すると自動でform.titleが更新され、form.titleが変わると入力欄も更新される -->
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
        <button type="submit">投稿</button>
      </form>
    </div>
  </template>

  <!-- setup内で定義した変数や関数はテンプレートで直接使える -->
  <script setup lang="ts">
  import { reactive } from 'vue'
  import { postsApi, type Post } from '../api/posts'
  
  // defineEmits: 親コンポーネントにイベントを送信するための関数を定義
  // <{ created: [post: Post] }> はTypeScriptの型定義
  // "created"という名前のイベントで、Post型のデータを1つ送信できる
  // 使い方: emit('created', newPost) で親に通知
  const emit = defineEmits<{
    created: [post: Post]
  }>()
  
  // reactive: オブジェクトをリアクティブ（変更を検知可能）にする
  // formのプロパティが変更されると、v-modelで紐づいた入力欄も自動更新される
  const form = reactive({
    title: '',
    content: '',
    status: 'draft'
  })
  
  // フォーム送信時の処理
  const handleSubmit = async () => {
    // APIで投稿を作成
    const newPost = await postsApi.create(form)
    // 親コンポーネントに新しい投稿を通知
    emit('created', newPost)
    // フォームをリセット
    form.title = ''
    form.content = ''
    form.status = 'draft'
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
    margin-bottom: 1rem;
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
    border-radius: 0.5rem;
    box-sizing: border-box;
  }
  
  textarea {
    min-height: 100px;
    box-sizing: border-box;
  }

  .status-select {
    width: auto;
  }
  
  button {
    background-color: #41B883;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  
  button:hover {
    opacity: 0.8;
  }
  </style>