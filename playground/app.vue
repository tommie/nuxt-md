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

      <menu>
        <li v-for="route in routes" :key="route.name">
          <NuxtLink :to="route.path" >{{ route.meta.title ?? route.meta.headingTitle }}</NuxtLink>
        </li>
      </menu>
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

  menu {
    list-style-type: none;
  }

  menu > li:has(a.router-link-active) {
    font-weight: bold;
  }

  menu > li > a:link,
  menu > li > a:active,
  menu > li > a:visited {
    text-decoration: none;
  }

  menu > li > a:hover {
    text-decoration: underline;
  }
</style>
