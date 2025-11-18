<template>
  <div class="not-found">
    <h2>404 - ページが見つかりません</h2>
    <p>お探しのページは存在しません。</p>
    <button @click="goHome" class="home-btn">ホームに戻る</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  const isLoggedIn = localStorage.getItem("token") !== null
  router.push(isLoggedIn ? "/posts" : "/login")
}
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 2rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #35495e;
}

p {
  margin-bottom: 2rem;
  color: #666;
}

.home-btn {
  background-color: #41B883;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.home-btn:hover {
  opacity: 0.8;
}
</style>

