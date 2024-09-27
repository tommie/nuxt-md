/// <reference types="rehype-raw" />

import type { Properties, Root } from "hast";
import { toString as hToString } from "hast-util-to-string";
import type { Highlighter } from "shiki";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

import { rehypeMergeTemplateProperties } from "./rehype-merge-template-properties";

export type CodeToHtmlOptions = Exclude<Parameters<Highlighter["codeToHtml"]>[1], undefined>;

export function rehypeVueShiki(highlighter: Highlighter, options?: CodeToHtmlOptions) {
  return (tree: Root, file: VFile) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "pre" ||
        node.children[0]?.type !== "element" ||
        node.children[0].tagName !== "code"
      ) {
        return;
      }
      if (!parent || index === undefined) {
        return;
      }

      const className = node.children[0].properties["className"];
      if (!className) {
        return;
      }
      if (!Array.isArray(className)) {
        throw new Error(`invalid lang: ${className}`);
      }
      let lang = className
        .map(String)
        .filter((name) => name.startsWith("language-"))
        .map((name) => name.slice(9))[0];

      if (!lang) {
        return;
      }

      const properties: Properties = { remerge: "" };
      if (lang.endsWith("-vue")) {
        throw new Error(`${file.path}: *-vue highlights are not supported`);
      } else {
        properties["v-pre"] = "";
        properties["class"] = "shiki";
      }

      // rehypeRaw doesn't merge properties from the raw node to the
      // parsed content, so we wrap in <template remerge>, and after
      // Raw, we merge the nodes. The alternative is to parse the raw
      // value ourselves, and inject v-pre there. Doable, but not nice.
      parent.children.splice(index, 1, {
        type: "element",
        tagName: "template",
        properties,
        children: [
          {
            type: "raw",
            value: highlighter.codeToHtml(hToString(node), { ...options, lang }),
            position: node.position,
          },
        ],
        position: node.position,
      });
    });
  };
}

rehypeVueShiki.afterRaw = rehypeMergeTemplateProperties;
