<template>
  <div>
    <h2>投稿一覧</h2>
    <ul v-if="posts.length">
      <li v-for="post in posts" :key="post.id">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>
        <small>{{ post.status }}</small>
      </li>
    </ul>
    <p v-else>投稿がありません</p>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '../api/posts'

// 親コンポーネントから受け取るprops
defineProps<{
  posts: Post[]
}>()
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}

li {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
}

h3 {
  margin-top: 0;
}

small {
  color: #666;
}
</style>