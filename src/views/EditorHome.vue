<template>
    <div class="editor-home">
      <div class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h2>シンプル、登録なしで<br class="sp-only">リアルタイム共同編集</h2>
          <p class="editor-home-description">
            ログインなし ／ リアルタイム共同編集 ／ メールで共有
          </p>
          <button @click="createRoom" class="create-btn">
            新しいルームを作成
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from "vue-router";
  
  const router = useRouter();
  
  const createRoom = () => {
    const roomId = crypto.randomUUID();
    router.push(`/editor/${roomId}`);
  };
  </script>
  
  <style scoped>
  .editor-home {
    width: 100%;
  }
  
  /* ヒーローセクション */
  .hero-section {
    position: relative;
    /* 高さは少し抑えめにして標準的な印象に */
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('/images/business-pc03.jpg');
    background-size: cover;
    background-position: center;
    color: #ffffff;
  }
  
  .hero-overlay {
    position: absolute;
    inset: 0;
    /* オーバーレイは少し濃くして文字を読みやすく */
    background: rgba(30, 40, 50, 0.8);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 2rem; /* 余白を調整 */
    max-width: 800px;
    margin: 0 auto;
  }
  
  h2 {
    /* フォントサイズを少し抑えて落ち着いた印象に */
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0; /* 下の余白を増やす */
    line-height: 1.3;
    /* シャドウを少し弱く */
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  .editor-home-description {
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 3rem 0; /* 下の余白を増やす */
    font-size: 1.1rem;
    font-weight: 400; /* ウェイトを標準に戻す */
    letter-spacing: 0.05em; /* 少し字間を空ける */
  }
  
  /* ボタンデザインの刷新 (border-radiusなしのフラットデザイン) */
  .create-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 3rem; /* 横幅を広げる */
    font-size: 1rem;
    font-weight: 600;
    background: #ffffff;
    color: #333333; /* 文字色を少し濃く */
    border: none;
    border-radius: 0; /* ★ご指示通り角を直角に */
    cursor: pointer;
    transition: all 0.2s ease;
    /* 影をなくして完全なフラットデザインに */
    box-shadow: none;
  }
  
  .create-btn:hover {
    /* ホバー時は背景色を少しグレーに */
    background: #e6e6e6;
    /* 浮き上がるエフェクトは削除 */
    transform: none;
  }
  
  .create-btn i {
    font-size: 0.9rem;
    transition: transform 0.2s ease;
  }
  
  .create-btn:hover i {
    transform: translateX(4px);
  }
  
  /* ユーティリティ */
  .sp-only {
    display: none;
  }
  
  /* レスポンシブ */
  @media (max-width: 768px) {
    .hero-section {
      min-height: 60vh;
    }
  
    .sp-only {
      display: block;
    }
  
    h2 {
      font-size: 1.75rem;
      margin-bottom: 1rem;
    }
  
    .editor-home-description {
      font-size: 1rem;
      margin-bottom: 2rem;
    }
  
    .create-btn {
      padding: 0.875rem 2.5rem;
      width: 100%; /* スマホではボタンを幅いっぱいに */
      justify-content: center;
    }
  }
  </style>