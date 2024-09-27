import type { Element as HElement, Root } from "hast";
import { visit } from "unist-util-visit";

/// Merges any properties and data on <template remerge> with its first child.
export function rehypeMergeTemplateProperties() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "template" ||
        !("remerge" in node.properties) ||
        !node.content?.children[0]
      ) {
        return;
      }

      const child = node.content.children[0] as HElement;
      child.properties = { ...child.properties, ...node.properties };
      child.data = { ...child.data, ...node.data };
      delete child.properties.remerge;

      if (parent && index !== undefined) {
        parent.children.splice(index, 1, child);
      }
    });
  };
}
