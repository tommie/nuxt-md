import { read } from "to-vfile";
import { join, resolve } from "pathe";
import { addVitePlugin, defineNuxtModule, updateTemplates } from "@nuxt/kit";
import type { ComponentsOptions } from "@nuxt/schema";
import { createFilter } from "@rollup/pluginutils";
import { createHighlighter } from "shiki";
import type { Update as HMRUpdate } from "vite/types/hmrPayload";

import { type HtmlOptions, markdownToHtmlFragment, type VFileWithMeta } from "./markdown/html";

export type MDPagesOptions = Omit<HtmlOptions, "rootPath"> & {
  shikiOptions?: Exclude<Parameters<typeof createHighlighter>[0], undefined>,
};

export default defineNuxtModule({
  meta: {
    name: "md-pages",
    configKey: "mdPages",
  },

  async setup(options: MDPagesOptions, nuxt) {
    nuxt.options.extensions.push(".md");

    const copts: ComponentsOptions =
      typeof nuxt.options.components === "object" && !Array.isArray(nuxt.options.components)
        ? nuxt.options.components
        : {
            // The components module actually handles undefined as true, despite the typings.
            dirs: undefined as unknown as string[],
            global: !Array.isArray(nuxt.options.components) ? nuxt.options.components : undefined,
          };
    copts.transform ||= {};
    copts.transform.include ||= [];
    nuxt.options.components = copts;

    const pagesDir = nuxt.options.dir.pages ?? "pages";
    const pagesRE = "(^|/)" + join(pagesDir, ".*") + "\\.md";
    copts.transform.include.push(new RegExp(pagesRE + "$"));

    nuxt.options.imports.transform ||= {};
    nuxt.options.imports.transform.include ||= [];
    nuxt.options.imports.transform.include.push(new RegExp(pagesRE + "$"));

    nuxt.hook("vite:extendConfig", (config) => {
      config.vue ||= {};

      let include = Array.isArray(config.vue.include) ? [...config.vue.include] : [];
      if (!config.vue.include) {
        // The Vite default.
        include = [/\.vue$/];
      } else if (!Array.isArray(config.vue.include)) {
        include.push(config.vue.include);
      }
      const pre = new RegExp(pagesRE + "$");
      if (!include.map(String).includes(pre.toString())) {
        include.push(pre);
      }
      config.vue.include = include;
    });

    const pre = new RegExp(pagesRE + "$");
    nuxt.hook("builder:watch", async (event, relativePath) => {
      if (event === "change") return;
      if (!pre.test(relativePath)) return;

      await updateTemplates({
        filter: (template) => template.filename === "routes.mjs",
      });
    });

    const shikiHighlighter = options.shikiOptions ? await createHighlighter(options.shikiOptions) : undefined;
    const shikiTheme = options.shikiTheme ?? options.shikiOptions?.themes[0];
    delete options.shikiOptions;

    const resolvedPagesDir = resolve(nuxt.options.srcDir, pagesDir);
    addVitePlugin(() => {
      const filter = createFilter([new RegExp(pagesRE + "$"), new RegExp(pagesRE + "\\?")]);

      return {
        name: "itergia:vite-plugin-remark-vue",

        handleHotUpdate(ctx) {
          const updates: HMRUpdate[] = [];
          for (const mod of ctx.server.moduleGraph.fileToModulesMap.get(ctx.file) ?? []) {
            updates.push({
              type: "js-update",
              path: mod.url,
              acceptedPath: mod.url,
              timestamp: new Date().getTime(),
              explicitImportRequired: true,
            });
          }

          ctx.server.ws.send({
            type: "update",
            updates,
          });
        },

        async load(id) {
          if (!filter(id)) return;

          const path = id.replace(/\?.*/, "");
          const md = await read(path, "utf-8");
          const html = await markdownToHtmlFragment(md, {
            shikiHighlighter,
            shikiTheme,
            ...options,
            rootPath: resolvedPagesDir,
          });

          return {
            code: htmlFragmentToVueSfc(html),
            map: { mappings: "" },
          };
        },
      };
    });
  },
});

function htmlFragmentToVueSfc(html: VFileWithMeta) {
  const meta = pageMetaFromVFile(html);
  const head = Object.fromEntries(
    [["title", meta.title ?? meta.headingTitle], ...Object.entries(meta.head ?? {})].filter(
      (k, v) => v !== undefined,
    ),
  );

  delete meta.head;

  // Wrap all content in a div to make it a well-behaved Vue component.
  return (
    `<script setup lang="ts">\n` +
    `import { useHead } from "@unhead/vue";\n` +
    `definePageMeta(${JSON.stringify(meta)});\n` +
    `useHead(${JSON.stringify(head)});\n` +
    "</script>\n" +
    "<template>\n" +
    "<div>\n" +
    `${html.toString()}\n` +
    "</div>\n" +
    "</template>\n"
  );
}

function pageMetaFromVFile(file: VFileWithMeta) {
  const meta = {
    ...file.data.matter,
  };
  if (file.data.title) {
    meta.headingTitle = file.data.title;
    if (!meta.title) {
      meta.title = file.data.title;
    }
  }
  return meta;
}
