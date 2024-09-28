import type { Parent, Root } from "mdast";
import { toString as mdToString } from "mdast-util-to-string";
import { basename, dirname, join } from "pathe";
import type { LeafDirective } from "mdast-util-directive";
import { type Processor } from "unified";
import { visit } from "unist-util-visit";
import type { VFile, VFileData } from "vfile";
import { camelize, capitalize, hyphenate } from "@vue/shared";

/// Translates leaf directives "::include[path]" into Vue components and imports.
export function remarkInclude(this: Processor) {
  return async (tree: Root, file: VFile & { data: VFileData & { imports?: {path: string, name: string}[] } }) => {
    const files: {path: string, name: string}[] = [];

    visit(tree, "leafDirective", (node: LeafDirective, index, parent) => {
      if (node.name !== "include") return;

      files.push(include(node, index, parent));
    });

    if (files.length) {
      file.data.imports ??= [];
      file.data.imports.push(...files);
    }

    function include(node: LeafDirective, index: number, parent: Parent) {
      const path = mdToString(node);
      const name = basename(path).split(".")[0]
      // rehype-raw lower-cases all tag names, so we have to use the
      // hyphenated names in HTML.
      const elName = hyphenate(name);

      parent.children.splice(index, 1, {
        type: "html",
        value: `<${elName}></${elName}>`,
      });

      return {
        path,
        name: capitalize(camelize(name)),
      };
    }
  };
}
