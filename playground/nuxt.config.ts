export default defineNuxtConfig({
  compatibilityDate: '2024-09-01',
  css: ["~/assets/markdown.css"],
  devtools: { enabled: true },
  modules: ['../src/module'],
  mdPages: {
    allowDangerousHtml: true,
    shikiOptions: {
      themes: ['vitesse-light'],
      langs: ['html', 'markdown'],
    },
  },
})
