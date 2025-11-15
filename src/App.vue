<template>
  <div id="app">
    <h1>Laravel API + Vue 3</h1>
    <PostForm @created="handlePostCreated" />
    <PostEdit :editingPost="editingPost" @updated="handlePostUpdated" @cancel="handleEditCancel" />
    <PostList :posts="posts" @deleted="handlePostDelete" @edit="handleEdit" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue' // ref: リアクティブな変数を定義, onMounted: コンポーネントがマウントされた時に実行
import PostForm from './components/PostForm.vue'
import PostList from './components/PostList.vue'
import PostEdit from './components/PostEdit.vue'
import { postsApi, type Post } from './api/posts'

const posts = ref<Post[]>([])
const editingPost = ref<Post | null>(null)

// 初期データ取得
onMounted(async () => {
  posts.value = await postsApi.getAll()
})

// 新規投稿処理
const handlePostCreated = (newPost: Post) => {
  posts.value.unshift(newPost) // 配列の先頭に追加
}

// 編集処理
const handleEdit = (post: Post) => {
  editingPost.value = post
}

// 編集キャンセル
const handleEditCancel = () => {
  editingPost.value = null
}

// 更新処理
const handlePostUpdated = async (updatedPost: Post) => {
  await postsApi.update(updatedPost.id!, updatedPost)
  // 一覧を更新
  const index = posts.value.findIndex(p => p.id === updatedPost.id)
  if (index !== -1) {
    posts.value[index] = updatedPost
  }
  editingPost.value = null
}

// 削除処理
const handlePostDelete = async (id: number) => {
  await postsApi.delete(id)
  posts.value = posts.value.filter(post => post.id !== id)
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  font-size: 1rem;
}
</style>