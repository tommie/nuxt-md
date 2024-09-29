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
    plugins: {
      remark: [
        // :include is a directive, and it has to have higher priority.
        { plugin: "remark-directive", after: ["mark-include"] },

        // Attributes use braces, so they must come after double brace escaping.
        { plugin: "remark-attributes", args: [{ mdx: true }], after: ["mark-escape-double-braces"] },

        "remark-definition-list",
        "remark-gfm",
      ],

      rehype: [
        "rehype-slug",
      ],
    },
  },
})
