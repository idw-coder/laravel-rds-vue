<template>
    <div id="register">
      <div class="register-container">
        <h2>新規登録</h2>
  
        <form @submit.prevent="handleRegister">
          <div>
            <label>Name</label>
            <input v-model="name" type="text" placeholder="User Name" />
          </div>
  
          <div>
            <label>Email</label>
            <input v-model="email" type="email" placeholder="free@example.com" />
          </div>
  
          <div>
            <label>Password</label>
            <input v-model="password" type="password" placeholder="password" />
          </div>
  
          <button type="submit" :disabled="isLoading" :class="{ 'loading': isLoading }">
            {{ isLoading ? "登録中..." : "登録" }}
          </button>
  
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        </form>

        <p class="login-link">
          既にアカウントをお持ちの方は
          <router-link to="/login">こちらからログイン</router-link>
        </p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import { authApi } from "@/api/auth";
  import { useRouter } from "vue-router";
  
  const name = ref("");
  const email = ref("");
  const password = ref("");
  
  const errorMessage = ref("");
  const isLoading = ref(false);
  
  const router = useRouter();
  
  const handleRegister = async () => {
    try {
      errorMessage.value = "";
      isLoading.value = true;
  
      const res = await authApi.register({
        name: name.value,
        email: email.value,
        password: password.value,
      });
  
      // Laravel Sanctum の認証トークンを保存
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
  
      router.push("/posts");
    } catch (e: any) {
      errorMessage.value = e.message ?? "登録に失敗しました";
    } finally {
      isLoading.value = false;
    }
  };
  </script>
  
  <style scoped>
  #register {
    min-height: calc(100vh - 60px - 1rem);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .register-container {
    max-width: 25rem;
    width: 100%;
    padding: 1rem;
    border: 1px solid #ddd;
    box-sizing: border-box;
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

  /* ログインリンク */
  .login-link {
    margin-top: 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: #666;
  }
  .login-link a {
    color: #41b883;
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .login-link a:hover {
    text-decoration: underline;
    color: #35a372;
  }
  </style>
  