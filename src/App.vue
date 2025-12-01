<template>
  <div id="app">
    <header>
      <div class="header-container">
        <router-link to="/">
          <h1>
            <i class="fas fa-rocket" style="display: none;"></i>
            <!-- スキルアップ・ポータル（仮） -->
            Laravel 12 + Vue 3
          </h1>
        </router-link>
        <nav class="nav-container">
          <div class="nav-links">
            <router-link 
              class="nav-link" 
              :class="{ 'nav-link-active': route.path === '/' || route.path.startsWith('/shared-doc/') }"
              to="/">共同エディタ</router-link>
            <!-- 投稿権限がある場合はドロップダウン -->
            <div v-if="canCreatePost" class="nav-dropdown">
              <span 
                class="nav-link nav-dropdown-trigger" 
                :class="{ 'nav-link-active': route.path.startsWith('/posts') }"
              >投稿 <i class="fas fa-caret-down"></i></span>
              <div class="nav-dropdown-menu">
                <router-link class="nav-dropdown-item" to="/posts">投稿一覧</router-link>
                <router-link class="nav-dropdown-item" to="/posts/create">新規作成</router-link>
              </div>
            </div>
            <!-- 投稿権限がない場合はシンプルなリンク -->
            <router-link 
              v-else
              class="nav-link" 
              :class="{ 'nav-link-active': route.path.startsWith('/posts') }"
              to="/posts">投稿一覧</router-link>
            <router-link 
              class="nav-link" 
              :class="{ 'nav-link-active': route.path === '/book-reviews' }"
              to="/book-reviews">技術書レビュー</router-link>
            <router-link 
              class="nav-link" 
              :class="{ 'nav-link-active': route.path === '/youtuber-list' }"
              to="/youtuber-list">YouTuber一覧</router-link>
            <router-link 
              class="nav-link" 
              :class="{ 'nav-link-active': route.path === '/typing-game' }"
              to="/typing-game">タイピングゲーム</router-link>
            <router-link 
              v-if="isAdmin"
              class="nav-link" 
              :class="{ 'nav-link-active': route.path.startsWith('/admin') }"
              to="/admin/users">管理</router-link>
          </div>

          <button class="hamburger-btn" @click="toggleMenu" aria-label="メニュー">
            <i class="fas fa-bars"></i>
          </button>

          <div class="user-menu">
            <div class="user-icon">
              <img 
                v-if="userAvatar" 
                :src="userAvatar" 
                alt="User Avatar"
                class="user-avatar-icon"
                @error="handleAvatarError"
              />
              <i v-else class="fas fa-user-circle"></i>
            </div>
            <div class="dropdown-menu">
              <router-link v-if="isLoggedIn" class="dropdown-item" to="/profile">プロフィール</router-link>
              <router-link v-if="!isLoggedIn" class="dropdown-item" to="/login">ログイン</router-link>
              <router-link v-if="!isLoggedIn" class="dropdown-item" to="/register">新規登録</router-link>
              <button v-if="isLoggedIn" @click="handleLogout" class="dropdown-item logout-item">ログアウト</button>
            </div>
          </div>

          <!-- モバイルメニュー -->
          <div v-if="isMenuOpen" class="mobile-menu">
            <router-link 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/' || route.path.startsWith('/shared-doc/') }"
              to="/" @click="closeMenu">共同エディタ</router-link>
            <router-link 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/posts' }"
              to="/posts" @click="closeMenu">投稿一覧</router-link>
            <router-link 
              v-if="canCreatePost" 
              class="mobile-menu-item mobile-menu-item-sub" 
              :class="{ 'mobile-menu-item-active': route.path === '/posts/create' }"
              to="/posts/create" @click="closeMenu">└ 新規作成</router-link>
            <router-link 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/book-reviews' }"
              to="/book-reviews" @click="closeMenu">技術書レビュー</router-link>
            <router-link 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/youtuber-list' }"
              to="/youtuber-list" @click="closeMenu">YouTuber一覧</router-link>
            <router-link 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/typing-game' }"
              to="/typing-game" @click="closeMenu">タイピングゲーム</router-link>
            <router-link 
              v-if="isAdmin"
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path.startsWith('/admin') }"
              to="/admin/users" @click="closeMenu">管理</router-link>
            <router-link 
              v-if="isLoggedIn" 
              class="mobile-menu-item" 
              :class="{ 'mobile-menu-item-active': route.path === '/profile' }"
              to="/profile" @click="closeMenu">プロフィール</router-link>
            <router-link v-if="!isLoggedIn" class="mobile-menu-item" to="/login" @click="closeMenu">ログイン</router-link>
            <router-link v-if="!isLoggedIn" class="mobile-menu-item" to="/register" @click="closeMenu">新規登録</router-link>
            <button v-if="isLoggedIn" @click="handleLogoutMobile" class="mobile-menu-item logout-item">ログアウト</button>
          </div>
        </nav>
      </div>
    </header>

    <div class="container">
      <router-view />
    </div>

    <!-- Googleアドセンスをページ最下部に表示 -->
    <div v-if="!isLocalhost" class="global-ad-container">
      <GoogleAdsense ad-slot="7947018211" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { authApi } from "./api/auth";
import { userApi, type User, type Role } from "./api/user";
import GoogleAdsense from "@/components/GoogleAdsense.vue";

const router = useRouter();
const route = useRoute();
/**
 * computedでルート変更時に自動で再評価される？
 * localStorage の変更については再評価されない
 */
// Laravel Sanctum の認証トークンでログイン状態を判定
// const isLoggedIn = computed(() => localStorage.getItem("authToken") !== null)
const isLoggedIn = ref(localStorage.getItem("authToken") !== null);
const userRoles = ref<Role[]>([]);
const userAvatar = ref<string>('');
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

// アバター画像の読み込みエラー（404など）を処理
const handleAvatarError = () => {
  userAvatar.value = '';
};

// ユーザーアバターを取得
const getUserAvatar = (): string => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return '';
    const user: any = JSON.parse(userStr);
    if (user?.id) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";
      return `${API_BASE}/avatar/${user.id}`;
    }
    return '';
  } catch {
    return '';
  }
};

// アバター情報を更新
const updateUserAvatar = () => {
  if (isLoggedIn.value) {
    userAvatar.value = getUserAvatar();
    // アバターがない場合はプロフィールAPIから取得
    if (!userAvatar.value) {
      userApi.getProfile().then((user) => {
        if (user.id) {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";
          userAvatar.value = `${API_BASE}/avatar/${user.id}`;
          // localStorageのユーザー情報を更新
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const currentUser: any = JSON.parse(userStr);
            currentUser.id = user.id;
            localStorage.setItem("user", JSON.stringify(currentUser));
          }
        }
      }).catch(() => {
        // エラーは無視
      });
    }
  } else {
    userAvatar.value = '';
  }
};

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

// 管理者かどうかチェック
const isAdmin = computed(() => {
  if (!isLoggedIn.value) return false;
  return userRoles.value.some((role) => role.name === "admin");
});

// localhostかどうかチェック（アドセンス表示制御用）
const isLocalhost = computed(() => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost';
});

// ルート変更時にログイン状態とロール情報を再チェック
router.afterEach(() => {
  const wasLoggedIn = isLoggedIn.value;
  // Laravel Sanctum の認証トークンでログイン状態を判定
  isLoggedIn.value = localStorage.getItem("authToken") !== null;
  
  // ログイン状態が変わった場合、またはログインしている場合はロール情報を更新
  if (wasLoggedIn !== isLoggedIn.value || isLoggedIn.value) {
    updateUserRoles();
    updateUserAvatar();
  }
});

// 初回マウント時にロール情報を取得
onMounted(() => {
  updateUserRoles();
  updateUserAvatar();
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
    userAvatar.value = '';
    isMenuOpen.value = false;

    router.push("/login");
  }
};

const handleLogoutMobile = async () => {
  await handleLogout();
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
#app {
  font-family: 'Noto Sans JP', sans-serif;
}

h1 {
  font-size: 1rem;
  color: #35495e;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

h1 i {
  font-size: 1.1rem;
  color: #35495e;
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
  position: relative;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #35495e;
  text-decoration: none;
}

.nav-link-active {
  color: #13283c;
  font-weight: 600;
}

.nav-dropdown {
  position: relative;
}

.nav-dropdown-trigger {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-dropdown-trigger i {
  font-size: 0.65rem;
}

.nav-dropdown-menu {
  position: absolute;
  top: 90%;
  left: 0;
  margin-top: 0.1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  min-width: 120px;
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.nav-dropdown:hover .nav-dropdown-menu {
  display: flex;
}

.nav-dropdown-item {
  padding: 0.75rem 1rem;
  color: #35495e;
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
  display: block;
}

.nav-dropdown-item:hover {
  background-color: #f9f9f9;
}

.nav-dropdown-item.router-link-exact-active {
  color: #13283c;
  background-color: #f0f9f5;
}

.hamburger-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #35495e;
  cursor: pointer;
  padding: 0.25rem;
}

.mobile-menu {
  display: flex;
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  min-width: 200px;
  margin-top: 0.5rem;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.mobile-menu-item {
  padding: 0.75rem 1rem;
  color: #35495e;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.8rem;
  border-bottom: 1px solid #eee;
}

.mobile-menu-item:last-child {
  border-bottom: none;
}

.mobile-menu-item:hover {
  background-color: #f9f9f9;
}

.mobile-menu-item-active {
  color: #13283c;
  background-color: #f0f9f5;
}

.mobile-menu-item-sub {
  padding-left: 1.5rem;
  color: #666;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hamburger-btn {
    display: block;
  }

  .mobile-menu {
    display: flex;
  }

  .user-menu {
    display: none;
  }
}

.user-menu {
  position: relative;
}

.user-icon {
  font-size: 1.5rem;
  cursor: pointer;
  /* padding: 0.25rem; */
  color: #35495e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
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
  z-index: 1;
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

.global-ad-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  min-width: 300px;
}
</style>
