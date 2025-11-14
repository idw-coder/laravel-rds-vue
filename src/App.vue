<template>
  <div id="app">
    <h1>Laravel API + Vue 3</h1>
    <PostList />
  </div>
</template>

<script setup lang="ts">
import PostList from './components/PostList.vue'
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
}
</style>