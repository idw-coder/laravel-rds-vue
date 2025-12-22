<template>
  <div class="editor-home">
    <div class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h2>シンプル<br class="sp-only" />登録なしで<br />リアルタイム共同編集</h2>
        <p class="editor-home-description">
          <span class="editor-home-description-item"><i class="fas fa-check"></i>ログイン不要</span>
          <span class="editor-home-description-item"><i class="fas fa-check"></i>メールで共有</span>
          <span class="editor-home-description-item"><i class="fas fa-check"></i>無料で使える</span>
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
  router.push(`/shared-doc/${roomId}`);
};
</script>

<style scoped>
.editor-home {
  display: flex;
  flex-direction: column;
  min-height: 80vh;
  justify-content: center;
}

.hero-section {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  background-image: url('/images/business-woman04.jpg');
  background-size: cover;
  background-position: center center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 3rem;
}

h2 {
  color: white;
  font-size: clamp(2rem, 2.5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.5;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.05em;
}

.sp-only {
  display: none;
}

.editor-home-description {
  color: #fff;
  margin: 0 0 2rem 0;
  font-size: clamp(1rem, 1.2vw, 1.2rem);
  font-weight: 500;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  display: flex;
  gap: 1rem;
}

.editor-home-description-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding-bottom: 0.2rem;
}

.editor-home-description-item i {
  font-size: 0.9em;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: #fff;
  color: #333;
  border: none;
  cursor: pointer;
  line-height: 1.2;
  transition: opacity 0.3s;
}

.create-btn:hover {
    opacity: 0.8;
}

.create-btn i {
  font-size: 0.75rem;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .hero-section {
    min-height: 75vh;
  }

  .hero-content {
    padding: 1rem;
  }

  .hero-overlay {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  }

  .sp-only {
    display: block;
  }

  h2 {
    font-size: 1.2rem;
  }

  .editor-home-description {
    /* font-size: 0.7rem; */
    flex-direction: column;
    gap: 0.3rem;
  }
}
</style>

