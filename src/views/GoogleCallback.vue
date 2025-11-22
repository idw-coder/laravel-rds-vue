<template>
    <div class="callback-container">
      <p>Google 認証中...</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted } from "vue";
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";
  
  onMounted(async () => {
    try {
      // URL パラメータを Laravel に送信
      const res = await fetch(
        `${API_BASE}/auth/google/callback${window.location.search}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
  
      if (!res.ok) {
        throw new Error("Google 認証に失敗しました");
      }
  
      const data = await res.json();
  
      // 親ウィンドウにトークンを送信
      if (window.opener) {
        window.opener.postMessage(
          {
            authToken: data.authToken,
            user: data.user,
          },
          window.location.origin
        );
        window.close();
      }
    } catch (error: any) {
      if (window.opener) {
        window.opener.postMessage(
          {
            error: "Google 認証に失敗しました",
          },
          window.location.origin
        );
        window.close();
      }
    }
  });
  </script>
  
  <style scoped>
  .callback-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.125rem;
  }
  </style>