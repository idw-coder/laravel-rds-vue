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
import { ref, onMounted } from 'vue'
import { postsApi, type Post } from '../api/posts'

const posts = ref<Post[]>([])

onMounted(async () => {
  posts.value = await postsApi.getAll()
})
</script>