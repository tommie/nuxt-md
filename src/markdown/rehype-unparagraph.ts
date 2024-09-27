// From https://github.com/remarkjs/remark-unwrap-images/blob/f200be77b863a0ac821f4d51a9d81184c5423ebf/lib/index.js

import { whitespace } from "hast-util-whitespace";
import type { Element, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

export interface RehypeUnparagraphOptions {
  // The node tags to cause unwrap if found inside a paragraph node.
  unwrapTags?: string[];

  // The maximum number of `unwrapTags` allowed in a paragraph for it
  // to be unwrapped.
  maxCount?: number;

  // Whether to remove empty paragraphs.
  removeEmpty?: boolean;
}

// Remove the wrapping paragraph for block nodes.
//
// This is a generalization of remark-unwrap-images, also capable of
// easily removing empty paragraphs.
export default function rehypeUnparagraph(options?: RehypeUnparagraphOptions) {
  const opts = {
    maxCount: 1,
    removeEmpty: false,

    ...options,

    unwrapTags: new RegExp("^(" + (options?.unwrapTags ?? ["img"]).join("|") + ")$"),
  };

  // Check if a node can be unraveled.
  function applicable(node: Element, inLink: boolean) {
    let ret = opts.removeEmpty;
    let count = 0;

    if (node.tagName !== "p") return false;

    for (const child of node.children) {
      if (child.type === "text" && whitespace(child.value)) {
        // Whitespace is ignored.
        continue;
      }

      ret = true;

      if (child.type === "element" && opts.unwrapTags.test(child.tagName)) {
        ++count;
        if (count > opts.maxCount) {
          return false;
        }
      } else if (!inLink && child.type === "element" && child.tagName === "a") {
        // Unwrappable nodes inside links count as unwrappable.
        if (!applicable(child, true)) {
          return false;
        }
      } else {
        // Other nodes do not.
        return false;
      }
    }

    return ret;
  }

  return function (tree: Root) {
    visit(tree, "element", function (node, index, parent) {
      if (parent && typeof index === "number" && applicable(node, false)) {
        parent.children.splice(index, 1, ...node.children);
        return [SKIP, index];
      }
    });
  };
}
