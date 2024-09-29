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

## Configuration

Additional configuration items are possible in `nuxt.config.ts`:

```typescript
mdPages: {
  // Allow <script> and similar "dangerous HTML." Defaults to false.
  allowDangerousHtml: boolean;

  // The name of the component to replace <a> with. Must accept the `to` property.
  // Defaults to <nuxt-link>.
  linkComponent: string;

  // Configuration of the remark-directive renderer plugin.
  directiveRenderer: {
    // The prefix for CSS class names. Usually ends in a dash. Defaults
    // to "directive-".
    classPrefix: string;

    // The names of directives to handle. Defaults to all.
    names: (string | RegExp)[];

    // A transformation function that could e.g. prepend an icon.
    htmlTransform: (name: string, root: Node) => void;
  },

  // Enables and configures Shiki. You have to provide `themes` and `langs` for
  // it to do anything. The selected theme is the first in `themes`. Defaults
  // to disabled.
  shikiOptions: Exclude<Parameters<typeof createHighlighter>[0], undefined>;

  dir: {
    // The directory to look for included Markdown files in. Defaults
    // to `components`.
    markdown: string;
  };

  plugins: {
    // Additional plugins to process Markdown with Remark, before it's
    // translated to HTML.
    remark: PluginConfig[];

    // Additional plugins to process HTML with Rehype, after
    // translation from Markdown.
    rehype: PluginConfig[];
  };
}
```

Plugins can be added in various ways, and are topologically sorted to support dependencies:

```typescript
type PluginConfig = string | Plugin | {
  plugin: string | Plugin;
  args: any[];              // Often just contains an options object.
  after: string[];          // Which plugins must be run before this.
  before: string[];         // Which plugins must be run after this.

  name: string;             // Only needed if `plugin` was an object, and you
                            // need to reference this plugin in an `after` or `before`.
};
```
Where `Plugin` is an imported plugin object.

If a string is used, it's imported, and expects the default import to be a `Plugin`.

See [`playground/nuxt.config.ts`](playground/nuxt.config.ts) for example plugin configurations.

## Writing Pages

By default, writing `pages/**/*.md` pages or `components/**/*.md` will work as you'd expect.

The page title (what you normally set with `useHead({ title })` is either taken from the `title` frontmatter property, or the first heading (if there is nothing before it.)

The templates don't support the Vue mustasche syntax ({{1+2}}), but `<span v-text="1+2"></span>` works.

You can include other components using `::include[MyIncluded]`, whether it's an SFC or Markdown file.
Using paths is supported, but otherwise the Nuxt auto-imports resolve the component name for you.

Navigation menus can be built using `useRouter().useRoutes()`, like with normal Nuxt pages.

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
