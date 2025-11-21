<template>
  <div id="login">
    <div class="login-container">
      <h2>ログイン</h2>

      <form @submit.prevent="handleLogin">
        <div>
          <label>Email</label>
          <input v-model="email" type="email" placeholder="free@example.com" />
        </div>

        <div>
          <label>Password</label>
          <input v-model="password" type="password" placeholder="password" />
        </div>

        <button type="submit" :disabled="isLoading" :class="{ 'loading': isLoading }">
          {{ isLoading ? "ログイン中..." : "ログイン" }}
        </button>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>

      <p class="register-link">
        アカウントをお持ちでない方は
        <router-link to="/register">こちらから新規登録</router-link>
      </p>

      <!-- 区切り線 -->
      <div class="divider">または</div>

      <!-- Google ログインボタン -->
      <button @click="handleGoogleLogin" class="google-btn" :disabled="isLoading">
        <img src="https://www.google.com/favicon.ico" alt="Google" />
        Google でログイン
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "@/api/auth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const router = useRouter();

// 既存のメール・パスワードログイン
const handleLogin = async () => {
  try {
    errorMessage.value = "";
    isLoading.value = true;

    const res = await authApi.login({
      email: email.value,
      password: password.value,
    });

    // Laravel Sanctum の認証トークンを保存
    localStorage.setItem("authToken", res.token);
    
    // ユーザー情報を保存
    localStorage.setItem("user", JSON.stringify(res.user));

    router.push("/posts");
  } catch (e) {
    if (e instanceof Error) {
      errorMessage.value = e.message;
    } else {
      errorMessage.value = "ログインに失敗しました";
    }
  } finally {
    isLoading.value = false;
  }
};

// Google ログイン
const handleGoogleLogin = async () => {
  try {
    errorMessage.value = "";
    isLoading.value = true;

    // Google 認証 URL を取得
    const googleAuthUrl = await authApi.getGoogleAuthUrl();

    // ポップアップで Google 認証画面を開く
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      googleAuthUrl,
      "Google Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // ポップアップからのメッセージを待つ
    window.addEventListener("message", handleGoogleCallback);
  } catch (err: any) {
    errorMessage.value = "Google ログインの開始に失敗しました";
    isLoading.value = false;
  }
};

// Google 認証完了後の処理
const handleGoogleCallback = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return;

  if (event.data.token) {
    // Laravel Sanctum の認証トークンを保存
    localStorage.setItem("authToken", event.data.token);
    
    // ユーザー情報を保存
    localStorage.setItem("user", JSON.stringify(event.data.user));
    window.removeEventListener("message", handleGoogleCallback);
    isLoading.value = false;
    router.push("/posts");
  } else if (event.data.error) {
    errorMessage.value = event.data.error;
    isLoading.value = false;
  }
};
</script>

<style scoped>
#login {
  min-height: calc(100vh - 60px - 1rem);
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-container {
  max-width: 25rem;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
  border: 1px solid #ddd;
}
h2 {
  font-size: 1rem;
  margin-top: 0;
  text-align: center;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 0.5rem;
  background-color: #41b883;
  color: white;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

button:hover {
  opacity: 0.8;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button.loading {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    background-color: #41b883;
  }
  50% {
    background-color: #35a372;
  }
}
.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}

/* 区切り線 */
.divider {
  margin: 1rem 0;
  text-align: center;
  color: #666;
  font-size: 0.8rem;
}

/* Google ログインボタン */
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: white;
  color: #444;
  border: 1px solid #ddd;
  margin-top: 0;
  font-size: 0.9rem;
}
.google-btn img {
  width: 1.125rem;
  height: 1.125rem;
}
.google-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

/* 新規登録リンク */
.register-link {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
}
.register-link a {
  color: #41b883;
  text-decoration: none;
  transition: color 0.3s ease;
}
.register-link a:hover {
  text-decoration: underline;
  color: #35a372;
}
</style>