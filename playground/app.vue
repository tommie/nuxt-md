<script setup lang="ts">
useHead({
  titleTemplate: "%s - Nuxt MD"
});

const routes = useRouter().getRoutes();
</script>

<template>
  <div class="app">
    <h1>Welcome to Nuxt MD!</h1>

    <nav>
      <b>Navigation</b>

      <div v-for="route in routes" :key="route.name">
        {{ route.path }} {{ route.meta }}
      </div>
    </nav>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
  div.app {
    font-family: 'Roboto', sans-serif;
    max-width: 50rem;
    margin: 3rem auto;
  }

  nav {
    position: fixed;
    left: 0;
    top: 0;
    width: 20rem;
    padding: 1rem 1rem;
  }
</style>
