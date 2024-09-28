import type { Root as HASTRoot } from "hast";
import type { Root as ASTRoot } from "mdast";
import { read } from "to-vfile";
import { join, resolve } from "pathe";
import { addVitePlugin, defineNuxtModule, updateTemplates } from "@nuxt/kit";
import type { ComponentsOptions } from "@nuxt/schema";
import { createFilter } from "@rollup/pluginutils";
import { createHighlighter } from "shiki";
import { type Plugin } from "unified";
import type { Data as VFileData } from "vfile";
import type { Update as HMRUpdate } from "vite/types/hmrPayload";

import { markdownToHtmlFragment } from "./markdown/html";
import type { HtmlOptions, RehypePlugin, RehypePluginConfig, RemarkPlugin, RemarkPluginConfig, VFileWithMeta } from "./markdown/html";

export type MDPagesOptions = Omit<HtmlOptions, "rootPath"> & {
  shikiOptions?: Exclude<Parameters<typeof createHighlighter>[0], undefined>,
  dir?: {
    // The directory to look for included Markdown files in. Defaults
    // to `components`.
    markdown?: string,
  },
  plugins?: {
    // Additional plugins to process Markdown with Remark, before it's
    // translated to HTML.
    remark?: MDPagesRemarkPluginConfig[],

    // Additional plugins to process HTML with Rehype, after
    // translation from Markdown.
    rehype?: MDPagesRehypePluginConfig[],
  },
};

export type MDPagesRehypePluginConfig<Args extends any[] = any[]> = string | RehypePlugin<Args> | (Omit<RehypePluginConfig<Args>, "plugin" | "args"> & {
  plugin: string | RehypePluginConfig<Args>["plugin"],
  args?: RehypePluginConfig<Args>["args"],
});

export type MDPagesRemarkPluginConfig<Args extends any[] = any[]> = string | RemarkPlugin<Args> | (Omit<RemarkPluginConfig<Args>, "plugin" | "args"> & {
  plugin: string | RemarkPluginConfig<Args>["plugin"],
  args?: RemarkPluginConfig<Args>["args"],
});

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
    copts.transform ??= {};
    copts.transform.include ??= [];
    nuxt.options.components = copts;

    const pagesDir = nuxt.options.dir.pages ?? "pages";
    const pagesRE = "(^|/)" + join(pagesDir, ".*") + "\\.md";
    const componentsDir = options.dir?.markdown ?? "components";
    const markdownRE = `(^|/)(${pagesDir}|${componentsDir})/.*\\.md`;
    copts.transform.include.push(new RegExp(markdownRE + "$"));

    nuxt.options.imports.transform ??= {};
    nuxt.options.imports.transform.include ??= [];
    nuxt.options.imports.transform.include.push(new RegExp(markdownRE + "$"));

    nuxt.hook("vite:extendConfig", (config) => {
      config.vue ??= {};

      let include = Array.isArray(config.vue.include) ? [...config.vue.include] : [];
      if (!config.vue.include) {
        // The Vite default.
        include = [/\.vue$/];
      } else if (!Array.isArray(config.vue.include)) {
        include.push(config.vue.include);
      }
      const pre = new RegExp(markdownRE + "$");
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

    const rehypePlugins = await loadRehypePlugins(options.plugins?.rehype ?? []);
    const remarkPlugins = await loadRemarkPlugins(options.plugins?.remark ?? []);
    delete options.plugins;

    const resolvedPagesDir = resolve(nuxt.options.srcDir, pagesDir);
    addVitePlugin(() => {
      const filter = createFilter([new RegExp(markdownRE + "(\\?|$)")]);

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
          const isPage = pre.test(path);
          const md = await read(path, "utf-8");
          const html = await markdownToHtmlFragment(md, {
            shikiHighlighter,
            shikiTheme,
            ...options,
            rootPath: resolvedPagesDir,

            rehypePlugins,
            remarkPlugins,
          });

          return {
            code: htmlFragmentToVueSfc(html, isPage),
            map: { mappings: "" },
          };
        },
      };
    });
  },
});

async function loadRehypePlugins(plugins: MDPagesRehypePluginConfig[]): Promise<RehypePluginConfig[]> {
  return Promise.all(plugins.map(async (plugin) => {
    if (typeof plugin === "string") {
      const imp = await import(plugin);

      return {
        plugin: imp as Plugin<any[], HASTRoot, void>,
        args: [],
        name: plugin,
      };
    } else if ("plugin" in plugin) {
      return {
        args: [],
        ...plugin,
        plugin: typeof plugin.plugin === "string" ? await import(plugin.plugin) as Plugin<any[], HASTRoot, void> : plugin.plugin,
        name: typeof plugin.plugin === "string" ? plugin.plugin : undefined,
      };
    } else {
      return {
        plugin,
        args: [],
      };
    }
  }));
}

async function loadRemarkPlugins(plugins: MDPagesRemarkPluginConfig[]): Promise<RemarkPluginConfig[]> {
  return Promise.all(plugins.map(async (plugin) => {
    if (typeof plugin === "string") {
      const imp = await import(plugin);

      return {
        plugin: imp as Plugin<any[], ASTRoot, void>,
        args: [],
        name: plugin,
      };
    } else if ("plugin" in plugin) {
      return {
        args: [],
        ...plugin,
        plugin: typeof plugin.plugin === "string" ? await import(plugin.plugin) as Plugin<any[], ASTRoot, void> : plugin.plugin,
        name: typeof plugin.plugin === "string" ? plugin.plugin : undefined,
      };
    } else {
      return {
        plugin,
        args: [],
      };
    }
  }));
}

function htmlFragmentToVueSfc(html: VFileWithMeta, isPage: boolean) {
  const imports = importsFromVFile(html);
  const meta = pageMetaFromVFile(html);
  const head = Object.fromEntries(
    [["title", meta.title ?? meta.headingTitle], ...Object.entries(meta.head ?? {})].filter(
      (k, v) => v !== undefined,
    ),
  );

  delete meta.head;

  const headScript = !isPage ? "" : (
    `import { useHead } from "@unhead/vue";\n` +
    `definePageMeta(${JSON.stringify(meta)});\n` +
    `useHead(${JSON.stringify(head)});\n`
  );

  // Wrap all content in a div to make it a well-behaved Vue component.
  return (
    `<script setup lang="ts">\n` +
    imports +
    headScript +
    "</script>\n" +
    "<template>\n" +
    "<div>\n" +
    `${html.toString()}\n` +
    "</div>\n" +
    "</template>\n"
  );
}

// Vue is not very specific about valid component names, but they must
// start with a capital letter, unless they're using the hyphenated
// form (which Nuxt doesn't do.):
//
// https://github.com/vuejs/core/blob/29de6f8b0bb1a604f247b0712daac29e93aa6f3e/packages/compiler-core/src/parser.ts#L780
const COMPONENT_NAME_RE = /^[A-Z]\w+$/;

function importsFromVFile(file: VFileWithMeta & { data: VFileData & { imports?: { path: string, name: string }[] } }) {
  // If there is no slash in the path, we rely on Nuxt auto importing.
  return (file.data.imports ?? [])
    .filter(imp => !COMPONENT_NAME_RE.test(imp.path))
    .map(imp => `import ${imp.name} from "${imp.path}";\n`).join("");
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
