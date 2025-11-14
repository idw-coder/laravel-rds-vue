<template>
  <div id="app">
    <h1>Laravel API + Vue 3</h1>
    <PostForm @created="handlePostCreated" />
    <PostList :posts="posts" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PostForm from './components/PostForm.vue'
import PostList from './components/PostList.vue'
import { postsApi, type Post } from './api/posts'

const posts = ref<Post[]>([])

// 初期データ取得
onMounted(async () => {
  posts.value = await postsApi.getAll()
})

// 新規投稿作成時の処理
const handlePostCreated = (newPost: Post) => {
  posts.value.unshift(newPost) // 配列の先頭に追加
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
}
</style>