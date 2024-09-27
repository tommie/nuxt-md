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
import { unified } from "unified";
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
}

export interface VFileWithMeta extends VFile {
  data: VFileData & {
    matter?: Record<string, any>;
    title?: string;
  };
}

export async function markdownToHtmlFragment(file: VFile, options: HtmlOptions) {
  let proc = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkInclude)
    .use(remarkDirective)
    .use(remarkDirectiveRenderer, options?.directiveRenderer)
    .use(escapeDoubleBraces)
    // @ts-expect-error
    .use(remarkAttributes, { mdx: true })
    .use(yamlFrontmatter)
    .use(headingData)
    .use(remarkDefinitionList)
    .use(remarkGFM)
    .use(remarkRehype, {
      allowDangerousHtml: options.allowDangerousHtml,
      handlers: {
        ...defListHastHandlers,
      },
    });

  if (options.shikiHighlighter) {
    proc = proc.use(rehypeVueShiki, options.shikiHighlighter, {
      theme: options.shikiTheme,
    });
  }

  // rehype-raw lowercases tag names. Always and forever.
  // See https://github.com/inikulin/parse5/issues/116,
  // https://github.com/inikulin/parse5/issues/214.
  proc = proc.use(rehypeRaw);
  if (options.shikiHighlighter) proc = proc.use(rehypeVueShiki.afterRaw);

  proc = proc
    .use(rehypeUnparagraph, {
      removeEmpty: true,
      unwrapTags: ["img", ".*-.*"],
    })
    .use(rehypeSlug);

  if (options.linkComponent !== "a") proc = proc.use(routerLink, options.linkComponent ?? "nuxt-link", { rootPath: options.rootPath ?? "/" })

  return (await proc
    .use(rehypeStringify, {
      allowDangerousHtml: options.allowDangerousHtml,
    })
    .process(file)) as VFileWithMeta;
}

/// Escapes the Vue {{ }} braces. There is no nice way to escape "{{"
/// in Markdown, so we just disallow them. Use v-text instead.
function escapeDoubleBraces() {
  return (tree: ASTRoot, file: VFile & { data: VFileData & { matter?: Record<string, any> } }) => {
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
