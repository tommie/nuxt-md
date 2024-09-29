---
title: Demo
---

## Plugins

See the [Plugins](./plugins) page.

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
If it wasn't treated specially, it would be turned into `<span class="directive-inline directive-include">`.

Nuxt MD doesn't define any CSS classes, but this playground contains examples of directives, used for the examples.

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
Remember that using Markdown is for increased readability, not a quirky way to make your Nuxt code special!
