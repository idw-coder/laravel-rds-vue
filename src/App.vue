<template>
  <div id="app">
    <header v-if="isLoggedIn">
      <div class="header-container">
        <router-link to="/">
          <h1>Laravel API + Vue 3</h1>
        </router-link>
        <nav class="nav-container">
          <router-link class="nav-link" to="/posts">投稿一覧</router-link>
          <router-link class="nav-link" to="/posts/create">新規作成</router-link>

          <div class="user-menu">
            <div class="user-icon">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="dropdown-menu">
              <router-link class="dropdown-item" to="/profile">プロフィール</router-link>
              <button @click="handleLogout" class="dropdown-item logout-item">ログアウト</button>
            </div>
          </div>
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
    // バックエンド側のトークンを無効化
    await authApi.logout();
  } catch (e) {
    console.error("ログアウトエラー:", e);
  } finally {
    // 成功・失敗に関わらず、フロントエンドの情報を必ず消す
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 状態を即座に更新（router.afterEachを待たずにUIを消すため）
    isLoggedIn.value = false;

    router.push("/login");
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
#app {
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 1rem;
  color: #35495e;
  font-weight: bold;
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

.header-container > a {
  text-decoration: none;
}

.nav-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #35495e;
  text-decoration: none;
}

.user-menu {
  position: relative;
}

.user-icon {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  color: #35495e;
}

.dropdown-menu {
  position: absolute;
  top: 90%;
  right: 0;
  margin-top: 0.1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  min-width: 150px;
  display: none;
  flex-direction: column;
  overflow: hidden;
}

.user-menu:hover .dropdown-menu,
.dropdown-menu:hover {
  display: flex;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  color: #35495e;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.8rem;
}

.dropdown-item:hover {
  background-color: #f9f9f9;
}

.logout-item {
  border-top: 1px solid #eee;
  color: #e74c3c;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
