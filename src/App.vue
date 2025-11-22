<template>
  <div id="app">
    <header>
      <div class="header-container">
        <router-link to="/">
          <h1>Laravel API + Vue 3</h1>
        </router-link>
        <nav class="nav-container">
          <router-link class="nav-link" to="/posts">投稿一覧</router-link>
          <router-link class="nav-link" to="/typing-game">タイピングゲーム</router-link>
          <router-link v-if="canCreatePost" class="nav-link" to="/posts/create">新規作成</router-link>

          <div class="user-menu">
            <div class="user-icon">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="dropdown-menu">
              <router-link v-if="isLoggedIn" class="dropdown-item" to="/profile">プロフィール</router-link>
              <router-link v-if="!isLoggedIn" class="dropdown-item" to="/login">ログイン</router-link>
              <router-link v-if="!isLoggedIn" class="dropdown-item" to="/register">新規登録</router-link>
              <button v-if="isLoggedIn" @click="handleLogout" class="dropdown-item logout-item">ログアウト</button>
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "./api/auth";
import { userApi, type User, type Role } from "./api/user";

const router = useRouter();
/**
 * computedでルート変更時に自動で再評価される？
 * localStorage の変更については再評価されない
 */
// Laravel Sanctum の認証トークンでログイン状態を判定
// const isLoggedIn = computed(() => localStorage.getItem("authToken") !== null)
const isLoggedIn = ref(localStorage.getItem("authToken") !== null);
const userRoles = ref<Role[]>([]);

// ロールを正規化（文字列配列をオブジェクト配列に変換）
const normalizeRoles = (roles: any): Role[] => {
  if (!roles || !Array.isArray(roles)) return [];
  
  // 文字列配列の場合
  if (typeof roles[0] === 'string') {
    return roles.map((roleName: string) => ({
      name: roleName,
      label: roleName,
    }));
  }
  
  // オブジェクト配列の場合
  return roles as Role[];
};

// ユーザー情報からロールを取得
const getUserRoles = (): Role[] => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return [];
    const user: any = JSON.parse(userStr);
    return normalizeRoles(user.roles);
  } catch {
    return [];
  }
};

// ロール情報を更新
const updateUserRoles = async () => {
  if (!isLoggedIn.value) {
    userRoles.value = [];
    return;
  }

  // localStorageからロール情報を取得
  const roles = getUserRoles();
  
  // ロール情報がない場合はプロフィールAPIから取得
  if (roles.length === 0) {
    try {
      const user = await userApi.getProfile();
      const normalizedRoles = normalizeRoles(user.roles);
      userRoles.value = normalizedRoles;
      // localStorageのユーザー情報を更新
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const currentUser: any = JSON.parse(userStr);
        currentUser.roles = normalizedRoles;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
      userRoles.value = [];
    }
  } else {
    userRoles.value = roles;
  }
};

// 投稿作成権限があるかチェック（adminまたはpaidロール）
const canCreatePost = computed(() => {
  if (!isLoggedIn.value) return false;
  return userRoles.value.some(
    (role) => role.name === "admin" || role.name === "paid"
  );
});

// ルート変更時にログイン状態とロール情報を再チェック
router.afterEach(() => {
  const wasLoggedIn = isLoggedIn.value;
  // Laravel Sanctum の認証トークンでログイン状態を判定
  isLoggedIn.value = localStorage.getItem("authToken") !== null;
  
  // ログイン状態が変わった場合、またはログインしている場合はロール情報を更新
  if (wasLoggedIn !== isLoggedIn.value || isLoggedIn.value) {
    updateUserRoles();
  }
});

// 初回マウント時にロール情報を取得
onMounted(() => {
  updateUserRoles();
});

const handleLogout = async () => {
  try {
    // バックエンド側のトークンを無効化
    await authApi.logout();
  } catch (e) {
    console.error("ログアウトエラー:", e);
  } finally {
    // 成功・失敗に関わらず、フロントエンドの情報を必ず消す
    // Laravel Sanctum の認証トークンを削除
    localStorage.removeItem("authToken");
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
  height: 60px;
  margin: 0 auto;
  padding: 0 1rem;
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
