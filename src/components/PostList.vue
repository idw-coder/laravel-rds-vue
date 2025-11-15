<template>
  <div>
    <h2>投稿一覧</h2>
    <ul v-if="posts.length">
      <li v-for="post in posts" :key="post.id">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>

        <div class="status-box">
          <span class="status-label">{{ post.status }}</span>
        </div>
        <div class="button-group">
          <button @click="handleEdit(post)" class="edit-btn">
            編集
          </button>
          <button @click="handleDelete(post.id!)" class="delete-btn">
            削除
          </button>
        </div>
      </li>
    </ul>
    <p v-else>投稿がありません</p>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "../api/posts";

// 親コンポーネントから受け取るprops
defineProps<{
  posts: Post[];
}>();

// 親コンポーネントにイベントを送信するための関数を定義
const emit = defineEmits<{
  deleted: [id: number];
  edit: [post: Post];
}>();

// 編集処理
const handleEdit = async (post: Post) => {
  emit("edit", post);
};

// 削除処理
const handleDelete = async (id: number) => {
  if (confirm("本当に削除しますか？")) {
    emit("deleted", id);
  }
};
</script>

<style scoped>
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

h2 {
  font-size: 1rem;
}

h3,p {
  margin: 0;
}

.status-label {
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: inline-block;
  font-size: 0.8rem;
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
