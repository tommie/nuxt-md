<script setup lang="ts">
useHead({
  titleTemplate: "%s - Nuxt MD"
});
</script>

<template>
  <div>
    <h1>Welcome to Nuxt MD!</h1>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
  div {
    font-family: 'Roboto', sans-serif;
    max-width: 50rem;
    margin: 3rem auto;
  }
</style>
