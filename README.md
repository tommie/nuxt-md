# Nuxt Markdown Pages

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Use `pages/*.md` files seamlessly together with `pages/*.vue` files.

<!-- - [✨ &nbsp;Release Notes](/CHANGELOG.md) -->
<!-- - [🏀 Online playground](https://stackblitz.com/github/itergia/nuxt-md?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->
- ⛰ &nbsp;Mix Vue SFC and Markdown
- 🚠 &nbsp;Works with `useRouter().getRoutes()` for easy navigation menus
- 🌲 &nbsp;Hot reload your Markdown

If [VitePress](https://vitepress.dev/) feels too limited and [Nuxt Content](https://content.nuxt.com/) does too much, then this is your golden middleground.

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-md
```

That's it! You can now use Markdown for your Nuxt pages ✨

## How does it work?

It is a Vite loader plugin that uses [remark](https://github.com/remarkjs/remark) and [rehype](https://github.com/rehypejs/rehype) to convert the page to HTML, and then wraps it as a Vue single-file component (SFC).
Vue, Vite and Nuxt takes over the processing from there.

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install

  # Generate type stubs
  npm run dev:prepare

  # Develop with the playground
  npm run dev

  # Build the playground
  npm run dev:build

  # Run ESLint
  npm run lint

  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-md/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-md

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-md.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-md

[license-src]: https://img.shields.io/npm/l/nuxt-md.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-md

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
