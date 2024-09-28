import type { Root as HASTRoot } from "hast";
import type { Root as ASTRoot } from "mdast";
import { toString as mdToString } from "mdast-util-to-string";
import { basename, dirname, extname, relative, resolve } from "pathe";
import remarkDirective from "remark-directive";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkAttributes from "remark-attributes";
import { defListHastHandlers, remarkDefinitionList } from "remark-definition-list";
import remarkFrontmatter from "remark-frontmatter";
import remarkGFM from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Highlighter } from "shiki";
import { hasProtocol } from "ufo";
import { type Plugin, type Processor, unified } from "unified";
import { type Node } from "unist";
import { visit } from "unist-util-visit";
import type { VFile, Data as VFileData } from "vfile";
import yaml from "yaml";

import rehypeUnparagraph from "./rehype-unparagraph";
import { rehypeVueShiki } from "./rehype-vue-shiki";
import { remarkDirectiveRenderer, type RemarkDirectiveRendererOptions } from "./remark-directive";
import { remarkInclude } from "./remark-include";

export interface HtmlOptions {
  // Tells Rehype that we want to pass along arbitrary HTML in the
  // Markdown.
  allowDangerousHtml?: boolean;

  // The name of the component to replace <a> with, e.g. <nuxt-link>.
  linkComponent?: string;

  // The root pages path.
  rootPath?: string;

  // The Shiki syntax highlighter.
  shikiHighlighter?: Highlighter;

  // The Shiki theme to use, which must have been loaded into the
  // highlighter.
  shikiTheme?: string;

  directiveRenderer?: RemarkDirectiveRendererOptions;

  rehypePlugins?: RehypePluginConfig[],
  remarkPlugins?: RemarkPluginConfig[],
}

export interface PluginConfig<Args extends any[], AST extends Node> {
  plugin: Plugin<Args, AST, void>,
  args: Args,
  name?: string,
  before?: string[],
  after?: string[],
}

export type RehypePluginConfig<Args extends any[] = any[]> = PluginConfig<Args, HASTRoot>;
export type RemarkPluginConfig<Args extends any[] = any[]> = PluginConfig<Args, ASTRoot>;

export interface VFileWithMeta extends VFile {
  data: VFileData & {
    matter?: Record<string, any>;
    title?: string;
  };
}

export async function markdownToHtmlFragment(file: VFile, options: HtmlOptions) {
  const markPlugins: PluginConfig<any[], ASTRoot>[] = [
    { plugin: remarkFrontmatter, args: [], name: "remark-frontmatter" },
    { plugin: remarkInclude, args: [], name: "remark-include" },
    { plugin: remarkDirective, args: [], name: "remark-directive", after: ["remark-include"] },
    { plugin: remarkDirectiveRenderer, args: [options?.directiveRenderer], name: "mark-directive-renderer", after: ["remark-directive"] },
    { plugin: escapeDoubleBraces, args: [], name: "mark-escape-double-braces" },
    // @ts-expect-error
    { plugin: remarkAttributes, args: [{ mdx: true }], name: "remark-attributes" },
    { plugin: yamlFrontmatter, args: [], name: "mark-yaml-frontmatter", after: ["remark-frontmatter"] },
    { plugin: headingData, args: [], name: "mark-heading-data" },
    { plugin: remarkDefinitionList, args: [], name: "remark-definition-list" },
    { plugin: remarkGFM, args: [], name: "remark-gfm" },

    ...options.remarkPlugins.map((plugin, i) => ({
      ...plugin,
      name: plugin.name ?? `_mark${i}`,
    })),
  ];

  markPlugins.push({
    plugin: remarkRehype,
    args: [{
      allowDangerousHtml: options.allowDangerousHtml,
      handlers: {
        ...defListHastHandlers,
      },
    }],
    name: "remark-rehype",
    after: markPlugins.map(plugin => plugin.name),
  });

  const hypePlugins: PluginConfig<any[], HASTRoot>[] = [
    ...options.shikiHighlighter ? [{
      plugin: rehypeVueShiki,
      name: "hype-vue-shiki",
      args: [
        options.shikiHighlighter,
        { theme: options.shikiTheme },
      ],
      before: ["rehype-raw"],
    }] : [],

    // rehype-raw lowercases tag names. Always and forever.
    // See https://github.com/inikulin/parse5/issues/116,
    // https://github.com/inikulin/parse5/issues/214.
    { plugin: rehypeRaw, args: [], name: "rehype-raw" },

    ...options.shikiHighlighter ? [{
      plugin: rehypeVueShiki.afterRaw,
      args: [],
      name: "hype-vue-shiki-after-raw",
    }] : [],

    ...options.remarkPlugins.map((plugin, i) => ({
      ...plugin,
      name: plugin.name ?? `_hype${i}`,
    })),

    {
      plugin: rehypeUnparagraph,
      args: [{
        removeEmpty: true,
        unwrapTags: ["img", ".*-.*"],
      }],
      name: "hype-unparagraph",
      after: ["rehype-raw"],
    },

    { plugin: rehypeSlug, args: [], name: "rehype-slug", after: ["rehype-raw"] },

    ...options.linkComponent !== "a" ? [{
      plugin: routerLink,
      args: [options.linkComponent ?? "nuxt-link", { rootPath: options.rootPath ?? "/" }],
      name: "hype-router-link",
    }] : [],
  ];

  hypePlugins.push({
    plugin: rehypeStringify,
    args: [{
      allowDangerousHtml: options.allowDangerousHtml,
    }],
    name: "rehype-stringify",
    after: hypePlugins.map(plugin => plugin.name),
  });

  topoSort(markPlugins);
  topoSort(hypePlugins);

  let mdproc = unified().use(remarkParse);

  for (const config of markPlugins) {
    mdproc = mdproc.use(config.plugin, ...config.args);
  }

  let hproc = mdproc as Processor<HASTRoot, HASTRoot, HASTRoot, undefined, undefined>;

  for (const config of hypePlugins) {
    hproc = hproc.use(config.plugin, ...config.args);
  }

  return (await hproc.process(file)) as VFileWithMeta;
}

/// Escapes the Vue {{ }} braces. There is no nice way to escape "{{"
/// in Markdown, so we just disallow them. Use v-text instead.
function escapeDoubleBraces() {
  return (tree: ASTRoot) => {
    visit(tree, null, (node) => {
      if ("value" in node && node.value.includes("{{")) {
        node.value = node.value.replace(/\{\{/g, "{{'{{'}}");
      }
    });
  };
}

/// Parses the frontmatter as YAML into file.data.matter.
function yamlFrontmatter() {
  return (tree: ASTRoot, file: VFile & { data: VFileData & { matter?: Record<string, any> } }) => {
    if (tree.type !== "root") return;

    const fm = tree.children[0];

    if (fm.type !== "yaml") return;

    file.data.matter = yaml.parse(fm.value);
    tree.children.splice(0, 1);
  };
}

/// Extracts the first-level heading text into file.data.title.
function headingData() {
  return (tree: ASTRoot, file: VFile & { data: VFileData & { title?: string } }) => {
    if (tree.type !== "root") return;

    const heading = tree.children[0];

    if (heading.type !== "heading") return;

    file.data.title = mdToString(heading);
  };
}

/// Converts internal links to router-link.
function routerLink(tagName: string = "nuxt-link", options: { rootPath: string }) {
  return (tree: HASTRoot, file: VFile) => {
    const cwd = dirname(file.path);
    const bname = basename(file.path, extname(file.path));

    visit(tree, "element", (node) => {
      if (node.tagName !== "a") {
        return;
      }

      const href = node.properties["href"];
      if (typeof href !== "string") {
        return;
      }

      delete node.properties["href"];

      node.properties["to"] = normalizeHref(href, cwd, bname, options.rootPath);
      node.tagName = tagName;
    });
  };
}

/// Returns an absolute path for internal hrefs.
function normalizeHref(href: string, basePath: string, fileName: string, rootPath: string) {
  if (hasProtocol(href, { acceptRelative: true })) {
    return href;
  }

  const questionIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");
  const pathEnd =
    hashIndex < 0
      ? questionIndex
      : questionIndex < 0
      ? hashIndex
      : Math.min(questionIndex, hashIndex);
  const path = pathEnd >= 0 ? href.slice(0, pathEnd) : href;
  const tail = pathEnd >= 0 ? href.slice(pathEnd) : "";

  return resolve("/" + relative(rootPath, basePath), path || fileName) + tail;
}

function topoSort<Args extends any[], AST extends Node>(plugins: (PluginConfig<Args, AST> & { name: string })[]) {
  const depMap = new Map<string, [PluginConfig<Args, AST>, string[]]>();

  for (const plugin of plugins) {
    const name = plugin.name;
    if (depMap.has(name)) {
      throw new Error(`Duplicate Nuxt MD plugin name: ${name}`);
    }

    depMap.set(name, [plugin, plugin.after ?? []]);
  }

  // The last plugin is the target that runs after all other plugins.
  const target = depMap.get(plugins[plugins.length - 1].name)!;

  for (const plugin of plugins) {
    for (const after of plugin.after ?? []) {
      if (!depMap.has(after)) {
        throw new Error(`Unknown Nuxt MD plugin name in 'after' of ${plugin.name}: ${after}`);
      }
    }

    for (const before of plugin.before ?? []) {
      if (!depMap.has(before)) {
        throw new Error(`Unknown Nuxt MD plugin name in 'before' of ${plugin.name}: ${before}`);
      }

      // Normalize befores to afters.
      depMap.get(before)![1].push(before);
    }
  }

  const out: PluginConfig<Args, AST>[] = [];

  function rec(config: PluginConfig<Args, AST>, after: string[]) {
    depMap.delete(config.name);

    for (const name2 of after) {
      const dep = depMap.get(name2);

      if (!dep) continue;

      rec(dep[0], dep[1]);
    }

    out.push(config);
  }

  rec(target[0], target[1]);

  return out;
}
