<template>
  <div id="app">
    <header v-if="isLoggedIn">
      <div class="header-container">
        <h1>Laravel API + Vue 3</h1>
        <nav class="nav-container">
          <router-link class="nav-link" to="/posts">投稿一覧</router-link>
          <router-link class="nav-link" to="/posts/create">新規作成</router-link>

          <button @click="handleLogout" class="logout-btn">ログアウト</button>
        </nav>
      </div>
    </header>

    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "./api/auth";

const router = useRouter();
/**
 * computedでルート変更時に自動で再評価される？
 * localStorage の変更については再評価されない
 */
// const isLoggedIn = computed(() => localStorage.getItem("token") !== null)
const isLoggedIn = ref(localStorage.getItem("token") !== null);

// ルート変更時にログイン状態を再チェック
router.afterEach(() => {
  isLoggedIn.value = localStorage.getItem("token") !== null;
});

const handleLogout = async () => {
  try {
    await authApi.logout();
  } catch (e) {
    console.error("ログアウトエラー:", e);
  }
  router.push("/login");
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
#app {
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 1rem;
}

header {
  margin-bottom: 1rem;
  border-bottom: 1px solid #ddd;
}

.header-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.8rem;
}

.nav-link {
  color: #35495e;
  text-decoration: none;
}

.logout-btn {
  background-color: #35495e;
  color: white;
  padding: 0.4rem 0.8rem;
  border: none;
  cursor: pointer;
}

.logout-btn:hover {
  opacity: 0.8;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
