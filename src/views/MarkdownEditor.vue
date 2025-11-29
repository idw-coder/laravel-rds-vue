<template>
    <div class="editor-container">
      <div class="editor-header">
        <span class="room-id">Room: {{ roomId }}</span>
      </div>
      <div class="editor-body">
        <textarea
          v-model="content"
          class="editor-input"
          placeholder="Markdown を入力..."
        ></textarea>
        <div class="editor-preview" v-html="parsedContent"></div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { marked } from 'marked'
  
  const route = useRoute()
  const roomId = route.params.roomId as string
  
  const content = ref('# Hello\n\nMarkdown で書いてみよう')
  
  const parsedContent = computed(() => {
    return marked(content.value)
  })
  </script>
  
  <style scoped>
  .editor-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
  }
  
  .editor-header {
    margin-bottom: 1rem;
  }
  
  .room-id {
    font-size: 0.8rem;
    color: #666;
    background: #f9f9f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #ddd;
  }
  
  .editor-body {
    display: flex;
    gap: 1rem;
    flex: 1;
    min-height: 0;
  }
  
  .editor-input {
    flex: 1;
    padding: 1rem;
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    resize: none;
    color: #35495e;
  }
  
  .editor-input:focus {
    outline: none;
    border-color: #35495e;
  }
  
  .editor-input::placeholder {
    color: #999;
  }
  
  .editor-preview {
    flex: 1;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    overflow-y: auto;
    background: #f9f9f9;
    color: #35495e;
    font-size: 0.8rem;
  }
  
  @media (max-width: 768px) {
    .editor-body {
      flex-direction: column;
    }
  
    .editor-input,
    .editor-preview {
      flex: none;
      height: 40vh;
    }
  }
  </style>