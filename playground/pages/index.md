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
  It simply compiles it to a Vue component import and template element.

[remarkDirective](https://github.com/remarkjs/remark-directive)
: parses `:stuff[more]` (inline) and `:::stuff <NL> more <NL> :::` (block) syntax.

remarkDirectiveRenderer
: a custom plugin that renders the directives into spans and divs, using helpful CSS classes.

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
  By default, [`<nuxt-link to>`](https://nuxt.com/docs/api/components/nuxt-link).

[rehypeStringify](https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify)
: converts the HTML DOM tree into text.

## Page Title

The page title is taken from the first found out of

1. the `title` frontmatter attribute, and
1. the first heading in the page, if it is the first element.

It doesn't matter the level of the first heading, just that there is nothing before it (other than whitespace.)

## Including Files

The `include` directive can be used to insert other files:

:::example
```markdown
::include[../components/MyIncluded.md]
```

::include[../components/MyIncluded.md]
:::

### Using Vue Components

If the path looks like a component name, the [Nuxt auto-import](https://nuxt.com/docs/guide/concepts/auto-imports) resolver is used to find the included file, whether it's a Vue SFC, or Markdown file:

:::example
```markdown
::include[MyIncluded]
```

::include[MyIncluded]
:::

Because `rehype-raw` lowercases tag names, you have to use kebab-case for your elements.
Also, [Vue doesn't allow self-closing tags](https://vuejs.org/guide/essentials/component-basics.html#self-closing-tags) with kebab-case.
The previous example is the same as using normal element syntax:

:::example
```markdown
<my-included></my-included>
```

<my-included></my-included>
:::

The same goes for Vue SFCs:

:::example
```html
<nuxt-link to="#integrated-remark-plugins">To Integrated Remark Plugins</nuxt-link>
```

<nuxt-link to="#integrated-remark-plugins">To Integrated Remark Plugins</nuxt-link>
:::

## Directives

Inline directives and block directives are passed through, but CSS classes are added for you to customize.
These examples are defined as block directives:

:::example
```html
    :::example
    Oh no!
    :::
```

Oh no!
:::

They are turned into `<div class="directive-block directive-example">`.

Similarly, the `:include[MyIncluded]` is an example of an inline directive.
If they weren't treated specially, they would be turned into `<span class="directive-inline directive-include">`.

Nuxt MD doesn't define any CSS classes, but this playground contains examples, used for the examples.

## Vue Templating

Using Vue template expressions with `{{Math.PI}}` is not supported, because supporting escaping them would be more work than it's worth.
Also, `remark-attributes` already uses braces for special meaning.
Use the [v-text](https://vuejs.org/api/built-in-directives.html#v-text) directive instead:

:::example
```html
<span v-text="Math.PI"></span>
```

<span v-text="Math.PI"></span>
:::

Using `v-bind` and colon syntax for attributes works as expected:

:::example
```html
<span :title="40 + 2">Hover For Answer</span>
```

<span :title="40 + 2">Hover For Answer</span>
:::

Normally, you'd wrap any complicated widgets and logic into a `components/*.vue` and use that.
