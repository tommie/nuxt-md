/// <reference types="mdast-util-to-hast" />

import { h } from "hastscript";
import type { Node, Root } from "mdast";
import type { ContainerDirective, TextDirective } from "mdast-util-directive";
import { visit } from "unist-util-visit";

export interface RemarkDirectiveRendererOptions {
  // The prefix for CSS class names. Usually ends in a dash. Defaults
  // to "directive-".
  classPrefix?: string;

  // The names of directives to handle. Defaults to all.
  names?: (string | RegExp)[];

  // A transformation function that could e.g. prepend an icon.
  htmlTransform?: (name: string, root: Node) => void;
}

// Turns directives from remark-directive into spans and divs.
//
// From https://github.com/remarkjs/remark-directive#example-styled-blocks
export function remarkDirectiveRenderer(options?: RemarkDirectiveRendererOptions) {
  const opts = {
    classPrefix: options?.classPrefix ?? "directive-",
    names: options?.names ? toRegExp(options.names) : /./,

    htmlTransform: options?.htmlTransform ?? (() => {}),
  };

  return (tree: Root) => {
    visit(tree, ["containerDirective", "textDirective"], (node: Node) => {
      // Dummy check because the typings don't understand the test.
      if (!isDirective(node)) return;

      if (opts.names.test(node.name)) {
        const tagName = node.type === "textDirective" ? "span" : "div";
        const dirType = node.type === "textDirective" ? "inline" : "block";

        node.data ??= {};
        node.data.hName = tagName;

        const props = h(tagName, node.attributes ?? undefined).properties ?? {};
        props.className ||= [];
        (props.className as string[]).push(opts.classPrefix + dirType);
        (props.className as string[]).push(opts.classPrefix + node.name);
        node.data.hProperties = props;

        if (node.children) {
          opts.htmlTransform(node.name, node);
        }
      }
    });
  };
}

function isDirective(node: Node): node is ContainerDirective | TextDirective {
  return true;
}

function toRegExp(args: (string | RegExp)[]): RegExp {
  if (args.length === 1 && args[0] instanceof RegExp) {
    return args[0];
  }

  return new RegExp(
    args
      .map((arg) => "(" + (arg instanceof RegExp ? arg.toString() : escapeRegExp(arg)) + ")")
      .join("|"),
  );
}

// From https://stackoverflow.com/a/6969486
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
