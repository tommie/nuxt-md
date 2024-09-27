---
title: Demo
---

## Integrated Remark Plugins

[remarkParse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse)
: parses the Markdown text into a DOM tree.

[remarkFrontmatter](https://github.com/remarkjs/remark-frontmatter)
: extracts frontmatter, which is the stuff before the line with three dashes.

remarkInclude
: a custom plugin that supports the `::include[path]` directive.
  There's no safety against infinite recursion!

[remarkDirective](https://github.com/remarkjs/remark-directive)
: parses `:stuff[more]` (inline) and `:::stuff <NL> more <NL> :::` (block) syntax.

remarkDirectiveRenderer
: a custom plugin that renders the directives into spans and divs, with helpful CSS classes.

remarkEscapeDoubleBraces
: a custom plugin that escapes the Vue templating syntax, to avoid issues with `remark-attributes`.

[remarkAttributes](https://github.com/manuelmeister/remark-attributes)
: parses `{.font-ultrabold}{target=_blank}` and similar syntax for adding HTML attributes.

remarkYamlFrontMatter
: a custom plugin that parse the extracted frontmatter as YAML.

remarkHeadingData
: a custom plugin that extracts the first `<h1>`&ndash;`<h6>` of the page (if it is the first node) for use as the default page title.

[remarkDefinitionList](https://github.com/wataru-chocola/remark-definition-list)
: parses a natural syntax for lists of definitions and terms.

[remarkGFM](https://github.com/remarkjs/remark-gfm)
: supports URL autolinks, tables and task lists, among other things.

[remarkRehype](https://github.com/remarkjs/remark-rehype)
: converts the Markdown DOM to HTML DOM.

## Integrated Rehype Plugins

rehypeVueShiki
: a custom plugin to use [Shiki](https://shiki.matsu.io/) for syntax highlighting in code blocks.

[rehypeRaw](https://github.com/rehypejs/rehype-raw)
: plumbs through raw HTML.

rehypeUnparagraph
: a custom plugin based on [remark-unwrap-images](https://github.com/remarkjs/remark-unwrap-images), but ported to the HTML side so it can clean up after `rehype-raw` too.

[rehypeSlug](https://github.com/rehypejs/rehype-slug)
: adds ID attributes to headings.

rehypeRouterLink
: a custom plugin that replaces any `<a href>` element with something else.
  By default, [`<NuxtLink to>`](https://nuxt.com/docs/api/components/nuxt-link).

[rehypeStringify](https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify)
: converts the HTML DOM tree into text.

## Page Title

The page title is taken from the first found out of

1. the `title` frontmatter attribute, and
1. the first heading in the page, if it is the first element.

It doesn't matter the level of the first heading, just that there is nothing before it (other than whitespace.)

## Using Vue Components

Because `rehype-raw` lowercases tag names, you have to use kebab-case for your elements:

:::example
```html
<nuxt-link to="#integrated-remark-plugins">To Integrated Remark Plugins</nuxt-link>
```

<nuxt-link to="#integrated-remark-plugins">To Integrated Remark Plugins</nuxt-link>
:::

## Vue Templating

Using Vue template expressions with `{{Math.PI}}` is not supported, because supporting escaping them would be more work than it's worth.
Also, `remark-attributes` already uses braces for special meaning.
Use the [v-text](https://vuejs.org/api/built-in-directives.html#v-text) directive instead:

:::example
```html
<span v-text="Math.PI" />
```

<span v-text="Math.PI" />
:::

Using `v-bind` and colon syntax for attributes works as expected:

:::example
```html
<span :title="40 + 2">Hover For Answer</span>
```

<span :title="40 + 2">Hover For Answer</span>
:::

Normally, you'd wrap any complicated widgets and logic into a `components/*.vue` and use that.
