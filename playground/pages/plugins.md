# Plugins

### Integrated Remark

[remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse)
: parses the Markdown text into a DOM tree.

[remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
: extracts frontmatter, which is the stuff between the lines with three dashes.

mark-yaml-frontmatter
: a custom plugin that parses the extracted frontmatter as YAML.

mark-heading-data
: a custom plugin that extracts the first `<h1>`&ndash;`<h6>` of the page (if it is the first node) for use as the default page title.

mark-include
: a custom plugin that supports the `::include[path]` directive.
  It simply compiles it to a Vue component import and template element.

mark-directive-renderer
: a custom plugin that renders `:stuff[more]` (inline) and `:::stuff <NL> more <NL> :::` (block) directives into spans and divs, using helpful CSS classes.
  Only enabled if [remark-directive](https://github.com/remarkjs/remark-directive) is added.

mark-escape-double-braces
: a custom plugin that escapes the Vue templating syntax, to avoid issues with `remark-attributes`.

[remark-rehype](https://github.com/remarkjs/remark-rehype)
: converts the Markdown DOM to HTML DOM.

### Integrated Rehype

[rehype-raw](https://github.com/rehypejs/rehype-raw)
: plumbs through raw HTML from Markdown.

hype-vue-shiki
: a custom plugin to use [Shiki](https://shiki.matsu.io/) for syntax highlighting in code blocks.

hype-unparagraph
: a custom plugin based on [remark-unwrap-images](https://github.com/remarkjs/remark-unwrap-images), but ported to the HTML side so it can clean up after `rehype-raw` too.

hype-router-link
: a custom plugin that replaces any `<a href>` element with something else.
  By default, [`<nuxt-link to>`](https://nuxt.com/docs/api/components/nuxt-link).

[rehype-stringify](https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify)
: converts the HTML DOM tree into text.

### Useful Plugins

These plugins are generally useful, but are not included by default:

[remark-attributes](https://github.com/manuelmeister/remark-attributes)
: parses `{.font-ultrabold}{target=_blank}` and similar syntax for adding HTML attributes.

[remark-definition-list](https://github.com/wataru-chocola/remark-definition-list)
: creates term-description lists (like on this page.)
  Adding this also adds the required `defListHastHandlers` to `remark-rehype`.

[remark-directive](https://github.com/remarkjs/remark-directive)
: parses `:stuff[more]` (inline) and `:::stuff <NL> more <NL> :::` (block) directives, useful for call-outs.

[remark-gfm](https://github.com/remarkjs/remark-gfm)
: supports URL autolinks, tables and task lists, among other things.

[rehype-slug](https://github.com/rehypejs/rehype-slug)
: adds ID attributes to headings.

Add them under `mdPages.plugins` in your `nuxt.config.ts`.
