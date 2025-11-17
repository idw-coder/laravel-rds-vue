<template>
  <div id="login">
    <div class="login-container">
      <h2>ログイン</h2>

      <form @submit.prevent="handleLogin">
        <div>
          <label>Email</label>
          <input v-model="email" type="email" placeholder="test@example.com" />
        </div>

        <div>
          <label>Password</label>
          <input v-model="password" type="password" placeholder="password123" />
        </div>

        <button type="submit" :disabled="isLoading" :class="{ 'loading': isLoading }">
          {{ isLoading ? "ログイン中..." : "ログイン" }}
        </button>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
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
const isLoading = ref(false); // ローディング状態

const router = useRouter();

const handleLogin = async () => {
  try {
    errorMessage.value = "";
    isLoading.value = true; // ローディング開始

    const res = await authApi.login({
      email: email.value,
      password: password.value,
    });

    localStorage.setItem("token", res.token);

    router.push("/posts");
  } catch (e) {
    // エラーの詳細をそのまま表示
    if (e instanceof Error) {
      errorMessage.value = e.message;
    } else {
      errorMessage.value = "ログインに失敗しました";
    }
  } finally {
    isLoading.value = false; // ローディング終了
  }
};
</script>

<style scoped>
#login {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.login-container {
    max-width: 400px;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    border: 1px solid #ddd;
}
h2 {
  font-size: 1rem;
  margin-top: 0;
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
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button.loading {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% {
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
</style>
