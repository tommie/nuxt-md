import type { Parent, Root } from "mdast";
import { toString as mdToString } from "mdast-util-to-string";
import { dirname, join } from "pathe";
import type { LeafDirective } from "mdast-util-directive";
import { read } from "to-vfile";
import { type Plugin, type Processor, unified } from "unified";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

/// Injects file content for leaf directive "::include[path]".
export function remarkInclude(this: Processor) {
  const parser = this.parser;
  const proc = unified()
    .use(function () {
      this.parser = parser;
    } as Plugin<[], string, Root>)
    .use(remarkInclude);

  return async (tree: Root, file: VFile) => {
    const cwd = dirname(file.path);
    const dirs: Promise<void>[] = [];

    visit(tree, "leafDirective", (node: LeafDirective, index, parent) => {
      if (node.name !== "include") return;

      dirs.push(include(node, index, parent));
    });

    async function include(node: LeafDirective, index: number, parent: Parent) {
      const incFile = await read(join(cwd, mdToString(node)));

      const tree = proc.parse(incFile);
      if (tree.type !== "root") {
        throw new Error(`Expected a root node from remarkParse: ${tree.type}`);
      }
      await proc.run(tree, incFile);
      parent.children.splice(index, 1, ...tree.children);
    }

    await Promise.all(dirs);
  };
}
